(() => {
  if (window.__legendasVosk) return;
  window.__legendasVosk = true;

  const settings = { overlay: true, fontSize: 28, translated: false };
  const host = document.createElement('div');
  host.style.cssText = 'all:initial;position:fixed;left:0;right:0;bottom:6%;z-index:2147483647;pointer-events:none;display:flex;justify-content:center;';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `
    <style>
      .box{max-width:80%;padding:.35em .8em;border-radius:.4em;background:rgba(0,0,0,.72);
           color:#fff;font-family:system-ui,sans-serif;line-height:1.35;text-align:center;
           text-shadow:0 1px 2px #000;display:none;white-space:pre-wrap}
      .tr{display:block;color:#ffe48a;font-size:.85em}
    </style>
    <div class="box"><span class="orig"></span><span class="tr"></span></div>`;
  const box = root.querySelector('.box');
  const orig = root.querySelector('.orig');
  const tr = root.querySelector('.tr');
  let hideTimer = null;

  function attach() {
    const parent = document.fullscreenElement || document.documentElement;
    if (host.parentNode !== parent) parent.appendChild(host);
  }
  document.addEventListener('fullscreenchange', attach);
  attach();

  const tail = (t, n = 140) => {
    if (t.length <= n) return t;
    const cut = t.slice(-n);
    return cut.slice(cut.indexOf(' ') + 1);
  };

  function show(text, translation, final) {
    if (!settings.overlay || !text) return;
    box.style.fontSize = settings.fontSize + 'px';
    orig.textContent = tail(text);
    tr.textContent = translation ? tail(translation) : '';
    box.style.display = 'block';
    clearTimeout(hideTimer);
    if (final) hideTimer = setTimeout(clear, Math.max(2500, text.length * 60));
  }
  function clear() { box.style.display = 'none'; orig.textContent = ''; tr.textContent = ''; }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'caption') show(msg.text, msg.translation, msg.kind === 'final');
    else if (msg.type === 'clear') clear();
  });

  chrome.storage.local.get('settings').then(({ settings: s }) => Object.assign(settings, s || {}));
  chrome.storage.onChanged.addListener((ch) => {
    if (ch.settings) { Object.assign(settings, ch.settings.newValue || {}); if (!settings.overlay) clear(); }
  });
})();
