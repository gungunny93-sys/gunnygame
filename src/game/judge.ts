// 판정 — GAME_PLAN.md 5.3 / 5.4 / 5.5 (순수 함수)
import { HYGIENE_RULES, INGREDIENTS, JUDGE_RULES, STANDARDS } from '../data/standards';
import type { CupId, DrinkRecipe, Ingredient, MistakeCode, ShotStandard } from '../data/types';
import { foamJudge, tempZone } from './steamModel';

export interface ShotResult {
  ml: number;
  timeSec: number;
  basket: 1 | 2;
  puckViolation: boolean;   // 퍽 버리기·물 흘리기 없이 추출한 샷
}

export interface MilkSnapshot {
  tempC: number;
  foamCm: number;
  coarse: boolean;
  wandDirty: boolean;
}

export interface CupLayer { ingredient: Ingredient; amount: number }

export interface CupState {
  cupId: CupId | null;
  amounts: Partial<Record<Ingredient, number>>;  // 레시피 단위(ml·스쿱·펌프·회)
  addOrder: Ingredient[];                         // 처음 담은 순서
  layers: CupLayer[];                             // 그림용(연속된 같은 재료는 합침)
  shot: ShotResult | null;
  milk: MilkSnapshot | null;
}

export function emptyCup(cupId: CupId | null = null): CupState {
  return { cupId, amounts: {}, addOrder: [], layers: [], shot: null, milk: null };
}

/** 컵에 재료를 더한다(순수). */
export function addToCup(cup: CupState, ingredient: Ingredient, amount: number): CupState {
  if (amount <= 0) return cup;
  const amounts = { ...cup.amounts, [ingredient]: (cup.amounts[ingredient] ?? 0) + amount };
  const addOrder = cup.addOrder.includes(ingredient) ? cup.addOrder : [...cup.addOrder, ingredient];
  const layers = cup.layers.slice();
  const last = layers[layers.length - 1];
  if (last && last.ingredient === ingredient) layers[layers.length - 1] = { ingredient, amount: last.amount + amount };
  else layers.push({ ingredient, amount });
  return { ...cup, amounts, addOrder, layers };
}

/** 컵 안의 부피(ml, 표시용) */
export function cupVolumeMl(cup: Pick<CupState, 'amounts'>): number {
  let v = 0;
  for (const [ing, amt] of Object.entries(cup.amounts) as [Ingredient, number][]) v += amt * INGREDIENTS[ing].volumeMl;
  return v;
}

// ── 샷 판정 ──────────────────────────────────────────────

export interface ShotJudgement { quality: number; mistakes: MistakeCode[]; amountPenalty: number; timePenalty: number }

/** 샷 품질 점수(0~100) = 100 − 양 편차 감점 − 시간 편차 감점 (− 위생 감점) */
export function judgeShot(shot: ShotResult, std: ShotStandard, tolerance: number): ShotJudgement {
  const r = JUDGE_RULES.shot;
  const mistakes: MistakeCode[] = [];
  const dev = Math.abs(shot.ml - std.targetMl) / std.targetMl;
  let amountPenalty: number;
  if (dev <= tolerance + 1e-9) {
    amountPenalty = tolerance > 0 ? (dev / tolerance) * r.amountPenaltyInTol : 0;
  } else {
    mistakes.push(shot.ml < std.targetMl ? 'SHOT_LOW' : 'SHOT_HIGH');
    amountPenalty = Math.min(r.amountPenaltyMax, r.amountPenaltyOutBase + ((dev - tolerance) / tolerance) * r.amountPenaltyOutPerTol);
  }
  let timePenalty = 0;
  const [tMin, tMax] = std.timeSec;
  if (shot.timeSec < tMin) {
    mistakes.push('UNDER_EXTRACTED');
    timePenalty = Math.min(r.timePenaltyMax, r.timePenaltyOutBase + (tMin - shot.timeSec) * r.timePenaltyPerSec);
  } else if (shot.timeSec > tMax) {
    mistakes.push('OVER_EXTRACTED');
    timePenalty = Math.min(r.timePenaltyMax, r.timePenaltyOutBase + (shot.timeSec - tMax) * r.timePenaltyPerSec);
  }
  let quality = 100 - amountPenalty - timePenalty;
  if (shot.puckViolation) {
    mistakes.push('PUCK_NOT_KNOCKED');
    quality -= HYGIENE_RULES.puckPenaltyQuality;
  }
  return { quality: clamp(quality, 0, 100), mistakes, amountPenalty, timePenalty };
}

/** 테스트 샷의 맛 설명 */
export function tasteOf(shot: ShotResult, std: ShotStandard, tolerance: number): { label: string; codes: MistakeCode[] } {
  const j = judgeShot({ ...shot, puckViolation: false }, std, tolerance);
  const parts: string[] = [];
  if (j.mistakes.includes('UNDER_EXTRACTED')) parts.push('시큼하고 얇아요(과소추출)');
  if (j.mistakes.includes('OVER_EXTRACTED')) parts.push('쓰고 떫어요(과다추출)');
  if (j.mistakes.includes('SHOT_LOW')) parts.push('양이 적어 너무 진해요');
  if (j.mistakes.includes('SHOT_HIGH')) parts.push('양이 많아 밍밍해요');
  return { label: parts.length ? parts.join(' · ') : '균형 잡힌 단맛과 쌉쌀함! 좋아요', codes: j.mistakes };
}

// ── 우유 판정 ─────────────────────────────────────────────

export interface MilkJudgement { quality: number; mistakes: MistakeCode[] }

export function judgeMilk(milk: MilkSnapshot, foamRange: readonly [number, number]): MilkJudgement {
  const r = JUDGE_RULES.milk;
  const mistakes: MistakeCode[] = [];
  let quality = 100;
  const zone = tempZone(milk.tempC);
  if (zone === 'scalded') { mistakes.push('MILK_SCALDED'); quality = 0; }
  else if (zone === 'cold') { mistakes.push('MILK_COLD'); quality -= r.coldPenalty; }
  else if (zone === 'low' || zone === 'high') quality -= r.okZonePenalty;

  const f = foamJudge(milk.foamCm, foamRange);
  if (f === 'thin') { mistakes.push('FOAM_THIN'); quality -= r.foamPenalty; }
  if (f === 'thick') { mistakes.push('FOAM_THICK'); quality -= r.foamPenalty; }
  if (milk.coarse) { mistakes.push('COARSE_FOAM'); quality -= r.coarsePenalty; }
  if (milk.wandDirty) { mistakes.push('WAND_NOT_CLEANED'); quality -= HYGIENE_RULES.wandPenaltyQuality; }
  return { quality: clamp(quality, 0, 100), mistakes };
}

// ── 음료 전체 판정 ─────────────────────────────────────────

export interface JudgeOptions {
  shotTolerance: number;
  ingredientTolerance: number;
  menus: DrinkRecipe[];       // '다른 메뉴로 인식' 비교 대상
}

export interface DrinkJudgement {
  mistakes: MistakeCode[];
  composition: number;        // 0~1
  shotQuality: number;        // 0~100
  milkQuality: number | null; // 스팀 우유 메뉴만
  lookalikeId: string | null; // 비율이 더 가까운 다른 메뉴
}

export function judgeDrink(cup: CupState, recipe: DrinkRecipe, opts: JudgeOptions): DrinkJudgement {
  const c = JUDGE_RULES.composition;
  const mistakes: MistakeCode[] = [];
  let composition = 1;

  // 1. 컵
  if (cup.cupId !== recipe.cup) { mistakes.push('WRONG_CUP'); composition -= c.wrongCup; }

  // 2. 재료 구성
  const want = new Map(recipe.steps.map((s) => [s.ingredient, s.amount]));
  const have = (Object.keys(cup.amounts) as Ingredient[]).filter((k) => (cup.amounts[k] ?? 0) > 0);
  const missing = [...want.keys()].filter((k) => !have.includes(k));
  const extra = have.filter((k) => !want.has(k));
  if (missing.length) { mistakes.push('MISSING_INGREDIENT'); composition -= c.missingEach * missing.length; }
  if (extra.length) { mistakes.push('EXTRA_INGREDIENT'); composition -= c.extraEach * extra.length; }

  // 3. 비율(에스프레소 양은 샷 판정에서 본다)
  let ratioWrong = 0;
  for (const [ing, target] of want) {
    if (ing === 'espresso') continue;
    const amt = cup.amounts[ing] ?? 0;
    if (amt <= 0) continue;
    if (Math.abs(amt - target) / target > opts.ingredientTolerance + 1e-9) ratioWrong++;
  }
  if (ratioWrong) { mistakes.push('WRONG_RATIO'); composition -= c.ratioEach * ratioWrong; }

  // 4. 순서
  if (recipe.orderMatters && !orderIsCorrect(cup.addOrder, recipe.steps.map((s) => s.ingredient))) {
    mistakes.push('WRONG_ORDER'); composition -= c.wrongOrder;
  }

  // 5. 샷·우유 품질
  let shotQuality = 0;
  if (cup.shot && (cup.amounts.espresso ?? 0) > 0) {
    const sj = judgeShot(cup.shot, STANDARDS.shots[recipe.shot], opts.shotTolerance);
    shotQuality = sj.quality;
    mistakes.push(...sj.mistakes);
  }
  let milkQuality: number | null = null;
  if (recipe.milk) {
    milkQuality = 0;
    if (cup.milk && (cup.amounts.steamedMilk ?? 0) > 0) {
      const mj = judgeMilk(cup.milk, recipe.milk.foamCm);
      milkQuality = mj.quality;
      mistakes.push(...mj.mistakes);
    }
  }

  // 6. 다른 메뉴로 인식
  const lookalikeId = findLookalike(cup, recipe, opts.menus);

  return { mistakes: unique(mistakes), composition: clamp(composition, 0, 1), shotQuality, milkQuality, lookalikeId };
}

/** 담은 순서(처음 담은 순서)가 레시피 순서와 같은가 — 둘 다 있는 재료끼리만 비교 */
export function orderIsCorrect(addOrder: Ingredient[], recipeOrder: Ingredient[]): boolean {
  const a = addOrder.filter((i) => recipeOrder.includes(i));
  const b = recipeOrder.filter((i) => a.includes(i));
  return a.every((x, i) => x === b[i]);
}

// ── 다른 메뉴로 인식 ───────────────────────────────────────

type Features = Map<string, number>;

function featuresOf(amounts: Partial<Record<Ingredient, number>>, foamCm: number | null): Features {
  const L = JUDGE_RULES.lookalike;
  const f: Features = new Map();
  let total = 0;
  for (const [ing, amt] of Object.entries(amounts) as [Ingredient, number][]) total += amt * INGREDIENTS[ing].volumeMl;
  if (total <= 0) return f;
  for (const [ing, amt] of Object.entries(amounts) as [Ingredient, number][]) {
    if (amt > 0) f.set(ing, (amt * INGREDIENTS[ing].volumeMl) / total);
  }
  f.set('_esp', (amounts.espresso ?? 0) * L.espressoMlWeight);
  if (foamCm !== null) f.set('_foam', foamCm * L.foamWeight);
  return f;
}

function recipeFeatures(r: DrinkRecipe): Features {
  const amounts: Partial<Record<Ingredient, number>> = {};
  for (const s of r.steps) amounts[s.ingredient] = (amounts[s.ingredient] ?? 0) + s.amount;
  const foam = r.milk ? (r.milk.foamCm[0] + r.milk.foamCm[1]) / 2 : null;
  return featuresOf(amounts, foam);
}

function distance(a: Features, b: Features): number {
  const keys = new Set([...a.keys(), ...b.keys()]);
  let s = 0;
  for (const k of keys) s += ((a.get(k) ?? 0) - (b.get(k) ?? 0)) ** 2;
  return Math.sqrt(s);
}

export function menuDistance(cup: CupState, recipe: DrinkRecipe): number {
  const foam = cup.milk && (cup.amounts.steamedMilk ?? 0) > 0 ? cup.milk.foamCm : null;
  const cf = featuresOf(cup.amounts, recipe.milk ? (foam ?? 0) : foam);
  let d = distance(cf, recipeFeatures(recipe));
  if (cup.cupId !== recipe.cup) d += JUDGE_RULES.lookalike.cupMismatch;
  return d;
}

/** 주문한 메뉴보다 확실히 더 가까운 다른 메뉴가 있으면 그 id */
export function findLookalike(cup: CupState, ordered: DrinkRecipe, menus: DrinkRecipe[]): string | null {
  if (cupVolumeMl(cup) <= 0) return null;
  const L = JUDGE_RULES.lookalike;
  const own = menuDistance(cup, ordered);
  if (own < L.minOwnDistance) return null;
  let best: { id: string; d: number } | null = null;
  for (const m of menus) {
    if (m.id === ordered.id) continue;
    const d = menuDistance(cup, m);
    if (!best || d < best.d) best = { id: m.id, d };
  }
  if (best && best.d + L.margin < own) return best.id;
  return null;
}

function unique<T>(xs: T[]): T[] { return [...new Set(xs)]; }
function clamp(x: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, x)); }
