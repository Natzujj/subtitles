![Banner do projeto](./Banner.png)

## PT-BR [Read this in English](./README.md)

# Close Captioner

**Uma extensão leve e 100% offline para gerar legendas em tempo real do áudio de qualquer aba do Chrome, utilizando reconhecimento de voz local (Vosk/WASM).**

---

## Por que esse projeto existe?

Enquanto assistia a vídeos e transmissões ao vivo (lives) sem legendas nativas, percebi a ausência de uma ferramenta **simples, gratuita, que funcionasse 100% offline e sem travar o navegador**. 

Esta extensão foi criada para resolver isso, trazendo:
- **Captura direta de áudio da aba**
- **Processamento 100% local** via Vosk e WebAssembly (WASM), garantindo privacidade e sem consumo de APIs pagas.
- **Suporte a múltiplos idiomas** com troca dinâmica direto pelo popup.
- **Baixo consumo de recursos**, otimizada para rodar suavemente em abas do Chrome.

---

## Tecnologias Usadas

- **HTML5 + CSS3 + Vanilla JavaScript**: Extensão leve e em código puro.
- **Chrome Extensions Manifest V3**: Utilizando `chrome.tabCapture` e `offscreen` documents para capturar o áudio limpo da aba.
- **Vosk / WASM**: Motor de reconhecimento de fala offline rodando em Web Workers.
- **PowerShell**: Automação para empacotamento e gestão dos modelos de idiomas.

---

## Instalação e Configuração (Windows)

Como a extensão roda modelos de IA otimizados localmente, você precisará baixar os arquivos de linguagem do Vosk e empacotá-los usando o script utilitário incluído.

### 1. Baixe os Modelos do Vosk
Acesse o site oficial [Alphacephei - Vosk Models](https://alphacephei.com/vosk/models) e baixe os modelos compactos na versão `small` (recomendados para extensões por serem leves e não causarem *crashes* de memória):
* Ex.: `vosk-model-small-pt-0.3.zip` (Português)
* Ex.: `vosk-model-small-en-us-0.15.zip` (Inglês)

### 2. Empacote os Modelos com o Script
Para cada arquivo `.zip` baixado, abra o **PowerShell** a partir da raiz da pasta da extensão e execute o script de automação (`tools\pack-model.ps1`):

```powershell
powershell -ExecutionPolicy Bypass -File tools\pack-model.ps1 "$env:USERPROFILE\Downloads\vosk-model-small-pt-0.3.zip"
```

* **Como funciona:** O script extrai o modelo, valida a estrutura, compacta no formato esperado pelo `vosk-browser` (`model\<idioma>.tar.gz`) e atualiza automaticamente o arquivo `model\languages.json` com a lista exibida no seletor da extensão.
* *Dica:* Se quiser definir um código de idioma personalizado, basta passá-lo como segundo argumento (ex: `... pack-model.ps1 modelo.zip pt-br`).

### 3. Instale a Extensão no Chrome
1. Acesse `chrome://extensions/`
2. Ative o **Modo do desenvolvedor** (canto superior direito).
3. Clique em **"Carregar sem compactação"** e selecione a pasta do projeto.

---

## Como Usar

1. Abra a aba do navegador com o vídeo ou live que deseja legendar.
2. Clique no ícone da extensão no popup do Chrome.
3. Escolha o **idioma** desejado no seletor.
4. Clique em **Iniciar nesta aba**.

*Nota:* Trocar o idioma com a captura ativa reinicia a legenda instantaneamente na mesma aba. Apenas um modelo permanece ativo na memória por vez para economizar recursos.

---

## Estrutura do Projeto

```plaintext
legendas-vosk/
├── manifest.json         # Manifesto da extensão (MV3)
├── background.js         # Orquestra captura, repassa legendas e histórico
├── offscreen.*           # Documento offscreen para processamento de áudio
├── audio-worklet.js      # Captura o stream de áudio da aba
├── lib/
│   ├── vosk.js           # Motor Vosk adaptado para a extensão
│   └── vosk-worker.js    # Worker de IA em background
├── content.js            # Injeção da legenda sobreposta na tela
├── conversation.*        # Modo conversa / histórico
├── popup.* + style.css   # Interface do usuário (seletor de idioma, configurações)
└── tools/
    └── pack-model.ps1    # Script utilitário em PowerShell para empacotar modelos
```

---

## Idiomas Suportados

A extensão suporta qualquer idioma oficial do Vosk que você empacotar na pasta `model\`, com gerenciamento automático via `languages.json` (incluindo Português, Inglês, Espanhol, Francês, Alemão, Japonês, entre outros).

---

## Limitações Conhecidas

- O reconhecimento depende da precisão dos modelos *small* do Vosk (ótimos para conversas gerais, mas podem requerer atenção com termos próprios ou gírias muito específicas).
- Exige o uso do Google Chrome ou navegadores compatíveis com a arquitetura de extensões Manifest V3 baseada em Chromium.