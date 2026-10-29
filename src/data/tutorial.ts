// 튜토리얼 — 도담 선배와 스테이지 1의 첫 두 잔(에스프레소, 아메리카노)을 직접 만들어 본다.
// highlight는 화면 요소의 data-tut 값, until은 game/tutorial.ts가 판정하는 진행 조건.
import type { TutorialStep } from './types';

export const SENPAI_NAME = '도담 선배';

export const TUTORIAL_STEPS: TutorialStep[] = [
  { id: 'hello', text: '안녕, 오늘 첫 출근이지? 나는 도담 선배야. 손님 두 분 커피를 같이 만들어 보자!', until: 'none' },
  { id: 'ticket', text: '손님이 들어오면 위쪽에 주문 티켓이 생겨요. 메뉴 이름과 인내심 막대를 확인해요.', highlight: 'lane', until: 'customerArrived' },
  { id: 'basket1', text: '에스프레소는 싱글 샷(30ml)이에요. 머신에서 "싱글" 바스켓을 골라요.', highlight: 'basket-1', until: 'basketSingle', station: 1 },
  { id: 'start1', text: '"추출 시작"을 눌러요. 머신 타이머는 실제보다 3배 빨리 흘러요.', highlight: 'shot-toggle', until: 'shotRunning', station: 1 },
  { id: 'stop1', text: '샷 잔이 목표선(30ml)에 닿으면 "정지"! 양이 모자라면 진하고, 넘치면 밍밍해져요.', highlight: 'shot-toggle', until: 'shotReady', station: 1 },
  { id: 'cup1', text: '조립대에서 에스프레소 잔인 "데미타세"를 골라요.', highlight: 'cup-demitasse', until: 'cupDemitasse', station: 3 },
  { id: 'pour1', text: '"샷 붓기"를 눌러 방금 뽑은 샷을 컵에 담아요.', highlight: 'ing-espresso', until: 'cupHasEspresso', station: 3 },
  { id: 'send1', text: '완성! "서빙대로"를 눌러 컵을 서빙대에 올려요.', highlight: 'send-serve', until: 'slotFilled', station: 3 },
  { id: 'serve1', text: '서빙대의 컵을 누른 다음 손님을 눌러 건네요. (Enter 키도 돼요)', highlight: 'slot-0', until: 'servedCount1', station: 4 },
  { id: 'next', text: '잘했어! 다음 손님은 아메리카노예요. 도피오(60ml) 샷에 뜨거운 물 240ml를 더해요.', until: 'none' },
  { id: 'basket2', text: '이번엔 더블 바스켓! 양은 두 배지만 걸리는 시간은 싱글과 같아요.', highlight: 'basket-2', until: 'basketDouble', station: 1 },
  { id: 'shot2', text: '추출 시작 → 60ml 목표선에서 정지!', highlight: 'shot-toggle', until: 'shotReady', station: 1 },
  { id: 'cup2', text: '아메리카노는 넉넉한 "머그"에 담아요.', highlight: 'cup-mug', until: 'cupMug', station: 3 },
  { id: 'pour2', text: '샷을 붓고…', highlight: 'ing-espresso', until: 'cupHasEspresso', station: 3 },
  { id: 'water', text: '"뜨거운 물"을 누르고 있다가 목표선에서 손을 떼요.', highlight: 'ing-hotWater', until: 'cupHasWater', station: 3 },
  { id: 'serve2', text: '서빙대로 보내고 손님에게 건네면 끝!', highlight: 'send-serve', until: 'servedCount2', station: 3 },
];

export const TUTORIAL_DONE_TEXT = '첫 출근 성공! 에스프레소는 샷만, 아메리카노는 샷 + 물. 이제 스테이지 1부터 영업해 보자!';
