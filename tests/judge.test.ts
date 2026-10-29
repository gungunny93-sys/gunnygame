import { describe, expect, it } from 'vitest';
import { MENUS, getMenu } from '../src/data/menus';
import { judgeDrink, orderIsCorrect } from '../src/game/judge';
import { perfectCup } from './helpers';

const opts = { shotTolerance: 0.15, ingredientTolerance: 0.15, menus: MENUS };

describe('레시피 판정', () => {
  it('17개 메뉴 모두 정답 컵은 실수 0, 다른 메뉴로 오인되지 않는다', () => {
    for (const m of MENUS) {
      const j = judgeDrink(perfectCup(m), m, opts);
      expect(j.mistakes, m.id).toEqual([]);
      expect(j.composition, m.id).toBe(1);
      expect(j.lookalikeId, m.id).toBeNull();
    }
  });
  it('컵이 틀리면 WRONG_CUP', () => {
    const m = getMenu('espresso');
    expect(judgeDrink(perfectCup(m, { cup: 'mug' }), m, opts).mistakes).toContain('WRONG_CUP');
  });
  it('재료 빠짐/추가 → MISSING_INGREDIENT / EXTRA_INGREDIENT', () => {
    const am = getMenu('americano-hot');
    expect(judgeDrink(perfectCup(am, { order: ['espresso'] }), am, opts).mistakes).toContain('MISSING_INGREDIENT');
    const es = getMenu('espresso');
    expect(judgeDrink(perfectCup(es, { order: ['espresso', 'vanillaSyrup'] }), es, opts).mistakes).toContain('EXTRA_INGREDIENT');
  });
  it('물 양이 ±15% 밖이면 WRONG_RATIO, 경계 안이면 통과', () => {
    const am = getMenu('americano-hot');
    expect(judgeDrink(perfectCup(am, { amounts: { hotWater: 276 } }), am, opts).mistakes).not.toContain('WRONG_RATIO');
    expect(judgeDrink(perfectCup(am, { amounts: { hotWater: 280 } }), am, opts).mistakes).toContain('WRONG_RATIO');
    const ia = getMenu('iced-americano');
    expect(judgeDrink(perfectCup(ia, { amounts: { ice: 2 } }), ia, opts).mistakes).toContain('WRONG_RATIO');
  });
  it('순서가 중요한 메뉴는 WRONG_ORDER, 아닌 메뉴는 통과', () => {
    const ia = getMenu('iced-americano');
    expect(judgeDrink(perfectCup(ia, { order: ['espresso', 'ice', 'coldWater'] }), ia, opts).mistakes).toContain('WRONG_ORDER');
    const am = getMenu('americano-hot');
    expect(judgeDrink(perfectCup(am, { order: ['hotWater', 'espresso'] }), am, opts).mistakes).not.toContain('WRONG_ORDER');
    const mocha = getMenu('cafe-mocha');
    expect(judgeDrink(perfectCup(mocha, { order: ['espresso', 'chocolateSauce', 'steamedMilk', 'whippedCream'] }), mocha, opts).mistakes).toContain('WRONG_ORDER');
  });
  it('orderIsCorrect는 둘 다 있는 재료만 비교', () => {
    expect(orderIsCorrect(['ice', 'espresso'], ['ice', 'coldWater', 'espresso'])).toBe(true);
    expect(orderIsCorrect(['espresso', 'ice'], ['ice', 'coldWater', 'espresso'])).toBe(false);
  });
  it('샷이 없으면 샷 품질 0, 스팀 우유 없으면 우유 품질 0', () => {
    const latte = getMenu('cafe-latte');
    const j = judgeDrink(perfectCup(latte, { order: ['espresso'] }), latte, opts);
    expect(j.milkQuality).toBe(0);
    expect(j.mistakes).toContain('MISSING_INGREDIENT');
    const j2 = judgeDrink(perfectCup(latte, { order: ['steamedMilk'] }), latte, opts);
    expect(j2.shotQuality).toBe(0);
  });
  it('우유 없는 메뉴는 milkQuality null', () => {
    expect(judgeDrink(perfectCup(getMenu('espresso')), getMenu('espresso'), opts).milkQuality).toBeNull();
  });
});

describe('다른 메뉴로 인식', () => {
  it('카푸치노 주문에 거품 얇은 라떼 비율 → "카페라떼 같은데요?"', () => {
    const cap = getMenu('cappuccino');
    const cup = perfectCup(cap, { cup: 'latteCup', amounts: { steamedMilk: 200 }, foamCm: 0.7 });
    expect(judgeDrink(cup, cap, opts).lookalikeId).toBe('cafe-latte');
  });
  it('라떼 주문에 카푸치노를 만들면 카푸치노로 인식', () => {
    const latte = getMenu('cafe-latte');
    const cup = perfectCup(getMenu('cappuccino'));
    expect(judgeDrink(cup, latte, opts).lookalikeId).toBe('cappuccino');
  });
  it('아이스 아메리카노 주문에 찬 우유를 넣으면 아이스 라떼로 인식', () => {
    const ia = getMenu('iced-americano');
    const cup = perfectCup(getMenu('iced-latte'));
    expect(judgeDrink(cup, ia, opts).lookalikeId).toBe('iced-latte');
  });
  it('양이 살짝 어긋난 정도로는 다른 메뉴로 보지 않는다', () => {
    const latte = getMenu('cafe-latte');
    const cup = perfectCup(latte, { amounts: { steamedMilk: 180 }, foamCm: 1.1 });
    expect(judgeDrink(cup, latte, opts).lookalikeId).toBeNull();
  });
});
