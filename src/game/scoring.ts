// 점수 — GAME_PLAN.md 5.8 (순수 함수)
import { SCORE_RULES } from '../data/standards';
import type { CustomerType, MistakeCode } from '../data/types';
import type { DrinkJudgement } from './judge';

export interface DrinkScore {
  total: number;          // 0~100 (반올림)
  composition: number;
  shot: number;
  milk: number;
  speed: number;
  returned: boolean;
  wrongMenu: boolean;
}

/**
 * 한 잔 100점 = 구성·비율·순서 40 + 샷 30 + 우유 20 + 속도 10.
 * 우유가 없는 메뉴는 우유 20점을 구성 +10, 샷 +10으로 재배분.
 * 다른 메뉴로 인식되면 점수와 상관없이 반품.
 */
export function scoreDrink(
  j: DrinkJudgement, patienceRatio: number, returnThreshold: number = SCORE_RULES.returnThreshold,
): DrinkScore {
  const w = j.milkQuality === null ? SCORE_RULES.noMilk : SCORE_RULES.withMilk;
  const composition = j.composition * w.composition;
  const shot = (j.shotQuality / 100) * w.shot;
  const milk = j.milkQuality === null ? 0 : (j.milkQuality / 100) * w.milk;
  const speed = Math.max(0, Math.min(1, patienceRatio)) * w.speed;
  const total = Math.round(composition + shot + milk + speed);
  const wrongMenu = j.lookalikeId !== null;
  return { total, composition, shot, milk, speed, wrongMenu, returned: wrongMenu || total < returnThreshold };
}

/** 80점 이상 연속 서빙 수 → 팁 배율 1.0 → 1.2 → 1.5(최대) */
export function comboMultiplier(streak: number): number {
  const m = SCORE_RULES.comboMultipliers;
  if (streak <= 0) return m[0];
  return m[Math.min(streak, m.length) - 1];
}

/** 서빙 후 콤보 수 갱신: 80점 이상 서빙이면 +1, 아니면(반품·이탈 포함) 0 */
export function nextStreak(streak: number, score: number, accepted: boolean): number {
  return accepted && score >= SCORE_RULES.comboMinScore ? streak + 1 : 0;
}

/** 팁(동전) = 10점당 1개 × 콤보 배율 × 손님 팁 배율 */
export function tipFor(score: number, streakAfter: number, customer: Pick<CustomerType, 'tipMult'>): number {
  return Math.round((score / 10) * SCORE_RULES.tipPer10Points * comboMultiplier(streakAfter) * customer.tipMult);
}

export interface OrderRecord {
  menuId: string;
  score: number;          // 이탈은 0
  returned: boolean;
  timeout: boolean;
  tip: number;
  mistakes: MistakeCode[];
}

export interface StageSummary {
  served: number;         // 받아 간 잔
  returned: number;
  timeouts: number;
  successes: number;      // 반품 없이 70점 이상
  avgScore: number;       // 모든 주문 평균(이탈 0점)
  totalScore: number;     // 받아 간 잔 점수 합 + 팁
  tips: number;
  cleared: boolean;
  stars: number;
  mistakeCounts: Partial<Record<MistakeCode, number>>;
}

export function summarize(
  records: OrderRecord[], clearCount: number, extraClearOk = true,
): StageSummary {
  const served = records.filter((r) => !r.returned && !r.timeout);
  const returned = records.filter((r) => r.returned).length;
  const timeouts = records.filter((r) => r.timeout).length;
  const successes = served.filter((r) => r.score >= SCORE_RULES.returnThreshold).length;
  const avgScore = records.length ? records.reduce((a, r) => a + r.score, 0) / records.length : 0;
  const tips = records.reduce((a, r) => a + r.tip, 0);
  const totalScore = served.reduce((a, r) => a + r.score, 0) + tips;
  const cleared = successes >= clearCount && extraClearOk;
  const mistakeCounts: Partial<Record<MistakeCode, number>> = {};
  for (const r of records) for (const m of r.mistakes) mistakeCounts[m] = (mistakeCounts[m] ?? 0) + 1;
  return {
    served: served.length, returned, timeouts, successes, avgScore, totalScore, tips, cleared,
    stars: starsFor(cleared, avgScore, returned), mistakeCounts,
  };
}

/** ★ 클리어 / ★★ 평균 80 이상 / ★★★ 평균 90 이상 + 반품 0 */
export function starsFor(cleared: boolean, avgScore: number, returned: number): number {
  if (!cleared) return 0;
  if (avgScore >= SCORE_RULES.stars.three && returned === 0) return 3;
  if (avgScore >= SCORE_RULES.stars.two) return 2;
  return 1;
}

/** 가장 많이 한 실수 n개 */
export function topMistakes(counts: Partial<Record<MistakeCode, number>>, n = 3): MistakeCode[] {
  return (Object.entries(counts) as [MistakeCode, number][])
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k);
}
