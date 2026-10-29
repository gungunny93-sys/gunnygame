// 플레이 화면: 위쪽 20% 손님 줄·주문 티켓 / 아래쪽 80% 작업대 4구역(휴대폰 세로는 탭 전환)
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { HYGIENE_RULES } from '../data/standards';
import { CustomerLane } from '../components/CustomerLane';
import { ComboBurst } from '../components/ComboBurst';
import { EspressoStation } from '../components/stations/EspressoStation';
import { SteamStation } from '../components/stations/SteamStation';
import { AssemblyStation } from '../components/stations/AssemblyStation';
import { ServeStation } from '../components/stations/ServeStation';
import { useIsPortraitPhone } from '../components/useLayout';
import { CLEANING_STEP_NAMES } from '../game/hygiene';
import { type HoldKey, gameStore, useGame } from '../game/store';
import { useGameLoop } from '../game/useGameLoop';
import { TutorialOverlay } from './Tutorial';

const STATIONS = [
  { n: 1, label: '에스프레소', icon: '☕' },
  { n: 2, label: '스팀', icon: '♨' },
  { n: 3, label: '조립대', icon: '🥤' },
  { n: 4, label: '서빙대', icon: '🛎' },
] as const;

function useKeyboard() {
  useEffect(() => {
    const holdKeys: Record<string, HoldKey> = { a: 'aerate', s: 'roll' };
    const isTyping = (e: KeyboardEvent) => (e.target as HTMLElement)?.tagName === 'INPUT';
    const down = (e: KeyboardEvent) => {
      if (isTyping(e)) return;
      const st = gameStore.getState();
      const k = e.key.toLowerCase();
      if (['1', '2', '3', '4'].includes(k)) { st.setActiveStation(Number(k) as 1 | 2 | 3 | 4); focusStation(Number(k)); return; }
      if (k === 'escape') { st.togglePause(); return; }
      if (e.repeat) { if (holdKeys[k] || k === ' ') e.preventDefault(); return; }
      if (k === ' ') { e.preventDefault(); st.toggleShot(); return; }
      if (k === 'enter') { if ((e.target as HTMLElement)?.tagName === 'BUTTON') return; e.preventDefault(); st.serveDefault(); return; }
      if (holdKeys[k]) { e.preventDefault(); st.setHold(holdKeys[k], true); }
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (holdKeys[k]) gameStore.getState().setHold(holdKeys[k], false);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);
}

function focusStation(n: number) {
  const el = document.querySelector<HTMLElement>(`[data-station="${n}"]`);
  el?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  el?.animate?.([{ outline: '4px solid #E0A43A' }, { outline: '4px solid transparent' }], { duration: 600 });
}

export function TopBar() {
  const session = useGame((s) => s.session);
  const muted = useGame((s) => s.settings.muted);
  if (!session) return null;
  const st = gameStore.getState();
  const { stage, mode } = session;
  const done = session.records.length;
  const successes = session.records.filter((r) => !r.returned && !r.timeout && r.score >= 70).length;
  const hyg = Math.round(session.hygiene);
  const hygColor = hyg >= 70 ? 'bg-good' : hyg >= 50 ? 'bg-warn' : 'bg-danger';
  return (
    <header className="flex items-center gap-2 px-2 py-1 bg-wood text-milk shrink-0">
      <div className="min-w-0 flex-1 leading-tight">
        <div className="title text-lg truncate">
          {mode === 'tutorial' ? '튜토리얼 · 첫 출근' : mode === 'practice' ? `연습 모드 · ${stage.name}` : `${stage.id}. ${stage.name}`}
        </div>
        <div className="text-xs opacity-90 truncate">
          {stage.timeOfDay} · {mode === 'stage' ? `주문 ${done}/${stage.totalOrders} · 성공 ${successes}/${stage.clearCount}` : `만든 잔 ${done}`}
          {' · '}팁 🪙{session.tips}{session.streak >= 2 ? ` · 콤보 ${session.streak}` : ''}
        </div>
      </div>
      {session.hygieneOn && (
        <div className="w-28 sm:w-36" aria-label={`위생 게이지 ${hyg}%`}>
          <div className="text-xs">🧽 위생 {hyg}%{stage.minHygiene ? ` (최저 ${Math.round(session.minHygiene)})` : ''}</div>
          <div className="h-3 rounded-full bg-milk/30 overflow-hidden">
            <div className={`h-full ${hygColor} transition-all`} style={{ width: `${hyg}%` }} />
          </div>
        </div>
      )}
      {mode === 'practice' && (
        <button type="button" className="btn-soft !min-h-12 text-sm" onClick={() => st.quitSession()}>연습 끝내기</button>
      )}
      <button type="button" className="btn-soft !min-h-12 !min-w-12 !px-2" aria-label={muted ? '소리 켜기' : '소리 끄기'}
        onClick={() => st.updateSettings({ muted: !muted })}>{muted ? '🔇' : '🔊'}</button>
      <button type="button" className="btn-soft !min-h-12 !min-w-12 !px-2" aria-label="일시정지 (Esc)"
        onClick={() => st.togglePause()}>⏸</button>
    </header>
  );
}

function Toasts() {
  const toasts = useGame((s) => s.session?.toasts ?? []);
  return (
    <div className="pointer-events-none fixed left-1/2 top-24 z-50 flex w-[min(92vw,560px)] -translate-x-1/2 flex-col gap-2" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id} initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`rounded-2xl px-4 py-2 text-center font-bold shadow-lg ${
              t.kind === 'warn' ? 'bg-danger text-milk' : t.kind === 'combo' ? 'bg-warn text-ink' : t.kind === 'event' ? 'bg-cold text-ink' : 'bg-ink text-milk'}`}>
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function PauseOverlay() {
  const paused = useGame((s) => s.session?.paused ?? false);
  const mode = useGame((s) => s.session?.mode);
  if (!paused) return null;
  const st = gameStore.getState();
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 p-4" role="dialog" aria-modal="true" aria-label="일시정지">
      <div className="panel w-full max-w-sm p-6 text-center">
        <div className="title text-3xl mb-4">잠깐 쉬는 중</div>
        <div className="flex flex-col gap-3">
          <button type="button" className="btn-primary text-xl" autoFocus onClick={() => st.setPaused(false)}>계속하기</button>
          <button type="button" className="btn-soft" onClick={() => st.quitSession()}>
            {mode === 'practice' ? '연습 끝내기' : mode === 'tutorial' ? '튜토리얼 그만하기' : '영업 그만두기(스테이지 선택)'}
          </button>
        </div>
        <p className="mt-4 text-sm opacity-70">단축키: 1~4 작업대 · Space 추출 · A 공기 주입 · S 롤링 · Enter 서빙 · Esc 일시정지</p>
      </div>
    </div>
  );
}

function CleaningOverlay() {
  const cleaning = useGame((s) => s.session?.cleaning ?? null);
  if (!cleaning) return null;
  const steps = HYGIENE_RULES.cleaningSteps;
  const done = cleaning.index >= steps.length;
  const remain = Math.max(0, Math.ceil(HYGIENE_RULES.cleaningSeconds - cleaning.elapsed));
  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center bg-ink/70 p-4" role="dialog" aria-modal="true" aria-label="마감 청소">
      <motion.div initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="panel w-full max-w-xl p-5">
        <div className="title text-3xl text-danger">위생 게이지 0 — 마감 청소!</div>
        <p className="mt-1">영업을 잠시 멈추고 순서대로 청소해요. 끝나면 위생 50%로 다시 시작해요.</p>
        <ol className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {steps.map((id, i) => {
            const isDone = i < cleaning.index;
            return (
              <li key={id}>
                <button type="button" disabled={isDone}
                  className={`btn w-full text-left ${isDone ? 'btn-soft line-through' : i === cleaning.index ? 'btn-primary' : 'btn-soft'}`}
                  onClick={() => gameStore.getState().cleanTap(id)}>
                  {isDone ? '✓' : `${i + 1}.`} {CLEANING_STEP_NAMES[id]}
                </button>
              </li>
            );
          })}
        </ol>
        {cleaning.wrongTaps > 0 && <p className="mt-2 text-danger font-bold">순서가 틀렸어요({cleaning.wrongTaps}회). 번호 순서대로!</p>}
        <p className="mt-3 font-bold">{done ? `마무리 중… ${remain}초` : `청소 시간 남은 최소 ${remain}초`}</p>
      </motion.div>
    </div>
  );
}

function PracticeHint() {
  const hint = useGame((s) => s.session?.hint ?? null);
  return (
    <AnimatePresence>
      {hint && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="fixed bottom-24 left-1/2 z-40 w-[min(92vw,520px)] -translate-x-1/2 rounded-2xl bg-crema px-4 py-3 font-bold text-ink shadow-xl" role="status">
          🧑‍🍳 {hint}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Play() {
  useGameLoop(true);
  useKeyboard();
  const hasSession = useGame((s) => !!s.session);
  const mode = useGame((s) => s.session?.mode);
  const active = useGame((s) => s.activeStation);
  const portrait = useIsPortraitPhone();
  if (!hasSession) return null;
  const st = gameStore.getState();
  const stations = [<EspressoStation key={1} />, <SteamStation key={2} />, <AssemblyStation key={3} />, <ServeStation key={4} />];
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TopBar />
      <section className={`${portrait ? 'h-[24%] min-h-[170px]' : 'h-[20%] min-h-[150px]'} shrink-0 border-b-4 border-wood/40 bg-gradient-to-b from-milk to-wall`} data-tut="lane">
        <CustomerLane />
      </section>
      {portrait ? (
        <>
          <main className="min-h-0 flex-1 overflow-y-auto bg-[#E9D9C3] p-2">
            <div data-station={active} className="h-full">{stations[active - 1]}</div>
          </main>
          <nav className="grid shrink-0 grid-cols-4 gap-1 bg-wood p-1" aria-label="작업대 전환">
            {STATIONS.map((x) => (
              <button key={x.n} type="button" onClick={() => st.setActiveStation(x.n)} aria-current={active === x.n}
                className={`min-h-16 rounded-xl text-sm font-bold ${active === x.n ? 'bg-milk text-ink' : 'text-milk'}`}>
                <div className="text-xl">{x.icon}</div>{x.label}
              </button>
            ))}
          </nav>
        </>
      ) : (
        <main className="grid min-h-0 flex-1 grid-cols-[1.05fr_0.95fr_1.35fr_0.8fr] gap-2 bg-[#E9D9C3] p-2">
          {stations.map((el, i) => (
            <div key={i} data-station={i + 1} className="min-h-0 min-w-0 overflow-y-auto rounded-3xl">{el}</div>
          ))}
        </main>
      )}
      <Toasts />
      <ComboBurst />
      <PracticeHint />
      <CleaningOverlay />
      <PauseOverlay />
      {mode === 'tutorial' && <TutorialOverlay />}
    </div>
  );
}
