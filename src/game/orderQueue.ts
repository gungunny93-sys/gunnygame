// 주문 큐 — GAME_PLAN.md 5.6 (순수 함수)
import type { CustomerTypeId, StageConfig } from '../data/types';
import { maxConcurrentAt } from './difficulty';

export interface PlannedOrder { menuId: string; customerType: CustomerTypeId }

export interface ActiveCustomer {
  uid: number;
  menuId: string;
  typeId: CustomerTypeId;
  patience: number;      // 남은 인내심(초)
  patienceMax: number;
  arrivedAt: number;
}

function pickWeighted<T extends string>(weights: Record<T, number>, rng: () => number): T {
  const entries = (Object.entries(weights) as [T, number][]).filter(([, w]) => w > 0);
  const sum = entries.reduce((a, [, w]) => a + w, 0);
  let r = rng() * sum;
  for (const [k, w] of entries) { r -= w; if (r < 0) return k; }
  return entries[entries.length - 1][0];
}

/**
 * 스테이지 주문 목록을 만든다. 메뉴는 고르게 섞이도록 '한 바퀴씩' 섞어서 뽑고,
 * 같은 메뉴가 세 번 연속 나오지 않게 한다.
 */
export function buildOrderPlan(stage: StageConfig, rng: () => number, menuIds = stage.menuIds): PlannedOrder[] {
  const out: PlannedOrder[] = [];
  let bag: string[] = [];
  while (out.length < stage.totalOrders) {
    if (bag.length === 0) bag = shuffle(menuIds.slice(), rng);
    let idx = 0;
    const n = out.length;
    if (n >= 2 && out[n - 1].menuId === out[n - 2].menuId && bag.length > 1) {
      idx = bag.findIndex((m) => m !== out[n - 1].menuId);
      if (idx < 0) idx = 0;
    }
    const [menuId] = bag.splice(idx, 1);
    out.push({ menuId, customerType: pickWeighted(stage.customerMix, rng) });
  }
  return out;
}

export function shuffle<T>(xs: T[], rng: () => number): T[] {
  for (let i = xs.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [xs[i], xs[j]] = [xs[j], xs[i]];
  }
  return xs;
}

export interface SpawnState {
  planIndex: number;      // 다음에 들어올 주문 번호
  planLength: number;     // 무한(연습)이면 Infinity
  activeCount: number;
  resolvedCount: number;
  elapsed: number;
  nextSpawnAt: number;
}

/** 지금 손님이 들어올 수 있는가: 남은 주문 있음 + 동시 주문 상한 미만 + 간격 경과 */
export function canSpawn(stage: StageConfig, s: SpawnState): boolean {
  if (s.planIndex >= s.planLength) return false;
  if (s.activeCount >= maxConcurrentAt(stage, s.resolvedCount)) return false;
  // 줄이 비면 간격을 기다리지 않는다(바로 다음 손님)
  if (s.activeCount === 0) return true;
  return s.elapsed >= s.nextSpawnAt;
}

/** 인내심 감소. 0 이하가 된 손님 uid 목록을 함께 돌려준다 */
export function tickPatience(customers: ActiveCustomer[], dt: number): { customers: ActiveCustomer[]; timedOut: number[] } {
  const timedOut: number[] = [];
  const next = customers.map((c) => {
    if (!Number.isFinite(c.patience)) return c;
    const p = c.patience - dt;
    if (p <= 0) timedOut.push(c.uid);
    return { ...c, patience: p };
  });
  return { customers: next.filter((c) => !timedOut.includes(c.uid)), timedOut };
}

export function patienceRatio(c: ActiveCustomer): number {
  if (!Number.isFinite(c.patienceMax)) return 1;
  return Math.max(0, Math.min(1, c.patience / c.patienceMax));
}
