<#
  Empacota um modelo oficial do Vosk (.zip) para a extensão e registra o idioma.

  Uso (a partir de qualquer pasta):
    powershell -ExecutionPolicy Bypass -File tools\pack-model.ps1 <modelo.zip> [idioma]

  Exemplos:
    ...pack-model.ps1 "$env:USERPROFILE\Downloads\vosk-model-small-pt-0.3.zip"       -> model\pt.tar.gz
    ...pack-model.ps1 "$env:USERPROFILE\Downloads\vosk-model-small-en-us-0.15.zip"   -> model\en-us.tar.gz
    ...pack-model.ps1 modelo.zip pt-br                                                -> model\pt-br.tar.gz

  O idioma é deduzido do nome do zip; o segundo argumento só é preciso para forçar outro nome.
  O arquivo gerado leva o nome do idioma e o idioma entra em model\languages.json,
  que é a lista exibida no seletor da extensão.
#>
param(
  [Parameter(Mandatory = $true, Position = 0)][string]$Zip,
  [Parameter(Position = 1)][string]$Lang
)
$ErrorActionPreference = 'Stop'

$root     = Split-Path -Parent $PSScriptRoot
$modelDir = Join-Path $root 'model'

if (-not (Test-Path -LiteralPath $Zip)) { throw "Arquivo não encontrado: $Zip" }
$Zip = (Resolve-Path -LiteralPath $Zip).Path

# --- idioma a partir do nome: vosk-model-small-en-us-0.15 -> en-us
if (-not $Lang) {
  $name = [IO.Path]::GetFileNameWithoutExtension($Zip)
  $name = $name -replace '^vosk-model-', '' -replace '^small-', ''
  if ($name -match '^(.+?)-v?\d') { $Lang = $Matches[1] } else { $Lang = $name }
}
$Lang = $Lang.Trim().ToLower()
if ($Lang -notmatch '^[a-z0-9-]+$') {
  throw "Idioma inválido: '$Lang'. Use só letras minúsculas, números e hífen (ex.: pt, en-us). Passe o idioma como 2º argumento."
}

function Get-LangLabel([string]$code) {
  $candidates = @($code)
  if ($code -eq 'cn') { $candidates = @('zh') }
  elseif ($code.Contains('-')) { $candidates += $code.Split('-')[0] }
  foreach ($c in $candidates) {
    try {
      $n = [Globalization.CultureInfo]::GetCultureInfo($c).NativeName
      if ($n -and $n -notmatch 'Unknown|Desconhecid') { return $n.Substring(0, 1).ToUpper() + $n.Substring(1) }
    } catch { }
  }
  return $code
}

$tmp = Join-Path ([IO.Path]::GetTempPath()) ('vosk-' + [guid]::NewGuid().ToString('N'))
try {
    Write-Host "Extraindo $Zip ..."
    Expand-Archive -LiteralPath $Zip -DestinationPath $tmp

    # Localiza a pasta extraída principal dentro do temp
    $inner = Get-ChildItem -LiteralPath $tmp -Directory | Select-Object -First 1
    if (-not $inner) { throw 'O zip está vazio.' }

    $targetModelDir = Join-Path $tmp 'model'
    New-Item -ItemType Directory -Path $targetModelDir -Force | Out-Null

    # Se a pasta interna já tiver arquivos soltos do modelo (como final.mdl ou conf/am)
    if ((Test-Path -LiteralPath (Join-Path $inner.FullName 'final.mdl')) -or (Test-Path -LiteralPath (Join-Path $inner.FullName 'am'))) {
        # Move todo o conteúdo de dentro para a pasta 'model'
        Get-ChildItem -LiteralPath $inner.FullName | Move-Item -Destination $targetModelDir
    } else {
        throw 'Estrutura do modelo não reconhecida. Certifique-se de que é um zip válido do Vosk.'
    }

    if (-not (Test-Path -LiteralPath $modelDir)) { New-Item -ItemType Directory -Path $modelDir | Out-Null }
    $out = Join-Path $modelDir "$Lang.tar.gz"
    if (Test-Path -LiteralPath $out) { Remove-Item -LiteralPath $out }

    Write-Host "Compactando em $out ..."
    & tar -czf $out -C $tmp model
    if ($LASTEXITCODE -ne 0) { throw "tar falhou (código $LASTEXITCODE)." }
}
finally {
    if (Test-Path -LiteralPath $tmp) { Remove-Item -LiteralPath $tmp -Recurse -Force -ErrorAction SilentlyContinue }
}

# --- registra o idioma em model\languages.json (lista que o popup mostra)
$idx  = Join-Path $modelDir 'languages.json'
$list = @()
if (Test-Path -LiteralPath $idx) {
  try { $list = @(Get-Content -LiteralPath $idx -Raw -Encoding UTF8 | ConvertFrom-Json) } catch { $list = @() }
}
$list  = @($list | Where-Object { $_.code -ne $Lang })
$list += [pscustomobject]@{ code = $Lang; name = (Get-LangLabel $Lang) }
$list  = @($list | Sort-Object code)
$json  = ConvertTo-Json -InputObject $list -Depth 3
[IO.File]::WriteAllText($idx, $json, (New-Object Text.UTF8Encoding $false))

$mb = [math]::Round((Get-Item -LiteralPath $out).Length / 1MB, 1)
Write-Host ""
Write-Host "Pronto: model\$Lang.tar.gz ($mb MB)"
Write-Host "Idiomas instalados: $((@($list | ForEach-Object { $_.code })) -join ', ')"
Write-Host "Recarregue a extensão em chrome://extensions."
