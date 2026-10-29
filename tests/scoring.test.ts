import { describe, expect, it } from 'vitest';
import { comboMultiplier, nextStreak, scoreDrink, starsFor, summarize, tipFor, topMistakes } from '../src/game/scoring';
import type { DrinkJudgement } from '../src/game/judge';
import { applyGaugePenalty, cleaningDone, cleaningTap, onShotStart, onSteamStart, startCleaning } from '../src/game/hygiene';
import { HYGIENE_RULES } from '../src/data/standards';

const perfect: DrinkJudgement = { mistakes: [], composition: 1, shotQuality: 100, milkQuality: 100, lookalikeId: null };

describe('점수 배분', () => {
  it('우유 메뉴: 40 + 30 + 20 + 10', () => {
    const s = scoreDrink(perfect, 1);
    expect([s.composition, s.shot, s.milk, s.speed]).toEqual([40, 30, 20, 10]);
    expect(s.total).toBe(100);
  });
  it('우유 없는 메뉴: 우유 20점을 구성 +10, 샷 +10으로 재배분', () => {
    const s = scoreDrink({ ...perfect, milkQuality: null }, 1);
    expect([s.composition, s.shot, s.milk, s.speed]).toEqual([50, 40, 0, 10]);
    expect(s.total).toBe(100);
  });
  it('속도 = 남은 인내심 비율 × 10', () => {
    expect(scoreDrink(perfect, 0.5).speed).toBe(5);
    expect(scoreDrink(perfect, 0).total).toBe(90);
  });
  it('70점 미만 반품, 깐깐한 손님은 80점 기준', () => {
    const j = { ...perfect, shotQuality: 50, milkQuality: 50 }; // 40+15+10+10 = 75
    expect(scoreDrink(j, 1).returned).toBe(false);
    expect(scoreDrink(j, 1, 80).returned).toBe(true);
  });
  it('다른 메뉴로 인식되면 점수와 무관하게 반품', () => {
    expect(scoreDrink({ ...perfect, lookalikeId: 'cafe-latte' }, 1).returned).toBe(true);
  });
});

describe('콤보', () => {
  it('80점 이상 연속: 1.0 → 1.2 → 1.5(최대)', () => {
    expect(comboMultiplier(0)).toBe(1);
    expect(comboMultiplier(1)).toBe(1);
    expect(comboMultiplier(2)).toBe(1.2);
    expect(comboMultiplier(3)).toBe(1.5);
    expect(comboMultiplier(10)).toBe(1.5);
  });
  it('반품·이탈·80점 미만이면 초기화', () => {
    expect(nextStreak(2, 85, true)).toBe(3);
    expect(nextStreak(2, 79, true)).toBe(0);
    expect(nextStreak(2, 95, false)).toBe(0);
  });
  it('팁 = 10점당 1 × 콤보 × 손님 팁 배율', () => {
    expect(tipFor(100, 1, { tipMult: 1 })).toBe(10);
    expect(tipFor(100, 3, { tipMult: 1.5 })).toBe(23);
  });
});

describe('스테이지 집계와 별', () => {
  it('클리어·별 계산', () => {
    const rec = (score: number, extra = {}) => ({ menuId: 'espresso', score, returned: false, timeout: false, tip: 0, mistakes: [], ...extra });
    const all95 = Array.from({ length: 6 }, () => rec(95));
    expect(summarize(all95, 4).stars).toBe(3);
    const withReturn = [...all95.slice(0, 5), rec(60, { returned: true, mistakes: ['SHOT_LOW'] })];
    const s = summarize(withReturn, 4);
    expect(s.cleared).toBe(true);
    expect(s.returned).toBe(1);
    expect(s.stars).toBe(2);
    expect(summarize(all95, 4, false).cleared).toBe(false); // 위생 조건 실패
    expect(starsFor(true, 79, 0)).toBe(1);
  });
  it('가장 많이 한 실수 3개', () => {
    expect(topMistakes({ SHOT_LOW: 3, WRONG_CUP: 1, MILK_COLD: 2, TIMEOUT: 5 })).toEqual(['TIMEOUT', 'SHOT_LOW', 'MILK_COLD']);
  });
});

describe('위생 감점', () => {
  it('퍽 처리 없이 다음 샷 → 위반, 게이지 −10', () => {
    const first = onShotStart({ puckKnocked: true, flushed: true });
    expect(first.violation).toBe(false);
    expect(onShotStart(first.next).violation).toBe(true);
    expect(onShotStart({ puckKnocked: true, flushed: false }).violation).toBe(true);
    expect(applyGaugePenalty(100, 'puck')).toBe(90);
  });
  it('스팀완드: 퍼징 전 스팀 → 위반, 게이지 −15, 0 아래로 내려가지 않음', () => {
    expect(onSteamStart({ wiped: true, purged: false }).violation).toBe(true);
    expect(onSteamStart({ wiped: true, purged: true }).violation).toBe(false);
    expect(onSteamStart({ wiped: false, purged: true }).violation).toBe(true);
    expect(applyGaugePenalty(100, 'wand')).toBe(85);
    expect(applyGaugePenalty(10, 'wand')).toBe(0);
  });
  it('마감 청소는 순서대로 + 약 20초', () => {
    let c = startCleaning();
    c = cleaningTap(c, 'flush');
    expect(c.index).toBe(0);
    for (const st of HYGIENE_RULES.cleaningSteps) c = cleaningTap(c, st);
    expect(cleaningDone(c)).toBe(false);
    expect(cleaningDone({ ...c, elapsed: 20 })).toBe(true);
  });
});
