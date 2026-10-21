const $ = (id) => document.getElementById(id);
const bg = (type, extra) => chrome.runtime.sendMessage({ target: 'bg', type, ...extra });

async function getSettings() { return (await chrome.storage.local.get('settings')).settings || {}; }
async function patchSettings(patch) {
  const s = await getSettings();
  await chrome.storage.local.set({ settings: { ...s, ...patch } });
}

async function loadLanguages() {
  try {
    const r = await fetch('model/languages.json', { cache: 'no-store' });
    if (!r.ok) return [];
    const list = await r.json();
    return Array.isArray(list) ? list : [];
  } catch (_) { return []; }
}

async function initLanguages() {
  const langs = await loadLanguages();
  const sel = $('lang');
  sel.replaceChildren();
  if (!langs.length) {
    sel.add(new Option('Nenhum modelo instalado', ''));
    sel.disabled = true;
    $('toggle').disabled = true;
    $('hint').textContent = 'Adicione um modelo com tools\\pack-model.ps1 (veja o README).';
    $('hint').classList.remove('hidden');
    return;
  }
  for (const l of langs) sel.add(new Option(l.name || l.code, l.code));
  const { lang } = await getSettings();
  sel.value = langs.some((l) => l.code === lang) ? lang : langs[0].code;
  if (sel.value !== lang) await patchSettings({ lang: sel.value });
}

async function refresh() {
  const { running, status } = await chrome.storage.session.get(['running', 'status']);
  const t = $('toggle');
  t.textContent = running ? 'Parar' : 'Iniciar nesta aba';
  t.classList.toggle('btn-danger', !!running);
  $('status').textContent = status || 'parado';
}

$('toggle').onclick = async () => {
  const { running } = await chrome.storage.session.get('running');
  const r = await bg(running ? 'stop' : 'start');
  if (r && !r.ok) $('status').textContent = 'erro: ' + r.error;
  else refresh();
};

$('lang').onchange = async () => {
  await patchSettings({ lang: $('lang').value });
  const { running } = await chrome.storage.session.get('running');
  if (running) await bg('restart'); 
};

$('conv').onclick = () =>
  chrome.windows.create({ url: chrome.runtime.getURL('conversation.html'), type: 'popup', width: 440, height: 680 });

$('toggleConfig').onclick = (e) => { e.stopPropagation(); $('configPanel').classList.toggle('hidden'); };
document.addEventListener('click', (e) => {
  if (!$('configPanel').contains(e.target)) $('configPanel').classList.add('hidden');
});

async function loadDisplaySettings() {
  const s = await getSettings();
  $('overlay').checked = s.overlay !== false;
  $('size').value = s.fontSize || 28;
}
$('overlay').onchange = () => patchSettings({ overlay: $('overlay').checked });
$('size').oninput = () => patchSettings({ fontSize: Number($('size').value) });

chrome.storage.onChanged.addListener((_c, area) => { if (area === 'session') refresh(); });
loadDisplaySettings(); initLanguages(); refresh();
