// 러시아워 바 — 콘텐츠·게임 공용 타입 (GAME_PLAN.md 6.1 + 확장)

export type ShotType = 'single' | 'doppio' | 'ristretto' | 'ristrettoDouble' | 'lungo';
export type Ingredient =
  | 'espresso' | 'hotWater' | 'coldWater' | 'ice' | 'steamedMilk' | 'coldMilk'
  | 'foamSpoon' | 'vanillaSyrup' | 'chocolateSauce' | 'whippedCream' | 'iceCream';
export type CupId = 'demitasse' | 'cappuccinoCup' | 'latteCup' | 'mug' | 'icedCup' | 'dessertGlass';
export type Unit = 'ml' | 'scoop' | 'pump' | 'portion';

export interface RecipeStep { ingredient: Ingredient; amount: number; unit: Unit }

export interface DrinkRecipe {
  id: string;
  name: string;              // 화면 표시 이름
  temp: 'hot' | 'iced';
  cup: CupId;
  shot: ShotType;
  steps: RecipeStep[];       // 정답 구성(순서 포함)
  orderMatters: boolean;     // true면 steps 순서대로 담아야 함
  milk?: { foamCm: [number, number] };  // 스팀 우유를 쓰는 메뉴만
  learnPoint: string;        // 영업 준비 카드·결과 화면에 쓰는 한 줄
  teacherCheck?: boolean;    // 학교 교재와 대조가 필요한 수치면 true
}

export interface ShotStandard { targetMl: number; timeSec: readonly [number, number]; basket: 1 | 2 }

export type MistakeCode =
  | 'UNDER_EXTRACTED' | 'OVER_EXTRACTED' | 'SHOT_LOW' | 'SHOT_HIGH'
  | 'MILK_COLD' | 'MILK_SCALDED' | 'FOAM_THIN' | 'FOAM_THICK' | 'COARSE_FOAM'
  | 'WRONG_CUP' | 'MISSING_INGREDIENT' | 'EXTRA_INGREDIENT' | 'WRONG_RATIO' | 'WRONG_ORDER'
  | 'PUCK_NOT_KNOCKED' | 'WAND_NOT_CLEANED' | 'TIMEOUT';

export const MISTAKE_CODES: readonly MistakeCode[] = [
  'UNDER_EXTRACTED', 'OVER_EXTRACTED', 'SHOT_LOW', 'SHOT_HIGH',
  'MILK_COLD', 'MILK_SCALDED', 'FOAM_THIN', 'FOAM_THICK', 'COARSE_FOAM',
  'WRONG_CUP', 'MISSING_INGREDIENT', 'EXTRA_INGREDIENT', 'WRONG_RATIO', 'WRONG_ORDER',
  'PUCK_NOT_KNOCKED', 'WAND_NOT_CLEANED', 'TIMEOUT',
];

export interface MistakeInfo {
  customerLine: string;   // 손님 말풍선
  why: string;            // 원리 한 줄
  fixHint: string;        // 게임에서 고치는 법
  practiceCheck: string;  // 실제 실습에서 확인할 것
}

export type StageEvent = 'beanChange' | 'hygiene';

export interface StageConfig {
  id: number; name: string; menuIds: string[]; newMechanic: string;
  patienceSec: number; maxConcurrent: number | [number, number];
  shotTolerance: number; ingredientTolerance: number;
  guide: 'full' | 'targetOnly' | 'hidden';
  idealGrind: number | [number, number];
  events: StageEvent[];
  totalOrders: number; clearCount: number;
  // ── 확장 필드(밸런스용, stages.ts에서만 조정) ──
  learn: string;              // 학습 내용(스테이지 표)
  timeOfDay: string;          // THEME.md 시간대
  spawnIntervalSec: number;   // 다음 손님이 들어오기까지 최소 간격(실제 초)
  minHygiene?: number;        // 클리어에 필요한 위생 게이지 최저값(0~100)
  customerMix: Record<CustomerTypeId, number>; // 손님 유형 비율(가중치)
}

// ── 손님 ──
export type CustomerTypeId = 'regular' | 'hurry' | 'picky';
export interface CustomerType {
  id: CustomerTypeId;
  name: string;
  patienceMult: number;     // 인내심 배율
  returnThreshold: number;  // 이 점수 미만이면 반품
  tipMult: number;          // 팁 배율
  lines: { happy: string[]; okay: string[]; returned: string[]; timeout: string[] };
}

// ── 튜토리얼 ──
export type TutorialCondition =
  | 'none'               // '다음' 버튼으로 진행
  | 'customerArrived' | 'basketSingle' | 'basketDouble' | 'shotRunning' | 'shotReady'
  | 'cupDemitasse' | 'cupMug' | 'cupHasEspresso' | 'cupHasWater'
  | 'slotFilled' | 'servedCount1' | 'servedCount2';
export interface TutorialStep {
  id: string;
  text: string;
  highlight?: string;          // 하이라이트할 요소의 data-tut 값
  until: TutorialCondition;    // 이 조건이 참이 되면 다음 단계로
  station?: 1 | 2 | 3 | 4;     // 휴대폰 세로 화면에서 자동으로 열 작업대
}

// ── 설정·기록 ──
export type GameSpeed = 'normal' | 'slow';
export interface Settings {
  sfx: boolean;
  bgm: boolean;
  tts: boolean;
  speed: GameSpeed;
  practiceDefault: boolean;  // 타이틀 '게임 시작'을 연습 모드로 시작
  muted: boolean;            // 모든 소리 끄기(상단 버튼)
}

export type GroupId = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | 'solo';

export interface PlayLog {
  id: string;
  dateISO: string;
  group: GroupId;
  stageId: number;
  practice: boolean;
  stars: number;
  score: number;
  avgScore: number;
  served: number;
  returned: number;
  timeouts: number;
  cleared: boolean;
  mistakes: Partial<Record<MistakeCode, number>>;
}

export interface Progress {
  stars: Record<number, number>;   // 스테이지 id → 최고 별 수
  unlockAll: boolean;
  tutorialDone: boolean;
}
