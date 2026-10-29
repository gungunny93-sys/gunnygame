import { STANDARDS } from '../src/data/standards';
import type { DrinkRecipe, Ingredient } from '../src/data/types';
import { type CupState, addToCup, emptyCup } from '../src/game/judge';

/** 레시피대로 완벽하게 만든 컵 */
export function perfectCup(r: DrinkRecipe, over: { order?: Ingredient[]; amounts?: Partial<Record<Ingredient, number>>; foamCm?: number; tempC?: number; cup?: CupState['cupId'] } = {}): CupState {
  const std = STANDARDS.shots[r.shot];
  let cup = emptyCup(over.cup ?? r.cup);
  const order = over.order ?? r.steps.map((s) => s.ingredient);
  for (const ing of order) {
    const step = r.steps.find((s) => s.ingredient === ing);
    const amt = over.amounts?.[ing] ?? step?.amount ?? 1;
    cup = addToCup(cup, ing, amt);
  }
  if (cup.amounts.espresso) cup = { ...cup, shot: { ml: cup.amounts.espresso, timeSec: (std.timeSec[0] + std.timeSec[1]) / 2, basket: std.basket, puckViolation: false } };
  if (cup.amounts.steamedMilk) {
    const foam = over.foamCm ?? (r.milk ? (r.milk.foamCm[0] + r.milk.foamCm[1]) / 2 : 0.5);
    cup = { ...cup, milk: { tempC: over.tempC ?? 62, foamCm: foam, coarse: false, wandDirty: false } };
  }
  return cup;
}
