import { describe, expect, it } from 'vitest';
import { CUSTOMER_TYPES } from '../src/data/customers';
import { FEEDBACK } from '../src/data/feedback';
import { MENUS } from '../src/data/menus';
import { GENERAL_PRACTICE_CHECKS, PRACTICE_CHECKS } from '../src/data/practiceChecks';
import { STAGES } from '../src/data/stages';
import { CUPS, INGREDIENTS, STANDARDS } from '../src/data/standards';
import { TUTORIAL_STEPS } from '../src/data/tutorial';
import { MISTAKE_CODES } from '../src/data/types';

describe('menus.ts 데이터 무결성', () => {
  it('메뉴 17개, id 중복 없음', () => {
    expect(MENUS).toHaveLength(17);
    expect(new Set(MENUS.map((m) => m.id)).size).toBe(17);
  });
  it('모든 메뉴: 에스프레소 1회 포함, 양은 샷 기준과 같음, 단위 일치', () => {
    for (const m of MENUS) {
      const esp = m.steps.filter((s) => s.ingredient === 'espresso');
      expect(esp, m.id).toHaveLength(1);
      expect(esp[0].amount, m.id).toBe(STANDARDS.shots[m.shot].targetMl);
      for (const s of m.steps) {
        expect(s.amount, m.id).toBeGreaterThan(0);
        expect(s.unit, `${m.id}.${s.ingredient}`).toBe(INGREDIENTS[s.ingredient].unit);
      }
      expect(new Set(m.steps.map((s) => s.ingredient)).size, m.id).toBe(m.steps.length);
    }
  });
  it('스팀 우유를 쓰는 메뉴만 milk 기준이 있고, 거품 범위가 올바르다', () => {
    for (const m of MENUS) {
      const usesSteam = m.steps.some((s) => s.ingredient === 'steamedMilk');
      expect(!!m.milk, m.id).toBe(usesSteam);
      if (m.milk) expect(m.milk.foamCm[0]).toBeLessThanOrEqual(m.milk.foamCm[1]);
    }
  });
  it('정답 레시피가 컵 용량 안에 들어간다', () => {
    for (const m of MENUS) {
      const vol = m.steps.reduce((a, s) => a + s.amount * INGREDIENTS[s.ingredient].volumeMl, 0);
      expect(vol, m.id).toBeLessThanOrEqual(CUPS[m.cup].capacityMl);
    }
  });
  it('거품 기준 기본값: 카푸치노 1~2, 라떼 0.5~1, 플랫화이트 0~0.5', () => {
    const byId = Object.fromEntries(MENUS.map((m) => [m.id, m]));
    expect(byId.cappuccino.milk?.foamCm).toEqual([1.0, 2.0]);
    expect(byId['cafe-latte'].milk?.foamCm).toEqual([0.5, 1.0]);
    expect(byId['flat-white'].milk?.foamCm).toEqual([0, 0.5]);
  });
  it('공기 주입만으로(37℃ 전) 모든 메뉴의 거품 하한에 닿을 수 있다', () => {
    const m = STANDARDS.milk;
    const maxFoam = ((m.aerateMaxTempC - m.startTempC) / m.aerateTempPerSec) * m.aerateFoamCmPerSec;
    for (const x of MENUS) if (x.milk) expect(maxFoam, x.id).toBeGreaterThanOrEqual(x.milk.foamCm[0]);
  });
});

describe('기타 데이터', () => {
  it('feedback·practiceChecks: MistakeCode 17개 전부', () => {
    expect(MISTAKE_CODES).toHaveLength(17);
    for (const c of MISTAKE_CODES) {
      const f = FEEDBACK[c];
      expect(f.customerLine && f.why && f.fixHint && f.practiceCheck, c).toBeTruthy();
      expect(PRACTICE_CHECKS[c].length, c).toBeGreaterThanOrEqual(2);
    }
    expect(GENERAL_PRACTICE_CHECKS.length).toBeGreaterThanOrEqual(2);
  });
  it('손님 3유형, 반응 대사 유형별 4줄 이상', () => {
    expect(Object.keys(CUSTOMER_TYPES)).toHaveLength(3);
    expect(CUSTOMER_TYPES.hurry.patienceMult).toBe(0.7);
    expect(CUSTOMER_TYPES.picky.returnThreshold).toBe(80);
    expect(CUSTOMER_TYPES.picky.tipMult).toBe(1.5);
    for (const t of Object.values(CUSTOMER_TYPES)) for (const lines of Object.values(t.lines)) expect(lines.length).toBeGreaterThanOrEqual(4);
  });
  it('스테이지 7개: 메뉴 존재, 클리어 조건 ≤ 주문 수', () => {
    expect(STAGES).toHaveLength(7);
    const ids = new Set(MENUS.map((m) => m.id));
    for (const s of STAGES) {
      for (const id of s.menuIds) expect(ids.has(id), `${s.id}:${id}`).toBe(true);
      expect(s.clearCount).toBeLessThanOrEqual(s.totalOrders);
    }
    const all = new Set(STAGES.flatMap((s) => s.menuIds));
    expect(all.size).toBe(17); // 모든 메뉴가 어딘가에 등장
  });
  it('튜토리얼 단계가 있다', () => {
    expect(TUTORIAL_STEPS.length).toBeGreaterThan(5);
  });
});
