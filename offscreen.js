let ctx = null, stream = null, node = null;
let model = null, modelLang = null, rec = null, lastPartial = '', startGen = 0;

const toBg = (m) => chrome.runtime.sendMessage({ target: 'bg', ...m }).catch(() => {});
const status = (s) => { console.log('[offscreen]', s); toBg({ type: 'status', status: s }); };
const fail = (e) => { console.error('[offscreen]', e); toBg({ type: 'error', error: String(e) }); };

window.addEventListener('error', (e) => fail('offscreen: ' + (e.message || e.error)));
window.addEventListener('unhandledrejection', (e) => fail('offscreen: ' + String(e.reason)));

const RealWorker = window.Worker;
window.Worker = function (url, opts) {
  status('worker do Vosk criado, descompactando modelo…');
  const w = new RealWorker(url, opts);
  w.addEventListener('error', (e) => fail('worker: ' + (e.message || 'erro desconhecido')));
  return w;
};
window.Worker.prototype = RealWorker.prototype;

async function ensureModel(lang) {
  if (!/^[a-z0-9-]+$/.test(lang || '')) throw new Error('idioma inválido: ' + lang);
  if (model && modelLang === lang) return;
  if (model) { try { model.terminate(); } catch (_) {} model = null; modelLang = null; }

  const url = chrome.runtime.getURL(`model/${lang}.tar.gz`);
  status(`verificando model/${lang}.tar.gz…`);
  const head = await fetch(url, { method: 'HEAD' }).catch(() => null);
  if (!head || !head.ok) {
    throw new Error(`model/${lang}.tar.gz não encontrado na extensão (rode tools\\pack-model.ps1).`);
  }
  const mb = (Number(head.headers.get('content-length') || 0) / 1048576).toFixed(1);
  status(`carregando modelo ${lang} (${mb} MB)…`);

  let timer;
  const timeout = new Promise((_, rej) => {
    timer = setTimeout(() => rej(new Error('timeout: o Vosk não respondeu em 120 s. Verifique o model/' + lang + '.tar.gz.')), 120000);
  });
  try { model = await Promise.race([Vosk.createModel(url), timeout]); }
  finally { clearTimeout(timer); }
  modelLang = lang;
  status('modelo ' + lang + ' pronto');
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.target !== 'offscreen') return;
  if (msg.type === 'start') start(msg.streamId, msg.lang).catch((e) => fail(e.message || e));
  if (msg.type === 'stop') stop();
});

async function start(streamId, lang) {
  stop();
  const gen = ++startGen;
  await ensureModel(lang);
  if (gen !== startGen) return; 

  const media = await navigator.mediaDevices.getUserMedia({
    audio: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: streamId } },
    video: false
  });
  if (gen !== startGen) { media.getTracks().forEach((t) => t.stop()); return; }
  stream = media;

  ctx = new AudioContext();
  await ctx.audioWorklet.addModule('audio-worklet.js');
  if (gen !== startGen) return;

  lastPartial = '';
  rec = new model.KaldiRecognizer(ctx.sampleRate);
  rec.on('result', (r) => {
    lastPartial = '';
    const t = (r.result.text || '').trim();
    if (t) toBg({ type: 'final', text: t });
  });
  rec.on('partialresult', (r) => {
    const t = (r.result.partial || '').trim();
    if (t !== lastPartial) { lastPartial = t; toBg({ type: 'partial', text: t }); }
  });

  const src = ctx.createMediaStreamSource(stream);
  node = new AudioWorkletNode(ctx, 'chunker');
  node.port.onmessage = (ev) => { if (rec) rec.acceptWaveformFloat(ev.data, ctx.sampleRate); };
  src.connect(node);
  src.connect(ctx.destination); 
  status('ouvindo (' + lang + ')');
}

function stop() {
  startGen++; 
  if (node) { node.disconnect(); node = null; }
  if (rec) { try { rec.remove(); } catch (_) {} rec = null; }
  if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; }
  if (ctx) { ctx.close(); ctx = null; }
}
