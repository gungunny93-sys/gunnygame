// 기록 저장 — 이 기기의 localStorage에만 저장한다. 모든 접근은 try/catch, 실패해도 게임은 진행.
import type { PlayLog, Progress, Settings } from '../data/types';
import { MISTAKE_CODES } from '../data/types';

const KEYS = {
  settings: 'rhb.settings.v1',
  progress: 'rhb.progress.v1',
  logs: 'rhb.logs.v1',
} as const;

const MAX_LOGS = 500;

export const DEFAULT_SETTINGS: Settings = {
  sfx: true, bgm: false, tts: false, speed: 'normal', practiceDefault: false, muted: false,
};

export const DEFAULT_PROGRESS: Progress = { stars: {}, unlockAll: false, tutorialDone: false };

function readJson<T>(key: string): T | null {
  try {
    const raw = globalThis.localStorage?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): boolean {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function loadSettings(): Settings {
  return { ...DEFAULT_SETTINGS, ...(readJson<Partial<Settings>>(KEYS.settings) ?? {}) };
}
export function saveSettings(s: Settings): void { writeJson(KEYS.settings, s); }

export function loadProgress(): Progress {
  const p = readJson<Partial<Progress>>(KEYS.progress) ?? {};
  return { ...DEFAULT_PROGRESS, ...p, stars: { ...(p.stars ?? {}) } };
}
export function saveProgress(p: Progress): void { writeJson(KEYS.progress, p); }

export function loadLogs(): PlayLog[] {
  const logs = readJson<PlayLog[]>(KEYS.logs);
  return Array.isArray(logs) ? logs : [];
}
export function appendLog(log: PlayLog): void {
  const logs = loadLogs();
  logs.push(log);
  writeJson(KEYS.logs, logs.slice(-MAX_LOGS));
}
export function clearLogs(): void {
  try { globalThis.localStorage?.removeItem(KEYS.logs); } catch { /* 무시 */ }
}

/** 교사용 기록 CSV(엑셀에서 한글이 깨지지 않도록 BOM 포함) */
export function logsToCsv(logs: PlayLog[]): string {
  const head = ['날짜', '모둠', '스테이지', '연습', '별', '점수', '평균점수', '서빙', '반품', '이탈', '클리어', ...MISTAKE_CODES];
  const rows = logs.map((l) => [
    l.dateISO, l.group === 'solo' ? '개인 연습' : `${l.group}모둠`, String(l.stageId), l.practice ? 'Y' : 'N',
    String(l.stars), String(l.score), l.avgScore.toFixed(1), String(l.served), String(l.returned), String(l.timeouts),
    l.cleared ? 'Y' : 'N', ...MISTAKE_CODES.map((c) => String(l.mistakes[c] ?? 0)),
  ]);
  return '﻿' + [head, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
}

function csvCell(v: string): string {
  return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** 브라우저 다운로드로만 내보낸다(외부 전송 없음) */
export function downloadCsv(filename: string, csv: string): boolean {
  try {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
}
