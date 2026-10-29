// 에스프레소 샷 모델 — GAME_PLAN.md 5.3 (순수 함수)
import { STANDARDS } from '../data/standards';

export interface ShotProgress {
  ml: number;        // 지금까지 나온 양
  timeSec: number;   // 머신 타이머(게임 초)
}

export function clampGrind(grind: number): number {
  const { min, max } = STANDARDS.grind;
  return Math.max(min, Math.min(max, Math.round(grind)));
}

/** 흐름 속도(ml/게임초) = baseFlow × basket × factor^(grind − idealGrind) */
export function flowRate(grind: number, idealGrind: number, basket: 1 | 2): number {
  const { baseFlowMlPerSec, factorPerStep } = STANDARDS.grind;
  return baseFlowMlPerSec * basket * Math.pow(factorPerStep, grind - idealGrind);
}

/** 실제 시간 dtReal초만큼 추출을 진행한다(머신 타이머는 timeScale배로 흐른다). */
export function advanceShot(
  p: ShotProgress, dtReal: number, grind: number, idealGrind: number, basket: 1 | 2,
  timeScale: number = STANDARDS.timeScale,
): ShotProgress {
  const gameDt = dtReal * timeScale;
  return { ml: p.ml + flowRate(grind, idealGrind, basket) * gameDt, timeSec: p.timeSec + gameDt };
}

/** 목표량까지 걸리는 머신 시간(게임 초) — 가이드·봇·테스트용 */
export function timeToReach(targetMl: number, grind: number, idealGrind: number, basket: 1 | 2): number {
  return targetMl / flowRate(grind, idealGrind, basket);
}

/** 이상 분쇄도에서 목표 시간 범위 안에 들어가는 분쇄도 목록 */
export function grindsInRange(
  targetMl: number, timeSec: readonly [number, number], idealGrind: number, basket: 1 | 2,
): number[] {
  const out: number[] = [];
  for (let g = STANDARDS.grind.min; g <= STANDARDS.grind.max; g++) {
    const t = timeToReach(targetMl, g, idealGrind, basket);
    if (t >= timeSec[0] && t <= timeSec[1]) out.push(g);
  }
  return out;
}

/** 원두 상태 변화 이벤트: idealGrind를 ±1~2 이동(범위 안으로). rnd는 [0,1) 난수 */
export function shiftIdealGrind(ideal: number, rnd: () => number): number {
  const step = rnd() < 0.5 ? 1 : 2;
  let dir = rnd() < 0.5 ? -1 : 1;
  const { min, max } = STANDARDS.grind;
  if (ideal + dir * step < min + 1 || ideal + dir * step > max - 1) dir = -dir;
  return Math.max(min + 1, Math.min(max - 1, ideal + dir * step));
}
