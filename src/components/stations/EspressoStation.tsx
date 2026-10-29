// 1번 작업대: 그라인더 + 에스프레소 머신
import { motion } from 'framer-motion';
import { GrinderDial } from '../GrinderDial';
import { ShotGlass } from '../ShotGlass';
import { SHOT_NAMES, STANDARDS } from '../../data/standards';
import { focusRecipe, gameStore, sessionUsesGrinder, useGame } from '../../game/store';

function Machine({ running }: { running: boolean }) {
  return (
    <svg viewBox="0 0 200 120" className="h-28 w-full" role="img" aria-label="에스프레소 머신">
      <rect x="30" y="8" width="140" height="70" rx="18" fill="#F7EFE5" stroke="#8A5A3B" strokeWidth="3" />
      <rect x="44" y="60" width="112" height="8" rx="4" fill="#8A5A3B" opacity=".35" />
      <circle cx="100" cy="34" r="14" fill="#FBF5EC" stroke="#2A1E17" strokeWidth="2.5" />
      <motion.line x1="100" y1="34" x2="100" y2="24" stroke="#D2553F" strokeWidth="2.5" strokeLinecap="round"
        animate={{ rotate: running ? 80 : -60 }} transition={{ type: 'spring', stiffness: 60, damping: 10 }}
        style={{ originX: '100px', originY: '34px' }} />
      <rect x="84" y="78" width="32" height="10" rx="3" fill="#8A5A3B" />
      <rect x="88" y="88" width="24" height="8" rx="3" fill="#2A1E17" />
      <rect x="112" y="90" width="52" height="8" rx="4" fill="#8A5A3B" stroke="#2A1E17" strokeWidth="1.5" />
      {running && (
        <motion.line x1="100" y1="96" x2="100" y2="120" stroke="#3B2418" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="6 4"
          animate={{ strokeDashoffset: [0, -20] }} transition={{ repeat: Infinity, duration: 0.5, ease: 'linear' }} />
      )}
    </svg>
  );
}

export function EspressoStation() {
  const session = useGame((s) => s.session);
  if (!session) return null;
  const st = gameStore.getState();
  const e = session.espresso;
  const recipe = focusRecipe(session);
  const std = recipe ? STANDARDS.shots[recipe.shot] : null;
  const guide = session.guide;
  const grinder = sessionUsesGrinder(session.stage);

  return (
    <section className="panel flex h-full flex-col gap-2 p-2" aria-label="에스프레소 작업대">
      <h2 className="title flex items-center gap-2 text-xl"><span aria-hidden>☕</span>그라인더·에스프레소</h2>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
      {grinder ? (
        <GrinderDial value={e.grind} onChange={(v) => st.setGrind(v)} disabled={e.running} />
      ) : (
        <p className="rounded-xl bg-wall px-2 py-1 text-sm">⚙ 분쇄도는 선배가 맞춰 뒀어요</p>
      )}

      <div className="grid grid-cols-2 gap-2">
        {([1, 2] as const).map((b) => (
          <button key={b} type="button" data-tut={`basket-${b}`} disabled={e.running} aria-pressed={e.basket === b}
            className={`btn text-sm ${e.basket === b ? 'bg-wood text-milk' : 'bg-milk text-ink border-2 border-wood/30'}`}
            onClick={() => st.setBasket(b)}>
            {e.basket === b ? '✓ ' : ''}{b === 1 ? '싱글' : '더블'} 바스켓({b})
          </button>
        ))}
      </div>

      <div className="rounded-xl bg-wall p-1 text-center text-sm font-bold">
        {recipe ? (
          guide !== 'hidden' && std ? (
            <>목표: {SHOT_NAMES[recipe.shot]} {std.targetMl}ml · {std.timeSec[0]}~{std.timeSec[1]}초</>
          ) : <>주문: {recipe.name}</>
        ) : <>손님을 기다리는 중…</>}
      </div>

      <div className="mx-auto w-2/3 max-w-52"><Machine running={e.running} /></div>

      {e.ready && (
        <div className="rounded-xl border-2 border-good bg-wall p-2 text-sm">
          <div className="font-bold">✓ 샷 준비됨 {e.ready.ml.toFixed(1)}ml / {e.ready.timeSec.toFixed(1)}초</div>
          <button type="button" className="btn-soft mt-2 w-full text-sm" onClick={() => st.discardShot()}>테스트 샷 버리기(맛 보기)</button>
        </div>
      )}
      {e.taste && (
        <div className="rounded-xl border-2 border-cold bg-wall p-2 text-sm" role="status">
          <div className="font-bold">👅 {e.taste.label}</div>
          <div className="tabular-nums">{e.taste.ml.toFixed(1)}ml · {e.taste.timeSec.toFixed(1)}초</div>
        </div>
      )}

      </div>

      <div className="flex shrink-0 items-end justify-center gap-3">
        <ShotGlass ml={e.ml} running={e.running} timeSec={e.timeSec} targetMl={std?.targetMl ?? null} guide={guide} />
        <div className="flex flex-col font-bold tabular-nums leading-tight" aria-live="off">
          <span className="text-3xl">{e.timeSec.toFixed(1)}초</span>
          <span className="text-3xl">{e.ml.toFixed(1)}ml</span>
        </div>
      </div>

      <button type="button" data-tut="shot-toggle" className={`shrink-0 ${e.running ? 'btn-danger text-xl' : 'btn-primary text-xl'}`}
        onClick={() => st.toggleShot()}>
        {e.running ? '■ 정지' : '▶ 추출 시작'}
      </button>

      {session.hygieneOn && (
        <div className="grid shrink-0 grid-cols-2 gap-2">
          <button type="button" disabled={e.running} className="btn-soft text-sm" onClick={() => st.knockPuck()}>
            🧱 퍽 버리기 {e.pf.puckKnocked ? '✓' : <span className="block rounded-full bg-warn px-1 text-xs">⚠ 추출 전에</span>}
          </button>
          <button type="button" disabled={e.running} className="btn-soft text-sm" aria-label="그룹헤드 물 흘리기" onClick={() => st.flushGroup()}>
            💧 물 흘리기 {e.pf.flushed ? '✓' : <span className="block rounded-full bg-warn px-1 text-xs">⚠ 추출 전에</span>}
          </button>
        </div>
      )}
    </section>
  );
}
