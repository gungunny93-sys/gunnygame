// 스토어 상태 변화를 효과음·배경음·읽어주기로 연결한다.
import { useEffect } from 'react';
import { getMenu } from '../data/menus';
import { gameStore } from '../game/store';
import { isBgmPlaying, startBgm, stopBgm } from './bgm';
import {
  playBell, playCoin, playCombo, playGrinder, playReturn, playWarn, setSfxEnabled, setSteamTemp,
  startExtraction, startSteam, stopExtraction, stopSteam, unlockAudio,
} from './sfx';
import { speak } from './tts';

export function AudioBridge() {
  useEffect(() => {
    const onDown = () => unlockAudio();
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onDown);

    let seenUids = new Set<number>();
    let lastRecords = 0;
    let lastServeAt = -1;
    let lastToastId = 0;
    let extracting = false;
    let steaming = false;
    let lastGrind: number | null = null;
    let lastKey: unknown = null;

    const apply = () => {
      try {
        const s = gameStore.getState();
        const { settings, session } = s;
        const sfxOn = settings.sfx && !settings.muted;
        setSfxEnabled(sfxOn);
        const bgmOn = settings.bgm && !settings.muted;
        if (bgmOn && !isBgmPlaying()) startBgm();
        else if (!bgmOn && isBgmPlaying()) stopBgm();

        const key = session ? session.rng : null;
        if (key !== lastKey) {
          seenUids = new Set(session ? session.customers.map((c) => c.uid) : []);
          lastRecords = session ? session.records.length : 0;
          lastServeAt = session?.lastServe?.at ?? -1;
          lastToastId = session ? session.nextToastId - 1 : 0;
          lastGrind = session ? session.espresso.grind : null;
          lastKey = key;
        }

        if (!session || session.paused || !sfxOn) {
          if (extracting) { stopExtraction(); extracting = false; }
          if (steaming) { stopSteam(); steaming = false; }
          if (session) {
            seenUids = new Set(session.customers.map((c) => c.uid));
            lastRecords = session.records.length;
            lastServeAt = session.lastServe?.at ?? lastServeAt;
            lastToastId = session.nextToastId - 1;
          }
          return;
        }

        if (session.espresso.running !== extracting) {
          extracting = session.espresso.running;
          if (extracting) startExtraction(); else stopExtraction();
        }
        if (lastGrind !== null && session.espresso.grind !== lastGrind) playGrinder();
        lastGrind = session.espresso.grind;

        const steamOn = session.holds.aerate || session.holds.roll;
        if (steamOn !== steaming) {
          steaming = steamOn;
          if (steaming) startSteam(); else stopSteam();
        }
        if (steaming) setSteamTemp(session.pitcher.tempC);

        if (session.records.length > lastRecords) {
          const rec = session.records[session.records.length - 1];
          if (rec.timeout) playWarn();
          else if (rec.returned) playReturn();
          else playBell();
        }
        lastRecords = session.records.length;

        const ls = session.lastServe;
        if (ls && ls.at !== lastServeAt) {
          lastServeAt = ls.at;
          if (!ls.returned) {
            if (ls.streak >= 2) playCombo();
            if (ls.tip > 0) setTimeout(playCoin, 150);
          }
        }

        for (const c of session.customers) {
          if (!seenUids.has(c.uid)) {
            seenUids.add(c.uid);
            if (settings.tts && !settings.muted) {
              const m = getMenu(c.menuId);
              speak(`${m.name} ${m.temp === 'iced' ? '아이스' : '핫'} 한 잔 주세요`);
            }
          }
        }

        for (const t of session.toasts) {
          if (t.id > lastToastId) {
            lastToastId = t.id;
            if (t.kind === 'warn') playWarn();
          }
        }
      } catch { /* noop */ }
    };

    apply();
    const unsub = gameStore.subscribe(apply);
    return () => {
      unsub();
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onDown);
      stopExtraction(); stopSteam(); stopBgm();
    };
  }, []);
  return null;
}
