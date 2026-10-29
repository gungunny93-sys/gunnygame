// 기준값 — GAME_PLAN.md 6.2. 커피 수치는 모두 teacherCheck 대상이다.
// 학교 교재와 다르면 이 파일의 숫자만 고치면 된다.
import type { CupId, Ingredient, ShotStandard, ShotType, Unit } from './types';

export const STANDARDS = {
  timeScale: 3,
  shots: {
    single:          { targetMl: 30, timeSec: [20, 30], basket: 1 },
    doppio:          { targetMl: 60, timeSec: [20, 30], basket: 2 },
    ristretto:       { targetMl: 18, timeSec: [12, 20], basket: 1 },
    ristrettoDouble: { targetMl: 36, timeSec: [12, 20], basket: 2 },
    lungo:           { targetMl: 55, timeSec: [35, 50], basket: 1 },
  } satisfies Record<ShotType, ShotStandard>,
  grind: { min: 1, max: 10, baseFlowMlPerSec: 1.2, factorPerStep: 1.25 },
  milk: {
    startTempC: 5, idealC: [60, 65], okC: [55, 70], scaldC: 70,
    aerateMaxTempC: 37, aerateFoamCmPerSec: 0.3, aerateTempPerSec: 5, rollTempPerSec: 6,
  },
} as const;

/** 교사 확인 표에 쓰는 이름(README 표와 화면 공용) */
export const SHOT_NAMES: Record<ShotType, string> = {
  single: '싱글 샷', doppio: '도피오(더블)', ristretto: '리스트레토',
  ristrettoDouble: '리스트레토 2샷', lungo: '룽고',
};

// ───────────────────────────────────────────────────────────────
// 아래는 커피 기준이 아니라 '게임 규칙' 수치다(교재 대조 대상 아님).
// ───────────────────────────────────────────────────────────────

/** 판정 감점 규칙(judge.ts가 사용) */
export const JUDGE_RULES = {
  shot: {
    amountPenaltyInTol: 15,     // 허용 오차 끝에서의 양 감점
    amountPenaltyOutBase: 15,   // 허용 오차를 벗어나면 기본 감점
    amountPenaltyOutPerTol: 35, // 허용 오차 1배만큼 더 벗어날 때마다 추가 감점
    amountPenaltyMax: 50,
    timePenaltyOutBase: 15,     // 시간 범위를 벗어나면 기본 감점
    timePenaltyPerSec: 3.5,     // 벗어난 1초마다 추가 감점
    timePenaltyMax: 50,
  },
  milk: {
    okZonePenalty: 20,          // 55~60, 65~70℃
    coldPenalty: 50,            // 55℃ 미만
    foamPenalty: 35,            // 거품 두께 범위 밖
    coarsePenalty: 25,          // 거친 거품
  },
  composition: {
    wrongCup: 0.25,
    missingEach: 0.35,
    extraEach: 0.25,
    ratioEach: 0.2,
    wrongOrder: 0.3,
  },
  lookalike: {
    minOwnDistance: 0.12,       // 주문 메뉴와 이만큼은 달라야 '다른 메뉴'로 본다
    margin: 0.05,               // 다른 메뉴가 이만큼 더 가까워야 한다
    cupMismatch: 0.3,
    foamWeight: 0.5,
    espressoMlWeight: 1 / 100,
  },
  macchiatoMinFoamCm: 0.5,      // 거품 얹기(스푼)에 필요한 피처 거품 두께
} as const;

/** 점수 규칙(scoring.ts가 사용) — GAME_PLAN 5.8 */
export const SCORE_RULES = {
  withMilk: { composition: 40, shot: 30, milk: 20, speed: 10 },
  noMilk:   { composition: 50, shot: 40, milk: 0, speed: 10 },
  returnThreshold: 70,
  comboMinScore: 80,
  comboMultipliers: [1.0, 1.2, 1.5],   // 연속 1잔, 2잔, 3잔 이상
  tipPer10Points: 1,                   // 10점당 동전 1개
  stars: { two: 80, three: 90 },
} as const;

/** 위생 규칙 — GAME_PLAN 5.7 */
export const HYGIENE_RULES = {
  start: 100,
  puckPenaltyGauge: 10,
  puckPenaltyQuality: 20,
  wandPenaltyGauge: 15,
  wandPenaltyQuality: 20,
  resumeAt: 50,
  cleaningSeconds: 20,
  cleaningSteps: ['knock', 'flush', 'wipe', 'purge', 'counter'] as const,
} as const;

/** 컵 용량(표시·넘침 방지용, ml) */
export const CUPS: Record<CupId, { name: string; capacityMl: number }> = {
  demitasse:     { name: '데미타세', capacityMl: 90 },
  cappuccinoCup: { name: '카푸치노 잔', capacityMl: 200 },
  latteCup:      { name: '라떼 잔', capacityMl: 320 },
  mug:           { name: '머그', capacityMl: 360 },
  icedCup:       { name: '아이스컵', capacityMl: 420 },
  dessertGlass:  { name: '디저트 글라스', capacityMl: 150 },
};

export const CUP_ORDER: CupId[] = ['demitasse', 'cappuccinoCup', 'latteCup', 'mug', 'icedCup', 'dessertGlass'];

/** 재료 표시 정보. volumeMl은 컵 단면도에서 1단위가 차지하는 부피(표시용) */
export const INGREDIENTS: Record<Ingredient, {
  name: string; unit: Unit; input: 'shot' | 'hold' | 'tap'; volumeMl: number; pourMlPerSec?: number;
}> = {
  espresso:       { name: '샷 붓기', unit: 'ml', input: 'shot', volumeMl: 1 },
  hotWater:       { name: '뜨거운 물', unit: 'ml', input: 'hold', volumeMl: 1, pourMlPerSec: 40 },
  coldWater:      { name: '찬물', unit: 'ml', input: 'hold', volumeMl: 1, pourMlPerSec: 40 },
  ice:            { name: '얼음', unit: 'scoop', input: 'tap', volumeMl: 40 },
  steamedMilk:    { name: '스팀 우유', unit: 'ml', input: 'hold', volumeMl: 1, pourMlPerSec: 30 },
  coldMilk:       { name: '찬 우유', unit: 'ml', input: 'hold', volumeMl: 1, pourMlPerSec: 40 },
  foamSpoon:      { name: '거품 얹기', unit: 'portion', input: 'tap', volumeMl: 12 },
  vanillaSyrup:   { name: '바닐라 시럽', unit: 'pump', input: 'tap', volumeMl: 10 },
  chocolateSauce: { name: '초코 소스', unit: 'portion', input: 'tap', volumeMl: 15 },
  whippedCream:   { name: '휘핑크림', unit: 'portion', input: 'tap', volumeMl: 30 },
  iceCream:       { name: '바닐라 아이스크림', unit: 'scoop', input: 'tap', volumeMl: 60 },
};

export const UNIT_NAMES: Record<Unit, string> = { ml: 'ml', scoop: '스쿱', pump: '펌프', portion: '회' };

/** 장비 수치(게임 규칙) */
export const EQUIPMENT = {
  shotGlassMaxMl: 80,       // 샷 잔이 넘치면 자동 정지
  pitcherMl: 350,           // 피처에 채우는 우유 양
  maxTempC: 95,
  serveSlots: 3,
  slowPatienceMult: 1.5,    // 게임 속도 '느림'
  slowSteamMult: 0.75,
} as const;
