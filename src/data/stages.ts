// 스테이지 7개 — GAME_PLAN.md 4절 + 5.9절. 밸런스 수치는 이 파일에서만 조정한다.
import type { StageConfig } from './types';

const BASE_MENUS_1_TO_5 = [
  'espresso', 'americano-hot',
  'doppio', 'ristretto', 'lungo',
  'cafe-latte',
  'cappuccino', 'flat-white', 'macchiato',
  'iced-americano', 'iced-latte', 'vanilla-latte', 'cafe-mocha',
];

export const STAGES: StageConfig[] = [
  { id: 1, name: '첫 출근', learn: '추출량, 에스프레소와 아메리카노의 차이',
    menuIds: ['espresso', 'americano-hot'],
    newMechanic: '샷 추출: 샷 잔이 목표선까지 차오르면 "정지"! 아메리카노는 뜨거운 물을 더해요.',
    patienceSec: 90, maxConcurrent: 1, shotTolerance: 0.2, ingredientTolerance: 0.15,
    guide: 'full', idealGrind: 5, events: [], totalOrders: 6, clearCount: 4,
    timeOfDay: '오전 8시', spawnIntervalSec: 3, customerMix: { regular: 1, hurry: 0, picky: 0 } },

  { id: 2, name: '다이얼인', learn: '추출 시간, 과소·과다추출, 분쇄도 보정',
    menuIds: ['doppio', 'ristretto', 'lungo', 'americano-hot'],
    newMechanic: '그라인더 다이얼로 분쇄도를 맞춰요. 곱게 하면 느리게, 굵게 하면 빠르게 흘러요. 테스트 샷으로 맛을 확인!',
    patienceSec: 80, maxConcurrent: 1, shotTolerance: 0.15, ingredientTolerance: 0.15,
    guide: 'full', idealGrind: [4, 6], events: ['beanChange'], totalOrders: 6, clearCount: 4,
    timeOfDay: '오전 9시', spawnIntervalSec: 3, customerMix: { regular: 3, hurry: 1, picky: 0 } },

  { id: 3, name: '우유 데우기', learn: '스티밍 적정 온도',
    menuIds: ['cafe-latte', 'americano-hot'],
    newMechanic: '스팀 버튼을 누르는 동안 우유가 데워져요. 온도계가 초록(60~65℃)일 때 손을 떼요. 너무 뜨거우면 버리고 다시!',
    patienceSec: 80, maxConcurrent: 1, shotTolerance: 0.15, ingredientTolerance: 0.15,
    guide: 'full', idealGrind: [4, 6], events: [], totalOrders: 6, clearCount: 4,
    timeOfDay: '오전 11시', spawnIntervalSec: 3, customerMix: { regular: 3, hurry: 1, picky: 0 } },

  { id: 4, name: '거품의 두께', learn: '공기 주입량과 메뉴별 거품 차이',
    menuIds: ['cafe-latte', 'cappuccino', 'flat-white', 'macchiato'],
    newMechanic: '공기 주입(초반, 37℃ 전까지) 시간이 거품 두께를 정해요. 카푸치노는 길게, 플랫화이트는 아주 짧게!',
    patienceSec: 75, maxConcurrent: 2, shotTolerance: 0.12, ingredientTolerance: 0.15,
    guide: 'targetOnly', idealGrind: [4, 6], events: [], totalOrders: 8, clearCount: 5,
    timeOfDay: '오후 1시', spawnIntervalSec: 18, customerMix: { regular: 3, hurry: 1, picky: 1 } },

  { id: 5, name: '차갑게, 달콤하게', learn: '아이스 메뉴와 부재료, 투입 순서',
    menuIds: ['iced-americano', 'iced-latte', 'vanilla-latte', 'cafe-mocha'],
    newMechanic: '얼음·시럽·소스·휘핑이 등장해요. 순서가 중요한 메뉴는 레시피 카드 순서대로 담아요.',
    patienceSec: 70, maxConcurrent: 2, shotTolerance: 0.12, ingredientTolerance: 0.15,
    guide: 'targetOnly', idealGrind: [4, 6], events: [], totalOrders: 8, clearCount: 5,
    timeOfDay: '오후 3시', spawnIntervalSec: 18, customerMix: { regular: 3, hurry: 1, picky: 1 } },

  { id: 6, name: '깨끗한 바', learn: '위생 관리 절차',
    menuIds: BASE_MENUS_1_TO_5,
    newMechanic: '샷 뒤에는 퍽 버리기 + 그룹헤드 물 흘리기, 스팀 전에는 퍼징, 스팀 뒤에는 닦기 + 퍼징! 위생 게이지를 50% 이상 지켜요.',
    patienceSec: 65, maxConcurrent: 2, shotTolerance: 0.1, ingredientTolerance: 0.15,
    guide: 'targetOnly', idealGrind: [4, 6], events: ['hygiene'], totalOrders: 8, clearCount: 5,
    minHygiene: 50,
    timeOfDay: '오후 5시', spawnIntervalSec: 20, customerMix: { regular: 3, hurry: 1, picky: 1 } },

  { id: 7, name: '러시아워', learn: '종합',
    menuIds: [...BASE_MENUS_1_TO_5, 'iced-vanilla-latte', 'cortado', 'con-panna', 'affogato'],
    newMechanic: '손님이 한꺼번에 몰려와요(동시 3→4명). 80점 이상을 이어 가면 콤보 팁!',
    patienceSec: 55, maxConcurrent: [3, 4], shotTolerance: 0.08, ingredientTolerance: 0.15,
    guide: 'hidden', idealGrind: [3, 7], events: ['beanChange', 'hygiene'], totalOrders: 10, clearCount: 7,
    timeOfDay: '오후 6시', spawnIntervalSec: 24, customerMix: { regular: 3, hurry: 1, picky: 1 } },
];

export const STAGE_BY_ID: Record<number, StageConfig> = Object.fromEntries(STAGES.map((s) => [s.id, s]));

export function getStage(id: number): StageConfig {
  const s = STAGE_BY_ID[id];
  if (!s) throw new Error(`unknown stage ${id}`);
  return s;
}
