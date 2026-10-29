// 난이도 파라미터 해석 — GAME_PLAN.md 5.9 (순수 함수)
import { EQUIPMENT } from '../data/standards';
import type { CustomerType, GameSpeed, StageConfig } from '../data/types';

/** 난수 생성기(시드 고정 가능) — mulberry32 */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randInt(rng: () => number, lo: number, hi: number): number {
  return lo + Math.floor(rng() * (hi - lo + 1));
}

/** 스테이지 시작 시 idealGrind 결정: 고정값 또는 범위 무작위 */
export function resolveIdealGrind(stage: StageConfig, rng: () => number): number {
  return typeof stage.idealGrind === 'number' ? stage.idealGrind : randInt(rng, stage.idealGrind[0], stage.idealGrind[1]);
}

/** 동시 주문 상한: [3,4]면 전체 주문의 절반을 처리한 뒤부터 4 */
export function maxConcurrentAt(stage: StageConfig, resolvedCount: number): number {
  if (typeof stage.maxConcurrent === 'number') return stage.maxConcurrent;
  const [a, b] = stage.maxConcurrent;
  return resolvedCount >= Math.floor(stage.totalOrders / 2) ? b : a;
}

/** 손님 한 명의 인내심(실제 초). 연습 모드는 무제한(Infinity) */
export function patienceFor(
  stage: StageConfig, customer: Pick<CustomerType, 'patienceMult'>, speed: GameSpeed, practice: boolean,
): number {
  if (practice) return Infinity;
  const slow = speed === 'slow' ? EQUIPMENT.slowPatienceMult : 1;
  return stage.patienceSec * customer.patienceMult * slow;
}

export function steamTempMult(speed: GameSpeed): number {
  return speed === 'slow' ? EQUIPMENT.slowSteamMult : 1;
}

/** 원두 상태 변화 이벤트 시점: 전체 주문의 절반을 처리했을 때 */
export function beanChangeDue(stage: StageConfig, resolvedCount: number, alreadyChanged: boolean): boolean {
  return stage.events.includes('beanChange') && !alreadyChanged && resolvedCount >= Math.floor(stage.totalOrders / 2);
}

/** 스테이지 가이드: 1~3 눈금+목표선, 4~6 목표선, 7 숨김 / 연습 모드는 항상 표시 */
export function guideFor(stage: StageConfig, practice: boolean): StageConfig['guide'] {
  return practice ? 'full' : stage.guide;
}

export function hygieneEnabled(stage: StageConfig): boolean {
  return stage.events.includes('hygiene');
}
