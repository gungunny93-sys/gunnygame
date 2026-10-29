// 튜토리얼 진행 조건 판정(순수 함수)
import type { TutorialCondition } from '../data/types';
import type { Session } from './store';

export function tutorialConditionMet(cond: TutorialCondition, s: Session): boolean {
  switch (cond) {
    case 'none': return false;
    case 'customerArrived': return s.customers.length > 0;
    case 'basketSingle': return s.espresso.basket === 1 && !s.espresso.running;
    case 'basketDouble': return s.espresso.basket === 2;
    case 'shotRunning': return s.espresso.running;
    case 'shotReady': return s.espresso.ready !== null || (s.cup.amounts.espresso ?? 0) > 0;
    case 'cupDemitasse': return s.cup.cupId === 'demitasse';
    case 'cupMug': return s.cup.cupId === 'mug';
    case 'cupHasEspresso': return (s.cup.amounts.espresso ?? 0) > 0;
    case 'cupHasWater': return (s.cup.amounts.hotWater ?? 0) >= 200;
    case 'slotFilled': return s.slots.some((x) => x !== null);
    case 'servedCount1': return s.acceptedCount >= 1;
    case 'servedCount2': return s.acceptedCount >= 2;
  }
}
