// Web Audio 합성 효과음 (파일 없음). 모든 함수는 AudioContext가 없으면 조용히 무시한다.
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;
let noiseBuf: AudioBuffer | null = null;

export function getAudioContext(): AudioContext | null {
  try {
    if (ctx) return ctx;
    const AC = (globalThis as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext });
    const Ctor = AC.AudioContext ?? AC.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = enabled ? 0.6 : 0;
    master.connect(ctx.destination);
    return ctx;
  } catch { return null; }
}

export function getMasterGain(): GainNode | null { getAudioContext(); return master; }

export function unlockAudio(): void {
  try {
    const c = getAudioContext();
    if (c && c.state === 'suspended') void c.resume();
  } catch { /* noop */ }
}

export function setSfxEnabled(on: boolean): void {
  enabled = on;
  try {
    if (master && ctx) master.gain.setTargetAtTime(on ? 0.6 : 0, ctx.currentTime, 0.02);
    if (!on) { stopExtraction(); stopSteam(); }
  } catch { /* noop */ }
}

function noise(c: AudioContext): AudioBuffer {
  if (noiseBuf) return noiseBuf;
  const buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  noiseBuf = buf;
  return buf;
}

function tone(type: OscillatorType, freq: number, start: number, dur: number, vol: number, freqEnd?: number): void {
  try {
    const c = getAudioContext();
    if (!c || !master || !enabled) return;
    const t = c.currentTime + start;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  } catch { /* noop */ }
}

export function playGrinder(): void {
  try {
    const c = getAudioContext();
    if (!c || !master || !enabled) return;
    const t = c.currentTime;
    const o = c.createOscillator();
    const f = c.createBiquadFilter();
    const g = c.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(90, t);
    o.frequency.linearRampToValueAtTime(140, t + 0.25);
    f.type = 'lowpass'; f.frequency.value = 900;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    o.connect(f); f.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.3);
  } catch { /* noop */ }
}

interface Loop { src: AudioBufferSourceNode; filter: BiquadFilterNode; gain: GainNode }
let extraction: Loop | null = null;
let steam: Loop | null = null;

function startLoop(type: BiquadFilterType, freq: number, q: number, vol: number): Loop | null {
  try {
    const c = getAudioContext();
    if (!c || !master || !enabled) return null;
    const src = c.createBufferSource();
    src.buffer = noise(c); src.loop = true;
    const filter = c.createBiquadFilter();
    filter.type = type; filter.frequency.value = freq; filter.Q.value = q;
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.0001, c.currentTime);
    gain.gain.linearRampToValueAtTime(vol, c.currentTime + 0.1);
    src.connect(filter); filter.connect(gain); gain.connect(master);
    src.start();
    return { src, filter, gain };
  } catch { return null; }
}

function endLoop(l: Loop | null): void {
  try {
    if (!l || !ctx) return;
    l.gain.gain.cancelScheduledValues(ctx.currentTime);
    l.gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.05);
    const src = l.src;
    setTimeout(() => { try { src.stop(); src.disconnect(); } catch { /* noop */ } }, 300);
  } catch { /* noop */ }
}

export function startExtraction(): void {
  if (extraction) return;
  extraction = startLoop('bandpass', 700, 0.8, 0.12);
}
export function stopExtraction(): void { endLoop(extraction); extraction = null; }

export function startSteam(): void {
  if (steam) return;
  steam = startLoop('bandpass', 6000, 0.7, 0.16);
}
/** 온도가 오를수록 쉬익 소리가 낮아진다: 5℃ 6000Hz → 70℃ 2500Hz */
export function setSteamTemp(tempC: number): void {
  try {
    if (!steam || !ctx) return;
    const r = Math.max(0, Math.min(1, (tempC - 5) / 65));
    steam.filter.frequency.setTargetAtTime(6000 - r * 3500, ctx.currentTime, 0.05);
  } catch { /* noop */ }
}
export function stopSteam(): void { endLoop(steam); steam = null; }

export function playBell(): void { tone('sine', 880, 0, 0.5, 0.25); tone('sine', 1319, 0.12, 0.7, 0.2); }
export function playReturn(): void { tone('triangle', 220, 0, 0.3, 0.25, 140); }
export function playCombo(): void { tone('triangle', 523, 0, 0.15, 0.2); tone('triangle', 659, 0.1, 0.15, 0.2); tone('triangle', 784, 0.2, 0.3, 0.22); }
export function playCoin(): void { tone('square', 988, 0, 0.08, 0.1); tone('square', 1319, 0.07, 0.25, 0.1); }
export function playClick(): void { tone('square', 600, 0, 0.04, 0.08); }
export function playWarn(): void { tone('square', 440, 0, 0.12, 0.12); tone('square', 440, 0.18, 0.12, 0.12); }
