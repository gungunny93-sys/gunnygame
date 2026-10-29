import type { MistakeCode } from './types';

/** 실수 코드의 짧은 한국어 이름(교사용 기록 등에서 사용) */
export const MISTAKE_LABELS: Record<MistakeCode, string> = {
  UNDER_EXTRACTED: '과소추출',
  OVER_EXTRACTED: '과다추출',
  SHOT_LOW: '샷 양 부족',
  SHOT_HIGH: '샷 양 초과',
  MILK_COLD: '미지근한 우유',
  MILK_SCALDED: '탄 우유',
  FOAM_THIN: '거품 얇음',
  FOAM_THICK: '거품 두꺼움',
  COARSE_FOAM: '거친 거품',
  WRONG_CUP: '컵 틀림',
  MISSING_INGREDIENT: '재료 빠짐',
  EXTRA_INGREDIENT: '재료 추가',
  WRONG_RATIO: '비율 틀림',
  WRONG_ORDER: '순서 틀림',
  PUCK_NOT_KNOCKED: '퍽 미처리',
  WAND_NOT_CLEANED: '스팀완드 미관리',
  TIMEOUT: '손님 이탈',
};
