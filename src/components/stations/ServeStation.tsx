// 4번 작업대: 서빙대 3칸 + 손님에게 건네기(탭·드래그)
import { motion } from 'framer-motion';
import { CupView, ingLabel } from '../CupView';
import { getMenu } from '../../data/menus';
import { CUPS, INGREDIENTS, UNIT_NAMES } from '../../data/standards';
import type { Ingredient } from '../../data/types';
import type { CupState } from '../../game/judge';
import { gameStore, useGame } from '../../game/store';

function contents(cup: CupState): string {
  const parts = (Object.entries(cup.amounts) as [Ingredient, number][])
    .filter(([, a]) => a > 0)
    .map(([ing, a]) => `${ingLabel(ing)} ${Math.round(a)}${UNIT_NAMES[INGREDIENTS[ing].unit]}`);
  return parts.length ? parts.join(' + ') : '비어 있음';
}

export function ServeStation() {
  const session = useGame((s) => s.session);
  if (!session) return null;
  const st = gameStore.getState();
  const { slots, selectedSlot, customers } = session;
  const firstFilled = slots.findIndex((x) => x !== null);
  const target = selectedSlot !== null && slots[selectedSlot] ? selectedSlot : firstFilled;
  const anyFilled = firstFilled >= 0;

  const onDrop = (i: number, x: number, y: number) => {
    const els = document.elementsFromPoint(x - window.scrollX, y - window.scrollY);
    for (const el of els) {
      const holder = (el as HTMLElement).closest?.('[data-customer-uid]') as HTMLElement | null;
      if (holder) { st.serveTo(Number(holder.dataset.customerUid), i); return; }
    }
  };

  return (
    <section className="panel flex h-full flex-col gap-2 p-2" aria-label="서빙대">
      <h2 className="title flex items-center gap-2 text-xl"><span aria-hidden>🛎</span>서빙대</h2>

      <div className="flex flex-col gap-2">
        {slots.map((cup, i) => {
          const sel = selectedSlot === i;
          if (!cup) {
            return (
              <div key={i} data-tut={`slot-${i}`} className="flex min-h-20 items-center justify-center rounded-2xl border-2 border-dashed border-wood/40 text-sm opacity-60">
                빈 자리 {i + 1}
              </div>
            );
          }
          return (
            <div key={i} className="flex items-stretch gap-2">
              <motion.button type="button" data-tut={`slot-${i}`} aria-pressed={sel}
                drag dragSnapToOrigin dragElastic={0.6} whileDrag={{ scale: 1.08, zIndex: 50 }}
                onDragEnd={(_, info) => onDrop(i, info.point.x, info.point.y)}
                onTap={() => st.selectSlot(sel ? null : i)}
                className={`flex min-h-20 min-w-0 flex-1 cursor-grab items-center gap-2 rounded-2xl border-2 p-1 text-left touch-none ${sel ? 'border-warn bg-warn/30 ring-2 ring-warn' : 'border-wood/30 bg-milk'}`}>
                <CupView cup={cup} recipe={null} guide="hidden" size="sm" />
                <span className="min-w-0 text-xs leading-tight">
                  <span className="block font-bold">{cup.cupId ? CUPS[cup.cupId].name : ''}</span>
                  <span className="block break-words">{contents(cup)}</span>
                  {sel && <span className="mt-1 block font-bold text-danger">손님 티켓을 눌러 건네요 (Enter)</span>}
                </span>
              </motion.button>
              <button type="button" className="btn-soft !px-2 text-xs" onClick={() => st.discardSlot(i)}>버리기</button>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-sm font-bold">손님에게 건네기</div>
        {customers.length === 0 && <p className="text-sm opacity-60">기다리는 손님이 없어요</p>}
        {customers.map((c) => (
          <button key={c.uid} type="button" className="btn-primary text-sm" disabled={!anyFilled}
            onClick={() => st.serveTo(c.uid, target >= 0 ? target : undefined)}>
            {getMenu(c.menuId).name} 손님에게
          </button>
        ))}
        {!anyFilled && <p className="text-xs opacity-70">조립대에서 컵을 서빙대로 보내요</p>}
      </div>
    </section>
  );
}
