// 정답 입력 봇: 실제 스토어를 사람처럼 조작한다. 버튼 하나 누를 때마다 반응 시간을 쓴다.
import { getMenu } from '../src/data/menus';
import { HYGIENE_RULES, INGREDIENTS, STANDARDS } from '../src/data/standards';
import type { DrinkRecipe } from '../src/data/types';
import { createGameStore } from '../src/game/store';

export type Store = ReturnType<typeof createGameStore>;
const DT = 0.02;

export class Bot {
  shotTarget: number | null = null;
  constructor(public store: Store, public opts: { parallel: boolean; reaction: number } = { parallel: true, reaction: 0.5 }) {}
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
  act(fn: () => void) { fn(); this.wait(this.opts.reaction); }
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
    if (!this.s) return;
    const std = STANDARDS.shots[r.shot];
    const st = () => this.store.getState();
    if (this.s!.espresso.basket !== std.basket) this.act(() => st().setBasket(std.basket));
    if (this.s!.espresso.grind !== this.s!.idealGrind) this.act(() => st().setGrind(this.s!.idealGrind));
    if (this.s!.hygieneOn) { this.act(() => st().knockPuck()); this.act(() => st().flushGroup()); }
    this.shotTarget = std.targetMl;
    this.act(() => st().startShot());
  }

  steamMilk(r: DrinkRecipe) {
    if (!this.s) return;
    const st = () => this.store.getState();
    const needFoamOnly = !r.milk;
    this.act(() => st().emptyPitcher());
    if (this.s!.hygieneOn) { this.act(() => st().wipeWand()); this.act(() => st().purgeWand()); }
    const foam = r.milk ? (r.milk.foamCm[0] + r.milk.foamCm[1]) / 2 : 0.8;
    const aerSec = foam / STANDARDS.milk.aerateFoamCmPerSec;
    st().setHold('aerate', true);
    this.until(() => !this.s || this.s.pitcher.foamCm >= foam - 0.01, aerSec + 2);
    st().setHold('aerate', false);
    if (!this.s) return;
    if (!needFoamOnly) {
      st().setHold('roll', true);
      this.until(() => !this.s || this.s.pitcher.tempC >= 62.5, 30);
      st().setHold('roll', false);
    }
    this.wait(this.opts.reaction);
  }

  assemble(r: DrinkRecipe) {
    if (!this.s) return;
    const st = () => this.store.getState();
    this.act(() => st().selectCup(r.cup));
    for (const step of r.steps) {
      if (!this.s) return;
      const info = INGREDIENTS[step.ingredient];
      if (info.input === 'shot') {
        this.until(() => !this.s || this.s.espresso.ready !== null, 60);
        this.act(() => st().pourShot());
      } else if (info.input === 'tap') {
        for (let i = 0; i < step.amount; i++) this.act(() => st().tapIngredient(step.ingredient));
      } else {
        const k = step.ingredient as 'hotWater' | 'coldWater' | 'steamedMilk' | 'coldMilk';
        st().setHold(k, true);
        this.until(() => !this.s || (this.s.cup.amounts[step.ingredient] ?? 0) >= step.amount - 0.6, 30);
        st().setHold(k, false);
        this.wait(this.opts.reaction);
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
      this.until(() => !this.s || this.s.espresso.ready !== null, 60);
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

