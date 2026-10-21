// Junta os quadros de áudio em blocos de 4096 amostras mono.
class Chunker extends AudioWorkletProcessor {
  constructor() { super(); this.buf = new Float32Array(4096); this.n = 0; }
  process(inputs) {
    const inp = inputs[0];
    if (!inp || !inp[0]) return true;
    const l = inp[0], r = inp[1];
    for (let i = 0; i < l.length; i++) {
      this.buf[this.n++] = r ? (l[i] + r[i]) / 2 : l[i];
      if (this.n === this.buf.length) {
        this.port.postMessage(this.buf, [this.buf.buffer]);
        this.buf = new Float32Array(4096);
        this.n = 0;
      }
    }
    return true;
  }
}
registerProcessor('chunker', Chunker);
