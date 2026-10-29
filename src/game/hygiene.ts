// 위생 — GAME_PLAN.md 5.7 (순수 함수)
import { HYGIENE_RULES } from '../data/standards';

export interface PortafilterHygiene { puckKnocked: boolean; flushed: boolean }
export interface WandHygiene { wiped: boolean; purged: boolean }
export type CleaningStepId = (typeof HYGIENE_RULES.cleaningSteps)[number];

export const CLEANING_STEP_NAMES: Record<CleaningStepId, string> = {
  knock: '퍽 버리기', flush: '그룹헤드 물 흘리기', wipe: '스팀완드 닦기', purge: '스팀완드 퍼징', counter: '바 닦기',
};

/** 영업 시작 상태: 포터필터는 깨끗, 스팀완드는 '퍼징 전' */
export function initialPortafilter(): PortafilterHygiene { return { puckKnocked: true, flushed: true }; }
export function initialWand(): WandHygiene { return { wiped: true, purged: false }; }

/** 샷 추출 시작 시: 이전 퍽 처리를 안 했으면 위반 → 이후 포터필터는 다시 더러워짐 */
export function onShotStart(pf: PortafilterHygiene): { violation: boolean; next: PortafilterHygiene } {
  return { violation: !(pf.puckKnocked && pf.flushed), next: { puckKnocked: false, flushed: false } };
}

/** 새 우유 스팀 시작 시: 퍼징(+이전 스팀 뒤 닦기)을 안 했으면 위반 → 이후 스팀완드는 더러워짐 */
export function onSteamStart(w: WandHygiene): { violation: boolean; next: WandHygiene } {
  return { violation: !(w.wiped && w.purged), next: { wiped: false, purged: false } };
}

export function applyGaugePenalty(gauge: number, kind: 'puck' | 'wand'): number {
  const p = kind === 'puck' ? HYGIENE_RULES.puckPenaltyGauge : HYGIENE_RULES.wandPenaltyGauge;
  return Math.max(0, gauge - p);
}

export interface CleaningState { index: number; elapsed: number; wrongTaps: number }

export function startCleaning(): CleaningState { return { index: 0, elapsed: 0, wrongTaps: 0 }; }

/** 마감 청소: 정해진 순서대로 탭. 틀린 탭은 진행하지 않는다. */
export function cleaningTap(s: CleaningState, step: CleaningStepId): CleaningState {
  const expected = HYGIENE_RULES.cleaningSteps[s.index];
  if (step === expected) return { ...s, index: s.index + 1 };
  return { ...s, wrongTaps: s.wrongTaps + 1 };
}

/** 모든 단계를 끝냈고 최소 시간(약 20초)이 지났는가 */
export function cleaningDone(s: CleaningState): boolean {
  return s.index >= HYGIENE_RULES.cleaningSteps.length && s.elapsed >= HYGIENE_RULES.cleaningSeconds;
}
