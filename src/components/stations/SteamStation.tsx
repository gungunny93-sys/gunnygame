// 2번 작업대: 스팀 피처·온도계
import { motion } from 'framer-motion';
import { HoldButton } from '../HoldButton';
import { Thermometer } from '../Thermometer';
import { EQUIPMENT, STANDARDS } from '../../data/standards';
import { focusRecipe, gameStore, sessionUsesMilk, useGame } from '../../game/store';
import type { PitcherState } from '../../game/steamModel';

function Pitcher({ p, steaming }: { p: PitcherState; steaming: boolean }) {
  const top = 30, bot = 112;
  const level = bot - Math.max(0, Math.min(1, p.milkMl / EQUIPMENT.pitcherMl)) * (bot - top) * 0.85;
  const foamPx = Math.min(30, p.foamCm * 8);
  const dot = p.coarse ? 3.4 : 1.2;
  const body = 'M26 30 L34 112 Q35 118 42 118 L78 118 Q85 118 86 112 L94 30 Z';
  return (
    <svg viewBox="0 0 130 130" className="h-36 w-auto shrink-0" role="img"
      aria-label={`스팀 피처 우유 ${Math.round(p.milkMl)}ml, 거품 ${p.foamCm.toFixed(1)}cm`}>
      <defs>
        <clipPath id="pitcherclip"><path d={body} /></clipPath>
        <pattern id="pitcherfoam" width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="#F7EFE5" />
          <circle cx="4" cy="4" r={dot} fill="#8A5A3B" opacity=".55" />
        </pattern>
      </defs>
      <path d="M26 30 L14 24 L28 38 Z" fill="#F7EFE5" stroke="#2A1E17" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M92 44 q26 0 24 22 q-2 18 -24 14" fill="none" stroke="#2A1E17" strokeWidth="5" strokeLinecap="round" />
      <path d={body} fill="#FBF5EC" />
      <g clipPath="url(#pitcherclip)">
        <rect x="0" y={level} width="130" height={bot + 10 - level} fill="#F7EFE5" />
        <rect x="0" y={level} width="130" height={bot + 10 - level} fill="#C68B59" opacity={Math.min(0.35, Math.max(0, (p.tempC - 5) / 160))} />
        {foamPx > 0.5 && <rect x="0" y={level - foamPx} width="130" height={foamPx + 1} fill="url(#pitcherfoam)" />}
      </g>
      <path d={body} fill="none" stroke="#2A1E17" strokeWidth="3" strokeLinejoin="round" />
      {steaming && [0, 1, 2].map((i) => (
        <motion.circle key={i} cx={42 + i * 14} cy="26" r="6" fill="#F7EFE5" stroke="#8A5A3B" strokeWidth="1.5"
          animate={{ y: [0, -22], opacity: [0.9, 0] }} transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.35 }} />
      ))}
    </svg>
  );
}

export function SteamStation() {
  const session = useGame((s) => s.session);
  if (!session) return null;
  const st = gameStore.getState();
  const p = session.pitcher;
  const recipe = focusRecipe(session);
  const guide = session.guide;
  const steaming = session.holds.aerate || session.holds.roll;
  const m = STANDARDS.milk;
  const aerateOk = p.tempC <= m.aerateMaxTempC;

  return (
    <section className="panel flex h-full flex-col gap-2 p-2" aria-label="스팀 작업대">
      <h2 className="title flex items-center gap-2 text-xl"><span aria-hidden>♨</span>스팀 피처</h2>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
      {!sessionUsesMilk(session.menuIds) && (
        <p className="rounded-xl bg-wall px-2 py-1 text-sm opacity-60">이번 스테이지에는 우유 메뉴가 없어요</p>
      )}

      {recipe?.milk && guide !== 'hidden' && (
        <div className="rounded-xl bg-wall p-1 text-center text-sm font-bold">
          목표 거품 {recipe.milk.foamCm[0]}~{recipe.milk.foamCm[1]}cm · {m.idealC[0]}~{m.idealC[1]}℃
        </div>
      )}

      <div className="flex items-end justify-center gap-2">
        <Pitcher p={p} steaming={steaming} />
        <Thermometer tempC={p.tempC} highlightTarget={guide === 'full'} />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-wall p-1"><div className="text-xs">🌡 온도</div><div className="text-lg font-bold tabular-nums">{p.tempC.toFixed(0)}℃</div></div>
        <div className="rounded-xl bg-wall p-1"><div className="text-xs">☁ 거품</div><div className="text-lg font-bold tabular-nums">{p.foamCm.toFixed(1)}cm</div></div>
        <div className="rounded-xl bg-wall p-1"><div className="text-xs">🥛 남은 우유</div><div className="text-lg font-bold tabular-nums">{Math.round(p.milkMl)}ml</div></div>
      </div>

      <div className="flex flex-wrap gap-2 empty:hidden" role="status">
        {p.coarse && <span className="rounded-full bg-warn px-3 py-1 text-sm font-bold">⚠ 거친 거품!</span>}
        {p.scalded && <span className="rounded-full bg-danger px-3 py-1 text-sm font-bold text-milk">🔥 탄 우유 — 쓸 수 없어요</span>}
      </div>
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <HoldButton hold="aerate" tut="aerate" className="btn-primary text-base">공기 주입 (A)</HoldButton>
          <div className={`rounded-lg px-1 text-center text-xs font-bold ${aerateOk ? 'bg-good/30' : 'bg-danger/30'}`}>
            {aerateOk ? '✓' : '✕'} {m.aerateMaxTempC}℃ 전까지만!
          </div>
        </div>
        <HoldButton hold="roll" tut="roll" className="btn-primary text-base">롤링 (S)</HoldButton>
      </div>

      <button type="button" className="btn-soft shrink-0 text-sm" onClick={() => st.emptyPitcher()}>피처 비우기·새 우유</button>

      {session.hygieneOn && (
        <div className="grid shrink-0 grid-cols-2 gap-2">
          <button type="button" className="btn-soft text-sm" aria-label="스팀완드 퍼징" onClick={() => st.purgeWand()}>🌬 퍼징 {session.wand.purged ? '✓' : <span className="block rounded-full bg-warn px-1 text-xs">⚠ 스팀 전에</span>}</button>
          <button type="button" className="btn-soft text-sm" aria-label="스팀완드 닦기" onClick={() => st.wipeWand()}>🧻 완드 닦기 {session.wand.wiped ? '✓' : <span className="block rounded-full bg-warn px-1 text-xs">⚠ 스팀 뒤에</span>}</button>
        </div>
      )}
    </section>
  );
}
