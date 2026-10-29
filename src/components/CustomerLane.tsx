import { AnimatePresence, motion } from 'framer-motion';
import { CUSTOMER_TYPES } from '../data/customers';
import type { CustomerTypeId } from '../data/types';
import { type ActiveCustomer, patienceRatio } from '../game/orderQueue';
import { gameStore, useGame } from '../game/store';
import { OrderTicket } from './OrderTicket';
import { PatienceBar } from './PatienceBar';
import { SpeechBubble } from './SpeechBubble';

type Mood = 'smile' | 'neutral' | 'frown';
const BODY: Record<CustomerTypeId, string> = { regular: '#6FA8DC', hurry: '#E0A43A', picky: '#4CAF7A' };

function moodOf(r: number): Mood { return r > 0.6 ? 'smile' : r > 0.3 ? 'neutral' : 'frown'; }

function Face({ mood, cx, cy }: { mood: Mood; cx: number; cy: number }) {
  const mouth = mood === 'smile' ? `M${cx - 5} ${cy + 6} Q${cx} ${cy + 11} ${cx + 5} ${cy + 6}`
    : mood === 'neutral' ? `M${cx - 4} ${cy + 8} L${cx + 4} ${cy + 8}` : `M${cx - 5} ${cy + 10} Q${cx} ${cy + 5} ${cx + 5} ${cy + 10}`;
  return (
    <g stroke="#2B1B12" strokeWidth="2" fill="none" strokeLinecap="round">
      <circle cx={cx - 6} cy={cy - 1} r="1.4" fill="#2B1B12" stroke="none" />
      <circle cx={cx + 6} cy={cy - 1} r="1.4" fill="#2B1B12" stroke="none" />
      <path d={mouth} />
    </g>
  );
}

export function CustomerFigure({ typeId, mood, down }: { typeId: CustomerTypeId; mood: Mood; down?: boolean }) {
  const body = BODY[typeId];
  const skin = '#F3D2B3';
  return (
    <svg viewBox="0 0 60 72" className="h-full w-auto" role="img" aria-label={CUSTOMER_TYPES[typeId].name}>
      <g transform={down ? 'translate(0 5) rotate(8 30 30)' : undefined}>
        {typeId === 'hurry' ? <path d="M30 34 L52 70 L8 70 Z" fill={body} /> : <ellipse cx="30" cy="57" rx="20" ry="14" fill={body} />}
        {typeId === 'regular' && <path d="M16 40 Q30 50 44 40 L44 46 Q30 56 16 46 Z" fill="#D9534F" />}
        {typeId === 'picky' ? <rect x="14" y="8" width="32" height="30" rx="4" fill={skin} /> : <circle cx="30" cy="23" r="16" fill={skin} />}
        {typeId === 'picky' && (
          <g stroke="#2B1B12" strokeWidth="1.5" fill="none">
            <circle cx="24" cy="22" r="5" /><circle cx="36" cy="22" r="5" /><path d="M29 22 L31 22" />
          </g>
        )}
        <Face mood={mood} cx={30} cy={typeId === 'picky' ? 24 : 24} />
        {typeId === 'hurry' && (
          <g>
            <rect x="4" y="52" width="9" height="7" rx="2" fill="#2B1B12" /><circle cx="8.5" cy="55.5" r="2" fill="#F8F3E8" />
          </g>
        )}
        {typeId === 'picky' && <g><rect x="42" y="50" width="11" height="14" rx="1.5" fill="#F8F3E8" stroke="#2B1B12" strokeWidth="1.2" /><path d="M44 54 H51 M44 57 H51 M44 60 H49" stroke="#2B1B12" strokeWidth="1" /></g>}
      </g>
    </svg>
  );
}

function Card({ c, focused, cue }: { c: ActiveCustomer; focused: boolean; cue: boolean }) {
  const ratio = patienceRatio(c);
  const bubble = useGame((s) => s.session?.bubbles.find((b) => b.uid === c.uid) ?? null);
  const jitter = c.typeId === 'hurry' && ratio < 0.35;
  return (
    <motion.div
      layout
      initial={{ x: 200, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -120, opacity: 0, transition: { duration: 0.4 } }}
      transition={{ type: 'spring', stiffness: 220, damping: 26 }}
      className="relative shrink-0"
    >
      <div className="absolute left-full top-1 z-30 ml-2">
        <AnimatePresence>{bubble && <SpeechBubble key={bubble.text} text={bubble.text} kind={bubble.kind} />}</AnimatePresence>
      </div>
      <button
        type="button"
        data-customer-uid={c.uid}
        onClick={() => gameStore.getState().tapCustomer(c.uid)}
        aria-label={`${CUSTOMER_TYPES[c.typeId].name} 주문`}
        className={`flex min-h-16 w-[104px] flex-col items-stretch gap-0.5 rounded-xl border-2 px-1.5 py-1 sm:w-[132px] ${focused ? 'border-warn bg-warn/20' : 'border-wood/40 bg-milk/70'} ${cue ? 'animate-pulse ring-4 ring-good' : ''}`}
      >
        <motion.div className="mx-auto h-11 sm:h-14" animate={jitter ? { x: [-2, 2, -2, 2, 0] } : { x: 0 }} transition={jitter ? { repeat: Infinity, duration: 0.3 } : undefined}>
          <CustomerFigure typeId={c.typeId} mood={moodOf(ratio)} />
        </motion.div>
        <OrderTicket menuId={c.menuId} focused={focused} compact />
        <PatienceBar patience={c.patience} max={c.patienceMax} />
        {cue && <span className="text-center text-[11px] font-bold text-good">여기에 건네기</span>}
      </button>
    </motion.div>
  );
}

export function CustomerLane() {
  const session = useGame((s) => s.session);
  if (!session) return null;
  const { customers, departed, focusUid, selectedSlot, slots, stage, mode, planIndex } = session;
  const focus = focusUid ?? customers[0]?.uid ?? null;
  const serving = selectedSlot !== null && !!slots[selectedSlot];
  const showRemain = mode === 'stage';
  return (
    <div className="flex h-full items-end gap-2 px-3 py-1">
      <div className="flex h-full min-w-0 flex-1 items-end gap-2 overflow-x-auto overflow-y-visible pt-6">
        {customers.length === 0 && departed.length === 0 && (
          <p className="m-auto self-center text-sm font-bold text-ink/70">손님을 기다리는 중…</p>
        )}
        <AnimatePresence mode="popLayout" initial={false}>
          {customers.map((c) => <Card key={c.uid} c={c} focused={c.uid === focus} cue={serving && c.uid === focus} />)}
        </AnimatePresence>
        <AnimatePresence>
          {departed.map((d) => (
            <motion.div key={`d${d.uid}`} initial={{ x: 0, opacity: 1 }} animate={{ x: -80, opacity: 0.2 }} exit={{ opacity: 0 }} transition={{ duration: 1.2 }}
              className="relative flex h-16 w-14 shrink-0 flex-col items-center sm:h-20 sm:w-16">
              <div className="absolute left-full top-0 z-30 ml-2">
                <DepartedBubble uid={d.uid} />
              </div>
              <CustomerFigure typeId={d.typeId} mood={d.outcome === 'served' ? 'smile' : 'frown'} down={d.outcome === 'timeout'} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {showRemain && (
        <div className="shrink-0 self-center rounded-xl bg-wood/20 px-2 py-1 text-center text-xs font-bold text-ink sm:text-sm">
          남은 손님 {Math.max(0, stage.totalOrders - planIndex)}
        </div>
      )}
    </div>
  );
}

function DepartedBubble({ uid }: { uid: number }) {
  const bubble = useGame((s) => s.session?.bubbles.find((b) => b.uid === uid) ?? null);
  return bubble ? <SpeechBubble text={bubble.text} kind={bubble.kind} /> : null;
}
