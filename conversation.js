const list = document.getElementById('list');
const live = document.getElementById('live');
let history = [];

const hhmm = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

function render() {
  const nearBottom = list.scrollTop + list.clientHeight >= list.scrollHeight - 40;
  list.replaceChildren(...history.map((h) => {
    const p = document.createElement('p'); p.className = 'line';
    const ts = document.createElement('span'); ts.className = 'ts'; ts.textContent = hhmm(h.ts);
    p.append(ts, document.createTextNode(h.text));
    if (h.translation) { const t = document.createElement('span'); t.className = 'tr'; t.textContent = h.translation; p.append(t); }
    return p;
  }));
  if (nearBottom) list.scrollTop = list.scrollHeight;
}

const asText = () => history.map((h) => `[${hhmm(h.ts)}] ${h.text}${h.translation ? '\n    ' + h.translation : ''}`).join('\n');

chrome.storage.local.get('history').then(({ history: h = [] }) => { history = h; render(); list.scrollTop = list.scrollHeight; });
chrome.storage.onChanged.addListener((ch) => { if (ch.history) { history = ch.history.newValue || []; render(); } });

// O offscreen transmite a fala parcial para todas as páginas da extensão.
chrome.runtime.onMessage.addListener((m) => {
  if (m.target !== 'bg') return;
  if (m.type === 'partial') live.textContent = m.text;
  if (m.type === 'final') live.textContent = '';
});

document.getElementById('copy').onclick = () => navigator.clipboard.writeText(asText());
document.getElementById('clear').onclick = () => chrome.storage.local.set({ history: [] });
document.getElementById('save').onclick = () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([asText()], { type: 'text/plain' }));
  a.download = 'conversa.txt'; a.click();
};
