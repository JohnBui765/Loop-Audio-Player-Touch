// Echo Loop+ Touch: the sound engine. It runs on the iPhone's audio thread (an AudioWorklet).
// It lives in its own file because WebKit — the engine inside every browser on iPhone — refuses
// audio-thread code handed over as a "blob:" address, which is how the desktop app loads it.
// Same engine as Echo Loop+ Desktop 2: seamless loops, 5 ms fades, slow-down that keeps the voice's pitch.
/* global sampleRate, currentFrame, AudioWorkletProcessor, registerProcessor */
const FADE_MS = 5;                                  // every start, stop, jump and loop seam fades over 5 ms
function herm(x, t) {                               // 4-point cubic interpolation (resampling)
  const c1 = 0.5 * (x[2] - x[0]), c2 = x[0] - 2.5 * x[1] + 2 * x[2] - 0.5 * x[3], c3 = 0.5 * (x[3] - x[0]) + 1.5 * (x[1] - x[2]);
  return ((c3 * t + c2) * t + c1) * t + x[1];
}
class ElpPlayer extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.sr = sampleRate;
    this.ch = null; this.nch = 0; this.len = 0; this.srate = sampleRate; this.step = 1; this.id = null;
    this.playing = false; this.stopping = false; this.rate = 1; this.mode = 0;   // mode 0: straight read, 1: time-stretch
    this.pos = 0; this.lastP = 0;
    this.looping = false; this.la = 0; this.lb = 0; this.left = -1; this.loopGen = 0;   // section loop; left = repeats still allowed (-1 = endless)
    this.fileLoop = false;
    this.gain = 0; this.target = 0;
    this.fadeN = Math.max(16, Math.round(this.sr * FADE_MS / 1000)); this.fadeStep = 1 / this.fadeN;
    this.jumpTo = -1; this.jumpKind = ''; this.jumpSeq = 0;
    this.repN = Math.round(this.sr * 0.02); this.rep = 0;
    this.hL = new Float32Array(4); this.hR = new Float32Array(4); this.hP = new Float64Array(4); this.ph = 0; this.primed = false;
    this.sL = 0; this.sR = 0; this.sP = 0; this.oL = 0; this.oR = 0; this.oP = 0;
    this.N = 0; this.Hs = 0; this.D = 0; this.win = null; this.accL = null; this.accR = null;
    this.fL = null; this.fR = null; this.fP = null; this.fHead = 0; this.fLen = 0; this.sBuf = null; this.nBuf = null;
    this.ax = 0; this.prevNat = 0; this.havePrev = false;
    this.port.onmessage = (e) => this.onMsg(e.data);
    const o = options && options.processorOptions;
    if (o && Array.isArray(o.init)) for (const m of o.init) this.onMsg(m);
  }
  post(m) { m.id = this.id; this.port.postMessage(m); }   // every message says which recording it is about
  setupStretch() {
    const sr = this.srate;
    let N = Math.round(sr * 0.032); N += N & 1;                                   // 32 ms frames, 50 % overlap
    this.N = N; this.Hs = N >> 1; this.D = Math.round(sr * 0.010);                // search ±10 ms for the best join
    this.win = new Float32Array(N);
    for (let j = 0; j < N; j++) this.win[j] = 0.5 - 0.5 * Math.cos(2 * Math.PI * j / N);
    this.accL = new Float32Array(N); this.accR = new Float32Array(N);
    this.fL = new Float32Array(this.Hs); this.fR = new Float32Array(this.Hs); this.fP = new Float64Array(this.Hs);
    this.sBuf = new Float32Array(2 * this.D + N); this.nBuf = new Float32Array(N);
  }
  resetAt(to) {
    this.pos = to; this.lastP = to;
    this.ax = to; this.havePrev = false; this.fLen = 0;
    if (this.accL) { this.accL.fill(0); this.accR.fill(0); }
    this.primed = false; this.ph = 0;
  }
  schedule(to, kind) { this.jumpTo = Math.max(0, Math.min(this.len, Math.round(to))); this.jumpKind = kind; this.target = 0; }
  doJump(frame) {
    const to = this.jumpTo, kind = this.jumpKind;
    this.jumpTo = -1;
    this.mode = this.rate === 1 ? 0 : 1;                                          // a pending speed change takes effect here
    this.resetAt(to);
    if (kind === 'wrap' && this.left > 0) this.left--;
    this.post({ type: 'jump', kind, frame, pos: to / this.srate, rate: this.mode ? this.rate : 1, seq: kind === 'seek' ? this.jumpSeq : 0, gen: kind === 'wrap' ? this.loopGen : 0 });
    if (this.playing && !this.stopping) this.target = 1;
  }
  // Waveform-similarity overlap-add: slows speech down or speeds it up without changing the voice's pitch.
  bestDelta(xk, nat) {
    const D = this.D, N = this.N, len = this.len, c0 = this.ch[0], c1 = this.nch > 1 ? this.ch[1] : null, sb = this.sBuf, nb = this.nBuf;
    const base0 = xk - D, span = 2 * D + N;
    for (let i = 0; i < span; i++) { const k = base0 + i; sb[i] = k >= 0 && k < len ? (c1 ? c0[k] + c1[k] : c0[k]) : 0; }
    for (let j = 0; j < N; j++) { const k = nat + j; nb[j] = k >= 0 && k < len ? (c1 ? c0[k] + c1[k] : c0[k]) : 0; }
    let best = 0, bestV = -Infinity;
    for (let d = 0; d <= 2 * D; d += 4) {
      let acc = 0;
      for (let j = 0; j < N; j += 8) acc += sb[d + j] * nb[j];
      if (acc > bestV) { bestV = acc; best = d; }
    }
    const lo = Math.max(0, best - 4), hi = Math.min(2 * D, best + 4);
    let fine = best; bestV = -Infinity;
    for (let d = lo; d <= hi; d++) {
      let acc = 0;
      for (let j = 0; j < N; j += 2) acc += sb[d + j] * nb[j];
      if (acc > bestV) { bestV = acc; fine = d; }
    }
    return fine - D;
  }
  stretchFrame() {
    const N = this.N, Hs = this.Hs, len = this.len, w = this.win, aL = this.accL, aR = this.accR;
    const c0 = this.ch[0], c1 = this.nch > 1 ? this.ch[1] : null;
    const xk = Math.round(this.ax), first = !this.havePrev;
    const s = first ? xk : xk + this.bestDelta(xk, this.prevNat);
    for (let j = 0; j < N; j++) {
      const k = s + j;
      // the first frame after a jump starts at full level (the 5 ms gain ramp keeps it click-free), so onsets stay crisp
      if (k >= 0 && k < len) { const v = first && j < Hs ? 1 : w[j]; aL[j] += v * c0[k]; if (c1) aR[j] += v * c1[k]; }
    }
    // Positions follow the nominal timeline (exactly `rate` per sample), so loops keep an exact length and the
    // playhead moves evenly; the audio itself is aligned within ±10 ms of it.
    const sc = 1 / 32768, ax = this.ax, r = this.rate;
    for (let j = 0; j < Hs; j++) { const l = aL[j] * sc; this.fL[j] = l; this.fR[j] = c1 ? aR[j] * sc : l; this.fP[j] = ax + j * r; }
    aL.copyWithin(0, Hs); aL.fill(0, N - Hs);
    if (c1) { aR.copyWithin(0, Hs); aR.fill(0, N - Hs); }
    this.fHead = 0; this.fLen = Hs;
    this.prevNat = s + Hs; this.havePrev = true;
    this.ax += Hs * this.rate;
  }
  streamNext() {                                    // next sample at the recording's own sample rate
    if (this.mode === 0) {
      const i = this.pos;
      if (i >= 0 && i < this.len) { const a = this.ch[0][i] / 32768; this.sL = a; this.sR = this.nch > 1 ? this.ch[1][i] / 32768 : a; }
      else { this.sL = 0; this.sR = 0; }
      this.sP = i; this.pos = i + 1;
      return;
    }
    if (this.fLen === 0) this.stretchFrame();
    const k = this.fHead;
    this.sL = this.fL[k]; this.sR = this.fR[k]; this.sP = this.fP[k];
    this.fHead = k + 1; this.fLen--;
  }
  outNext() {                                       // next sample at the sound card's rate
    if (this.step === 1) { this.streamNext(); this.oL = this.sL; this.oR = this.sR; this.oP = this.sP; return; }
    const hL = this.hL, hR = this.hR, hP = this.hP;
    if (!this.primed) {
      this.streamNext(); hL[0] = hL[1] = this.sL; hR[0] = hR[1] = this.sR; hP[0] = hP[1] = this.sP;
      this.streamNext(); hL[2] = this.sL; hR[2] = this.sR; hP[2] = this.sP;
      this.streamNext(); hL[3] = this.sL; hR[3] = this.sR; hP[3] = this.sP;
      this.primed = true; this.ph = 0;
    }
    const t = this.ph;
    this.oL = herm(hL, t); this.oR = herm(hR, t); this.oP = hP[1] + t * (hP[2] - hP[1]);
    this.ph += this.step;
    while (this.ph >= 1) {
      this.ph -= 1;
      hL[0] = hL[1]; hL[1] = hL[2]; hL[2] = hL[3];
      hR[0] = hR[1]; hR[1] = hR[2]; hR[2] = hR[3];
      hP[0] = hP[1]; hP[1] = hP[2]; hP[2] = hP[3];
      this.streamNext(); hL[3] = this.sL; hR[3] = this.sR; hP[3] = this.sP;
    }
  }
  onMsg(m) {
    switch (m.t) {
      case 'load':
        this.ch = m.ch; this.nch = m.ch.length; this.len = m.len; this.srate = m.srate; this.step = m.srate / this.sr; this.id = m.id;
        this.setupStretch();
        this.playing = false; this.stopping = false; this.gain = 0; this.target = 0; this.jumpTo = -1; this.looping = false;
        this.mode = this.rate === 1 ? 0 : 1;
        this.resetAt(Math.max(0, Math.min(this.len, Math.round((m.pos || 0) * this.srate))));
        this.post({ type: 'loaded', id: m.id });
        break;
      case 'unload': this.ch = null; this.playing = false; this.len = 0; this.id = null; break;
      case 'play':
        if (!this.ch) break;
        this.playing = true; this.stopping = false;
        if (this.jumpTo < 0) this.target = 1;
        this.post({ type: 'playing', frame: currentFrame, pos: this.lastP / this.srate, rate: this.mode ? this.rate : 1 });
        break;
      case 'pause': if (this.playing) { this.stopping = true; this.target = 0; } break;
      case 'seek': {
        if (!this.ch) break;
        this.jumpSeq = m.seq || 0;
        const to = Math.round(m.pos * this.srate);
        if (this.playing && !this.stopping && this.gain > 0) this.schedule(to, 'seek');
        else { this.jumpTo = Math.max(0, Math.min(this.len, to)); this.jumpKind = 'seek'; this.doJump(currentFrame); }
        break;
      }
      case 'rate': {
        const r = m.r, wasStraight = this.mode === 0, oldRate = wasStraight ? 1 : this.rate;
        this.rate = r;
        if (wasStraight !== (r === 1) && this.ch) {
          if (this.playing && this.gain > 0 && this.jumpTo < 0) {
            // switch between straight playback and time-stretching where the fade-out ends, so nothing repeats
            this.schedule(this.lastP + this.fadeN * this.step * oldRate, 'mode');
          } else if (this.jumpTo < 0) { this.mode = r === 1 ? 0 : 1; this.resetAt(Math.round(this.lastP)); }
        }
        break;
      }
      case 'loop': this.looping = true; this.la = Math.round(m.a * this.srate); this.lb = Math.round(m.b * this.srate); this.left = m.left; this.loopGen = m.gen || 0; break;
      case 'noloop': this.looping = false; break;
      case 'fileLoop': this.fileLoop = !!m.on; break;
    }
  }
  process(inputs, outputs) {
    const out = outputs[0], L = out[0], R = out[1] || null, n = L.length;
    if (!this.ch) { L.fill(0); if (R) R.fill(0); return true; }
    for (let i = 0; i < n; i++) {
      if (this.gain < this.target) { this.gain += this.fadeStep; if (this.gain > this.target) this.gain = this.target; }
      else if (this.gain > this.target) { this.gain -= this.fadeStep; if (this.gain < this.target) this.gain = this.target; }
      if (this.gain <= 0) {
        if (this.jumpTo >= 0) this.doJump(currentFrame + i);
        if (this.stopping) { this.stopping = false; this.playing = false; this.post({ type: 'paused', frame: currentFrame + i, pos: this.lastP / this.srate }); }
      }
      if (!this.playing) { L[i] = 0; if (R) R[i] = 0; continue; }
      this.outNext();
      const p = this.oP;
      if (this.jumpTo < 0 && !this.stopping) {
        const adv = this.fadeN * this.step * (this.mode ? this.rate : 1);       // how far the recording moves during a fade
        if (this.looping && p >= this.lb - adv) {
          if (this.left !== 0) this.schedule(this.la, 'wrap');
          else { this.looping = false; this.post({ type: 'loopdone', frame: currentFrame + i, pos: p / this.srate, gen: this.loopGen }); }
        } else if (p >= this.len - adv) {
          if (this.fileLoop) this.schedule(0, 'filewrap');
          else if (p >= this.len) {
            this.playing = false; this.gain = 0; this.target = 0; this.lastP = this.len;
            this.post({ type: 'ended', frame: currentFrame + i, pos: this.len / this.srate });
            L[i] = 0; if (R) R[i] = 0;
            continue;
          }
        }
      }
      this.lastP = p;
      const g = this.gain;
      L[i] = this.oL * g; if (R) R[i] = this.oR * g;
      if (++this.rep >= this.repN) { this.rep = 0; this.post({ type: 'pos', frame: currentFrame + i, pos: p / this.srate, rate: this.mode ? this.rate : 1 }); }
    }
    return true;
  }
}
registerProcessor('elp-player', ElpPlayer);
