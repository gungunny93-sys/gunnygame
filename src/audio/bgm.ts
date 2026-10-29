// 잔잔한 4코드 패드 루프 (합성). AudioContext가 없으면 아무 일도 하지 않는다.
import { getAudioContext, getMasterGain } from './sfx';

const CHORDS: number[][] = [
  [220.0, 261.63, 329.63],   // Am
  [174.61, 220.0, 261.63],   // F
  [261.63, 329.63, 392.0],   // C
  [196.0, 246.94, 293.66],   // G
];
const CHORD_SEC = 4;

let playing = false;
let timer: ReturnType<typeof setInterval> | null = null;
let bus: GainNode | null = null;
let chordIdx = 0;
let nextT = 0;

function schedule(): void {
  const c = getAudioContext();
  if (!c || !bus) return;
  while (nextT < c.currentTime + 6) {
    const t = Math.max(nextT, c.currentTime);
    for (const f of CHORDS[chordIdx % CHORDS.length]) {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.35, t + 1.2);
      g.gain.linearRampToValueAtTime(0.0001, t + CHORD_SEC + 0.8);
      o.connect(g); g.connect(bus);
      o.start(t); o.stop(t + CHORD_SEC + 1);
    }
    chordIdx++;
    nextT += CHORD_SEC;
  }
}

export function startBgm(): void {
  try {
    if (playing) return;
    const c = getAudioContext();
    const m = getMasterGain();
    if (!c || !m) return;
    bus = c.createGain();
    bus.gain.value = 0.12;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 900;
    bus.connect(lp); lp.connect(m);
    playing = true;
    chordIdx = 0; nextT = c.currentTime + 0.1;
    schedule();
    timer = setInterval(schedule, 1000);
  } catch { playing = false; }
}

export function stopBgm(): void {
  try {
    if (timer) clearInterval(timer);
    timer = null;
    const c = getAudioContext();
    const b = bus;
    if (b && c) {
      b.gain.setTargetAtTime(0, c.currentTime, 0.2);
      setTimeout(() => { try { b.disconnect(); } catch { /* noop */ } }, 800);
    }
    bus = null;
    playing = false;
  } catch { playing = false; }
}

export function isBgmPlaying(): boolean { return playing; }
