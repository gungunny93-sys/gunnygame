// 메뉴 17개 — GAME_PLAN.md 6.3.
// 레시피 수치는 일반적인 기준값이다. 수업 교재와 다르면 이 파일만 고치면 된다(teacherCheck).
import type { DrinkRecipe } from './types';

export const MENUS: DrinkRecipe[] = [
  { id: 'espresso', name: '에스프레소', temp: 'hot', cup: 'demitasse', shot: 'single',
    steps: [{ ingredient: 'espresso', amount: 30, unit: 'ml' }],
    orderMatters: false,
    learnPoint: '싱글 샷 30ml를 20~30초에 뽑아 데미타세에 담는 기본 메뉴', teacherCheck: true },

  { id: 'doppio', name: '도피오', temp: 'hot', cup: 'demitasse', shot: 'doppio',
    steps: [{ ingredient: 'espresso', amount: 60, unit: 'ml' }],
    orderMatters: false,
    learnPoint: '더블 바스켓으로 60ml. 양은 두 배지만 추출 시간은 싱글과 같다', teacherCheck: true },

  { id: 'ristretto', name: '리스트레토', temp: 'hot', cup: 'demitasse', shot: 'ristretto',
    steps: [{ ingredient: 'espresso', amount: 18, unit: 'ml' }],
    orderMatters: false,
    learnPoint: '짧게 끊어 뽑는 진한 샷. 적은 양을 짧은 시간(12~20초)에', teacherCheck: true },

  { id: 'lungo', name: '룽고', temp: 'hot', cup: 'demitasse', shot: 'lungo',
    steps: [{ ingredient: 'espresso', amount: 55, unit: 'ml' }],
    orderMatters: false,
    learnPoint: '길게 뽑는 샷. 같은 바스켓으로 양과 시간을 늘린다(35~50초)', teacherCheck: true },

  { id: 'americano-hot', name: '아메리카노', temp: 'hot', cup: 'mug', shot: 'doppio',
    steps: [{ ingredient: 'espresso', amount: 60, unit: 'ml' }, { ingredient: 'hotWater', amount: 240, unit: 'ml' }],
    orderMatters: false,
    learnPoint: '에스프레소에 뜨거운 물을 더해 연하게 마시는 메뉴', teacherCheck: true },

  { id: 'cafe-latte', name: '카페라떼', temp: 'hot', cup: 'latteCup', shot: 'single',
    steps: [{ ingredient: 'espresso', amount: 30, unit: 'ml' }, { ingredient: 'steamedMilk', amount: 200, unit: 'ml' }],
    orderMatters: true, milk: { foamCm: [0.5, 1.0] },
    learnPoint: '샷 위에 스팀 우유를 붓는다. 거품은 0.5~1cm로 얇게', teacherCheck: true },

  { id: 'cappuccino', name: '카푸치노', temp: 'hot', cup: 'cappuccinoCup', shot: 'single',
    steps: [{ ingredient: 'espresso', amount: 30, unit: 'ml' }, { ingredient: 'steamedMilk', amount: 120, unit: 'ml' }],
    orderMatters: true, milk: { foamCm: [1.0, 2.0] },
    learnPoint: '라떼보다 거품층이 두꺼운 메뉴. 공기 주입을 더 길게', teacherCheck: true },

  { id: 'flat-white', name: '플랫화이트', temp: 'hot', cup: 'cappuccinoCup', shot: 'ristrettoDouble',
    steps: [{ ingredient: 'espresso', amount: 36, unit: 'ml' }, { ingredient: 'steamedMilk', amount: 120, unit: 'ml' }],
    orderMatters: true, milk: { foamCm: [0, 0.5] },
    learnPoint: '리스트레토 2샷에 거품이 거의 없는(0~0.5cm) 우유. 공기 주입은 아주 짧게', teacherCheck: true },

  { id: 'macchiato', name: '마키아토', temp: 'hot', cup: 'demitasse', shot: 'single',
    steps: [{ ingredient: 'espresso', amount: 30, unit: 'ml' }, { ingredient: 'foamSpoon', amount: 1, unit: 'portion' }],
    orderMatters: true,
    learnPoint: '에스프레소 위에 우유 거품을 한 스푼 얹어 "점"을 찍는 메뉴', teacherCheck: true },

  { id: 'iced-americano', name: '아이스 아메리카노', temp: 'iced', cup: 'icedCup', shot: 'doppio',
    steps: [{ ingredient: 'ice', amount: 3, unit: 'scoop' }, { ingredient: 'coldWater', amount: 200, unit: 'ml' },
            { ingredient: 'espresso', amount: 60, unit: 'ml' }],
    orderMatters: true,
    learnPoint: '얼음 → 물 → 에스프레소 순서로 담아 크레마를 위에 살린다(수업 기준 레시피)', teacherCheck: true },

  { id: 'iced-latte', name: '아이스 라떼', temp: 'iced', cup: 'icedCup', shot: 'doppio',
    steps: [{ ingredient: 'ice', amount: 3, unit: 'scoop' }, { ingredient: 'coldMilk', amount: 200, unit: 'ml' },
            { ingredient: 'espresso', amount: 60, unit: 'ml' }],
    orderMatters: true,
    learnPoint: '얼음 → 찬 우유 → 에스프레소. 샷이 우유 위로 퍼지는 층을 만든다', teacherCheck: true },

  { id: 'vanilla-latte', name: '바닐라 라떼', temp: 'hot', cup: 'latteCup', shot: 'single',
    steps: [{ ingredient: 'vanillaSyrup', amount: 2, unit: 'pump' }, { ingredient: 'espresso', amount: 30, unit: 'ml' },
            { ingredient: 'steamedMilk', amount: 200, unit: 'ml' }],
    orderMatters: true, milk: { foamCm: [0.5, 1.0] },
    learnPoint: '시럽을 먼저 넣고 샷을 부어 섞은 뒤 스팀 우유를 붓는다', teacherCheck: true },

  { id: 'iced-vanilla-latte', name: '아이스 바닐라 라떼', temp: 'iced', cup: 'icedCup', shot: 'doppio',
    steps: [{ ingredient: 'vanillaSyrup', amount: 2, unit: 'pump' }, { ingredient: 'ice', amount: 3, unit: 'scoop' },
            { ingredient: 'coldMilk', amount: 200, unit: 'ml' }, { ingredient: 'espresso', amount: 60, unit: 'ml' }],
    orderMatters: true,
    learnPoint: '시럽 → 얼음 → 찬 우유 → 에스프레소. 시럽은 차가워지기 전에 먼저', teacherCheck: true },

  { id: 'cafe-mocha', name: '카페모카', temp: 'hot', cup: 'latteCup', shot: 'single',
    steps: [{ ingredient: 'chocolateSauce', amount: 2, unit: 'portion' }, { ingredient: 'espresso', amount: 30, unit: 'ml' },
            { ingredient: 'steamedMilk', amount: 180, unit: 'ml' }, { ingredient: 'whippedCream', amount: 1, unit: 'portion' }],
    orderMatters: true, milk: { foamCm: [0, 1.0] },
    learnPoint: '초코 소스 → 에스프레소 → 스팀 우유 → 휘핑. 소스를 샷으로 먼저 녹인다', teacherCheck: true },

  { id: 'con-panna', name: '콘파냐', temp: 'hot', cup: 'demitasse', shot: 'single',
    steps: [{ ingredient: 'espresso', amount: 30, unit: 'ml' }, { ingredient: 'whippedCream', amount: 1, unit: 'portion' }],
    orderMatters: true,
    learnPoint: '에스프레소 위에 휘핑크림을 얹는 메뉴. 샷이 먼저', teacherCheck: true },

  { id: 'affogato', name: '아포가토', temp: 'iced', cup: 'dessertGlass', shot: 'single',
    steps: [{ ingredient: 'iceCream', amount: 1, unit: 'scoop' }, { ingredient: 'espresso', amount: 30, unit: 'ml' }],
    orderMatters: true,
    learnPoint: '아이스크림을 먼저 담고 뜨거운 샷을 위에 붓는 디저트 메뉴', teacherCheck: true },

  { id: 'cortado', name: '코르타도', temp: 'hot', cup: 'demitasse', shot: 'single',
    steps: [{ ingredient: 'espresso', amount: 30, unit: 'ml' }, { ingredient: 'steamedMilk', amount: 30, unit: 'ml' }],
    orderMatters: true, milk: { foamCm: [0, 0.5] },
    learnPoint: '에스프레소와 비슷한 양의 스팀 우유. 거품은 얇게', teacherCheck: true },
];

export const MENU_BY_ID: Record<string, DrinkRecipe> = Object.fromEntries(MENUS.map((m) => [m.id, m]));

export function getMenu(id: string): DrinkRecipe {
  const m = MENU_BY_ID[id];
  if (!m) throw new Error(`unknown menu ${id}`);
  return m;
}
