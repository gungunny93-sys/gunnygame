// 게임 루프 — requestAnimationFrame + 일시정지(스토어의 paused) + 탭 숨김 시 자동 일시정지
import { useEffect } from 'react';
import { gameStore } from './store';

export function useGameLoop(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      gameStore.getState().tick(dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const onVis = () => {
      if (document.hidden) gameStore.getState().setPaused(true);
      last = performance.now();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [enabled]);
}
