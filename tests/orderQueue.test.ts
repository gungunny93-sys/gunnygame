import { describe, expect, it } from 'vitest';
import { STAGES, getStage } from '../src/data/stages';
import { makeRng, maxConcurrentAt, patienceFor, resolveIdealGrind } from '../src/game/difficulty';
import { buildOrderPlan, canSpawn, tickPatience } from '../src/game/orderQueue';
import { createGameStore } from '../src/game/store';

describe('주문 큐', () => {
  it('주문 목록은 스테이지 메뉴만, 개수 일치, 같은 메뉴 3연속 없음', () => {
    for (const st of STAGES) for (let seed = 1; seed < 30; seed++) {
      const plan = buildOrderPlan(st, makeRng(seed));
      expect(plan).toHaveLength(st.totalOrders);
      for (const o of plan) expect(st.menuIds).toContain(o.menuId);
      for (let i = 2; i < plan.length; i++) {
        expect(plan[i].menuId === plan[i - 1].menuId && plan[i].menuId === plan[i - 2].menuId).toBe(false);
      }
    }
  });
  it('동시 주문 상한: 스테이지 7은 절반 처리 후 3 → 4', () => {
    const s7 = getStage(7);
    expect(maxConcurrentAt(s7, 0)).toBe(3);
    expect(maxConcurrentAt(s7, 5)).toBe(4);
    expect(maxConcurrentAt(getStage(4), 7)).toBe(2);
  });
  it('상한에 도달하면 손님이 더 들어오지 않는다', () => {
    const st = getStage(4);
    const base = { planIndex: 2, planLength: 8, resolvedCount: 0, elapsed: 100, nextSpawnAt: 0 };
    expect(canSpawn(st, { ...base, activeCount: 1 })).toBe(true);
    expect(canSpawn(st, { ...base, activeCount: 2 })).toBe(false);
    expect(canSpawn(st, { ...base, activeCount: 0, planIndex: 8 })).toBe(false);
  });
  it('스토어 시뮬레이션: 아무것도 안 해도 동시 손님 수가 상한을 넘지 않는다', () => {
    for (const st of STAGES) {
      const store = createGameStore({ persist: false });
      store.getState().startStage(st.id, 3);
      let maxSeen = 0;
      for (let t = 0; t < 900 && store.getState().session; t += 0.1) {
        store.getState().tick(0.1);
        const s = store.getState().session;
        if (!s) break;
        maxSeen = Math.max(maxSeen, s.customers.length);
        expect(s.customers.length).toBeLessThanOrEqual(maxConcurrentAt(st, s.records.length));
      }
      expect(maxSeen).toBeGreaterThan(0);
      // 모두 이탈하고 영업 종료
      expect(store.getState().screen).toBe('result');
      expect(store.getState().lastResult?.summary.timeouts).toBe(st.totalOrders);
    }
  });
  it('인내심: 급한 손님 0.7배, 느림 1.5배, 연습 무제한', () => {
    const st = getStage(1);
    expect(patienceFor(st, { patienceMult: 0.7 }, 'normal', false)).toBeCloseTo(63);
    expect(patienceFor(st, { patienceMult: 1 }, 'slow', false)).toBeCloseTo(135);
    expect(patienceFor(st, { patienceMult: 1 }, 'normal', true)).toBe(Infinity);
  });
  it('인내심이 0이 되면 이탈', () => {
    const r = tickPatience([{ uid: 1, menuId: 'espresso', typeId: 'regular', patience: 0.05, patienceMax: 90, arrivedAt: 0 }], 0.1);
    expect(r.timedOut).toEqual([1]);
    expect(r.customers).toHaveLength(0);
  });
  it('idealGrind: 스테이지 1은 5 고정, 2~6은 4~6, 7은 3~7', () => {
    for (let seed = 0; seed < 50; seed++) {
      expect(resolveIdealGrind(getStage(1), makeRng(seed))).toBe(5);
      const g2 = resolveIdealGrind(getStage(2), makeRng(seed));
      expect(g2).toBeGreaterThanOrEqual(4); expect(g2).toBeLessThanOrEqual(6);
      const g7 = resolveIdealGrind(getStage(7), makeRng(seed));
      expect(g7).toBeGreaterThanOrEqual(3); expect(g7).toBeLessThanOrEqual(7);
    }
  });
});
