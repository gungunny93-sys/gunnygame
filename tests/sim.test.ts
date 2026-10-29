// 정답 입력 봇: 실제 스토어(게임 규칙 전체)를 사람처럼 조작해 7개 스테이지·연습·튜토리얼이
// 처음부터 끝까지 막힘 없이 클리어되는지 확인한다. 봇은 버튼 하나 누를 때마다 반응 시간을 쓴다.
import { describe, expect, it } from 'vitest';
import { getMenu } from '../src/data/menus';
import { STAGES } from '../src/data/stages';
import { HYGIENE_RULES, INGREDIENTS, STANDARDS } from '../src/data/standards';
import type { DrinkRecipe } from '../src/data/types';
import { createGameStore } from '../src/game/store';
import { TUTORIAL_STEPS } from '../src/data/tutorial';
import { tutorialConditionMet } from '../src/game/tutorial';

type Store = ReturnType<typeof createGameStore>;
const DT = 0.02;
const REACTION = 0.5;   // 버튼 하나 누르는 데 드는 시간(초)

class Bot {
  shotTarget: number | null = null;
  constructor(public store: Store, public opts: { parallel: boolean } = { parallel: true }) {}
  get s() { return this.store.getState().session; }
  /** t초 동안 진행. 추출 중이면 목표량에서 정지(다른 일을 하는 중에도 지켜봄) */
  wait(t: number) {
    for (let x = 0; x < t - 1e-9; x += DT) {
      const s = this.s;
      if (!s) return;
      if (s.cleaning) this.clean();
      if (this.shotTarget !== null && s.espresso.running && s.espresso.ml + 1.2 * 2 * 3 * DT * 0.5 >= this.shotTarget) {
        this.store.getState().stopShot();
        this.shotTarget = null;
      }
      this.store.getState().tick(DT);
    }
  }
  act(fn: () => void) { fn(); this.wait(REACTION); }
  until(cond: () => boolean, max = 60) {
    let t = 0;
    while (this.s && !cond() && t < max) { this.wait(DT); t += DT; }
  }
  clean() {
    const st = this.store.getState();
    for (const step of HYGIENE_RULES.cleaningSteps) st.cleanTap(step);
    while (this.s?.cleaning) this.store.getState().tick(0.1);
  }

  pullShot(r: DrinkRecipe) {
    const std = STANDARDS.shots[r.shot];
    const st = () => this.store.getState();
    if (this.s!.espresso.basket !== std.basket) this.act(() => st().setBasket(std.basket));
    if (this.s!.espresso.grind !== this.s!.idealGrind) this.act(() => st().setGrind(this.s!.idealGrind));
    if (this.s!.hygieneOn) { this.act(() => st().knockPuck()); this.act(() => st().flushGroup()); }
    this.shotTarget = std.targetMl;
    this.act(() => st().startShot());
  }

  steamMilk(r: DrinkRecipe) {
    const st = () => this.store.getState();
    const needFoamOnly = !r.milk;
    this.act(() => st().emptyPitcher());
    if (this.s!.hygieneOn) { this.act(() => st().wipeWand()); this.act(() => st().purgeWand()); }
    const foam = r.milk ? (r.milk.foamCm[0] + r.milk.foamCm[1]) / 2 : 0.8;
    const aerSec = foam / STANDARDS.milk.aerateFoamCmPerSec;
    st().setHold('aerate', true);
    this.until(() => this.s!.pitcher.foamCm >= foam - 0.01, aerSec + 2);
    st().setHold('aerate', false);
    if (!needFoamOnly) {
      st().setHold('roll', true);
      this.until(() => this.s!.pitcher.tempC >= 62.5, 30);
      st().setHold('roll', false);
    }
    this.wait(REACTION);
  }

  assemble(r: DrinkRecipe) {
    const st = () => this.store.getState();
    this.act(() => st().selectCup(r.cup));
    for (const step of r.steps) {
      const info = INGREDIENTS[step.ingredient];
      if (info.input === 'shot') {
        this.until(() => this.s!.espresso.ready !== null, 60);
        this.act(() => st().pourShot());
      } else if (info.input === 'tap') {
        for (let i = 0; i < step.amount; i++) this.act(() => st().tapIngredient(step.ingredient));
      } else {
        const k = step.ingredient as 'hotWater' | 'coldWater' | 'steamedMilk' | 'coldMilk';
        st().setHold(k, true);
        this.until(() => (this.s!.cup.amounts[step.ingredient] ?? 0) >= step.amount - 0.6, 30);
        st().setHold(k, false);
        this.wait(REACTION);
      }
    }
    this.act(() => st().sendToServe());
  }

  makeAndServe(uid: number, menuId: string) {
    const r = getMenu(menuId);
    const st = () => this.store.getState();
    const usesPitcher = !!r.milk || r.steps.some((x) => x.ingredient === 'foamSpoon');
    if (this.opts.parallel) {
      this.pullShot(r);                    // 추출이 흐르는 동안
      if (usesPitcher) this.steamMilk(r);  // 우유를 데운다
    } else {
      this.pullShot(r);
      this.until(() => this.s!.espresso.ready !== null, 60);
      if (usesPitcher) this.steamMilk(r);
    }
    this.assemble(r);
    if (!this.s) return;
    const slot = this.s.slots.findIndex((x) => x !== null);
    if (this.s.customers.some((c) => c.uid === uid)) this.act(() => st().serveTo(uid, slot));
    else this.act(() => st().discardSlot(slot));
  }

  playStage(maxSec = 900) {
    let guard = 0;
    while (this.s && !this.s.finished && guard < maxSec / 0.2) {
      const c = this.s.customers[0];
      if (!c) { this.wait(0.2); guard++; continue; }
      this.makeAndServe(c.uid, c.menuId);
    }
  }
}

describe('정답 입력 봇 시뮬레이션', () => {
  for (const stage of STAGES) {
    it(`스테이지 ${stage.id} 「${stage.name}」 클리어 가능`, () => {
      const results: { cleared: boolean; stars: number; avg: number; to: number }[] = [];
      for (const seed of [11, 22, 33, 44, 55]) {
        const store = createGameStore({ persist: false });
        store.getState().startStage(stage.id, seed);
        new Bot(store).playStage();
        const r = store.getState().lastResult;
        expect(store.getState().screen).toBe('result');
        expect(r).not.toBeNull();
        results.push({ cleared: r!.summary.cleared, stars: r!.summary.stars, avg: r!.summary.avgScore, to: r!.summary.timeouts });
      }
      // eslint-disable-next-line no-console
      console.log(`stage ${stage.id}`, JSON.stringify(results));
      expect(results.every((x) => x.cleared)).toBe(true);
    });
  }

  it('위생을 건너뛰는 봇은 스테이지 6에서 위생 조건 때문에 클리어하지 못한다', () => {
    const store = createGameStore({ persist: false });
    store.getState().startStage(6, 11);
    const bot = new Bot(store);
    // 위생 행동을 하지 않도록 hygieneOn을 속이지 않고, 행동만 생략
    bot.pullShot = function (r) {
      const std = STANDARDS.shots[r.shot];
      const st = () => this.store.getState();
      if (this.s!.espresso.basket !== std.basket) this.act(() => st().setBasket(std.basket));
      if (this.s!.espresso.grind !== this.s!.idealGrind) this.act(() => st().setGrind(this.s!.idealGrind));
      this.shotTarget = std.targetMl;
      this.act(() => st().startShot());
    };
    bot.playStage();
    const r = store.getState().lastResult!;
    expect(r.minHygiene).toBeLessThan(50);
    expect(r.summary.cleared).toBe(false);
  });

  it('연습 모드: 인내심 무제한, 반품되면 같은 주문 재도전, 끝내기로 결과 화면', () => {
    const store = createGameStore({ persist: false });
    store.getState().startPractice(4, ['cappuccino'], 5);
    const bot = new Bot(store);
    bot.wait(2);
    const c = bot.s!.customers[0];
    expect(Number.isFinite(c.patience)).toBe(false);
    // 일부러 거품 없는 카푸치노 → 반품 + 선배 힌트, 손님은 그대로
    store.getState().selectCup('cappuccinoCup');
    bot.pullShot(getMenu('cappuccino'));
    bot.until(() => bot.s!.espresso.ready !== null);
    store.getState().pourShot();
    store.getState().sendToServe();
    store.getState().serveTo(c.uid, 0);
    expect(bot.s!.records.at(-1)!.returned).toBe(true);
    expect(bot.s!.hint).toBeTruthy();
    expect(bot.s!.customers[0].uid).toBe(c.uid);
    // 제대로 다시 만들기
    bot.makeAndServe(c.uid, 'cappuccino');
    expect(bot.s!.records.at(-1)!.returned).toBe(false);
    bot.wait(1);
    expect(bot.s!.customers.length).toBe(1); // 다음 연습 손님
    store.getState().quitSession();
    expect(store.getState().screen).toBe('result');
    expect(store.getState().lastResult!.mode).toBe('practice');
  });

  it('연습 모드: 17개 메뉴 모두 봇이 만들어 통과', () => {
    const all = STAGES[6].menuIds;
    for (const id of all) {
      const store = createGameStore({ persist: false });
      store.getState().startPractice(7, [id], 9);
      const bot = new Bot(store);
      bot.wait(1.5);
      const c = bot.s!.customers[0];
      bot.makeAndServe(c.uid, c.menuId);
      const rec = bot.s!.records.at(-1)!;
      expect(rec.returned, `${id} ${rec.mistakes.join(',')}`).toBe(false);
      expect(rec.score, id).toBeGreaterThanOrEqual(90);
    }
  });

  it('튜토리얼: 단계 조건을 따라 두 잔을 만들면 완료된다', () => {
    const store = createGameStore({ persist: false });
    store.getState().startTutorial(1);
    const bot = new Bot(store);
    let stepIdx = 0;
    const advanceSteps = () => {
      while (stepIdx < TUTORIAL_STEPS.length) {
        const st = TUTORIAL_STEPS[stepIdx];
        if (st.until === 'none' || tutorialConditionMet(st.until, bot.s!)) stepIdx++;
        else break;
      }
    };
    bot.wait(2);
    advanceSteps();
    for (let i = 0; i < 2; i++) {
      const c = bot.s!.customers[0];
      bot.makeAndServe(c.uid, c.menuId);
      advanceSteps();
      bot.wait(2);
    }
    expect(bot.s!.finished).toBe(true);
    expect(store.getState().progress.tutorialDone).toBe(true);
  });
});
