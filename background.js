// Service worker: orquestra captura, repassa legendas e guarda o histórico.

const HISTORY_LIMIT = 500;

async function ensureOffscreen() {
  const ctxs = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] });
  if (ctxs.length) return;
  await chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['USER_MEDIA'],
    justification: 'Captura do áudio da aba e reconhecimento de fala local (Vosk).'
  });
}

// Idioma escolhido no popup; se não houver, usa o primeiro modelo instalado.
async function getLang() {
  const { settings = {} } = await chrome.storage.local.get('settings');
  if (settings.lang) return settings.lang;
  try {
    const r = await fetch(chrome.runtime.getURL('model/languages.json'));
    const list = r.ok ? await r.json() : [];
    return list[0] && list[0].code;
  } catch (_) { return null; }
}

async function startCapture(tabId) {
  if (tabId == null) {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (!tab) throw new Error('Nenhuma aba ativa encontrada.');
    tabId = tab.id;
  }
  const lang = await getLang();
  if (!lang) throw new Error('Nenhum modelo instalado. Use tools\\pack-model.ps1 (veja o README).');
  await chrome.storage.session.set({ tabId, running: true, status: 'iniciando…' });
  await ensureOffscreen();
  const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tabId });
  chrome.runtime.sendMessage({ target: 'offscreen', type: 'start', streamId, lang });
}

async function stopCapture() {
  const { tabId } = await chrome.storage.session.get('tabId');
  await chrome.storage.session.set({ running: false, status: 'parado' });
  chrome.runtime.sendMessage({ target: 'offscreen', type: 'stop' }).catch(() => {});
  if (tabId != null) chrome.tabs.sendMessage(tabId, { type: 'clear' }).catch(() => {});
}

// Troca de idioma com a captura ativa: para e inicia de novo na mesma aba.
async function restartCapture() {
  const { tabId } = await chrome.storage.session.get('tabId');
  await stopCapture();
  await new Promise((r) => setTimeout(r, 400)); // dá tempo de liberar o stream da aba
  await startCapture(tabId);
}

// Ponto de extensão para tradução futura: receba o texto e devolva { translation }.
async function enrich(text) {
  return { text, translation: null };
}

async function appendHistory(entry) {
  const { history = [] } = await chrome.storage.local.get('history');
  history.push(entry);
  if (history.length > HISTORY_LIMIT) history.splice(0, history.length - HISTORY_LIMIT);
  await chrome.storage.local.set({ history });
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.target === 'bg') {
    (async () => {
      const { tabId } = await chrome.storage.session.get('tabId');
      if (msg.type === 'start') {
        try { await startCapture(); sendResponse({ ok: true }); }
        catch (e) { sendResponse({ ok: false, error: String(e.message || e) }); }
      } else if (msg.type === 'restart') {
        try { await restartCapture(); sendResponse({ ok: true }); }
        catch (e) { sendResponse({ ok: false, error: String(e.message || e) }); }
      } else if (msg.type === 'stop') {
        await stopCapture(); sendResponse({ ok: true });
      } else if (msg.type === 'partial') {
        if (tabId != null) chrome.tabs.sendMessage(tabId, { type: 'caption', kind: 'partial', text: msg.text }).catch(() => {});
      } else if (msg.type === 'final') {
        const e = await enrich(msg.text);
        if (tabId != null) chrome.tabs.sendMessage(tabId, { type: 'caption', kind: 'final', ...e }).catch(() => {});
        await appendHistory({ id: Date.now() + Math.random(), ts: Date.now(), ...e });
      } else if (msg.type === 'status') {
        await chrome.storage.session.set({ status: msg.status });
      } else if (msg.type === 'error') {
        await chrome.storage.session.set({ status: 'erro: ' + msg.error });
      }
    })();
    return true; // resposta assíncrona
  }
});

chrome.tabs.onRemoved.addListener(async (id) => {
  const { tabId, running } = await chrome.storage.session.get(['tabId', 'running']);
  if (running && id === tabId) stopCapture();
});
