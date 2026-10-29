import { motion } from 'framer-motion';
import { Footer } from '../components/Footer';
import { gameStore, useGame } from '../game/store';
import type { Screen } from '../game/store';

/** 도담 선배 — 원·반원·둥근 사각형만으로 그린 SVG */
export function Senpai({ size = 120, mood = 'smile' }: { size?: number; mood?: 'smile' | 'wow' | 'worry' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-label="도담 선배">
      <rect x="22" y="78" width="76" height="46" rx="18" fill="#C68B59" />
      <rect x="40" y="82" width="40" height="30" rx="8" fill="#F7EFE5" opacity="0.5" />
      <circle cx="60" cy="48" r="32" fill="#F7EFE5" stroke="#2A1E17" strokeWidth="3" />
      <path d="M28 46 A12 12 0 0 1 52 46 Z" fill="#3B2418" />
      <path d="M48 42 A12 12 0 0 1 72 42 Z" fill="#3B2418" />
      <path d="M68 46 A12 12 0 0 1 92 46 Z" fill="#3B2418" />
      <rect x="88" y="30" width="5" height="26" rx="2.5" fill="#E0A43A" transform="rotate(12 90 43)" />
      <circle cx="48" cy="54" r="3.2" fill="#2A1E17" />
      <circle cx="72" cy="54" r="3.2" fill="#2A1E17" />
      {mood === 'smile' && <path d="M50 66 Q60 75 70 66" fill="none" stroke="#2A1E17" strokeWidth="3" strokeLinecap="round" />}
      {mood === 'wow' && <ellipse cx="60" cy="69" rx="5" ry="6" fill="#2A1E17" />}
      {mood === 'worry' && <path d="M50 71 Q60 63 70 71" fill="none" stroke="#2A1E17" strokeWidth="3" strokeLinecap="round" />}
    </svg>
  );
}

function CafeArt() {
  return (
    <svg viewBox="0 0 360 170" className="w-full max-w-md" aria-hidden="true">
      <rect x="10" y="30" width="340" height="130" rx="10" fill="#F7EFE5" stroke="#8A5A3B" strokeWidth="4" />
      <path d="M0 40 L20 10 H340 L360 40 Z" fill="#8A5A3B" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <path key={i} d={`M${i * 60} 40 L${i * 60 + 20} 10 H${i * 60 + 40} L${i * 60 + 60} 40 Z`} fill={i % 2 ? '#C68B59' : '#F7EFE5'} opacity="0.9" />
      ))}
      <rect x="30" y="62" width="100" height="70" rx="8" fill="#6FA8DC" opacity="0.35" stroke="#8A5A3B" strokeWidth="3" />
      <rect x="150" y="62" width="180" height="26" rx="6" fill="#8A5A3B" />
      <rect x="150" y="88" width="180" height="62" rx="6" fill="#C68B59" />
      <rect x="170" y="42" width="40" height="22" rx="6" fill="#F7EFE5" stroke="#2A1E17" strokeWidth="2.5" />
      <circle cx="190" cy="53" r="5" fill="#3B2418" />
      <rect x="260" y="48" width="14" height="14" rx="3" fill="#3B2418" />
      <rect x="282" y="52" width="14" height="10" rx="3" fill="#E0A43A" />
    </svg>
  );
}

function setFlow(after: Screen) {
  const { group } = gameStore.getState();
  gameStore.setState({ afterGroup: after, screen: group ? after : 'group' });
}

export function Title() {
  const settings = useGame((s) => s.settings);
  const progress = useGame((s) => s.progress);
  const updateSettings = useGame((s) => s.updateSettings);
  const goto = useGame((s) => s.goto);

  const start = () => {
    if (settings.practiceDefault) { setFlow('practiceSetup'); return; }
    setFlow(progress.tutorialDone ? 'stageSelect' : 'tutorial');
  };

  return (
    <div className="relative flex h-full flex-col overflow-y-auto bg-wall">
      <button
        type="button"
        className="btn-soft absolute right-4 top-4 z-10"
        aria-pressed={settings.muted}
        onClick={() => updateSettings({ muted: !settings.muted })}
      >
        {settings.muted ? '🔇 소리 꺼짐' : '🔊 소리 켜짐'}
      </button>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-4 px-4 pb-2 pt-24 text-center">
        <motion.div
          animate={{ rotate: [-1.5, 1.5, -1.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: 'top center' }}
          className="rounded-2xl border-4 border-espresso bg-wood px-8 py-3 text-milk shadow-md"
        >
          <span className="title text-3xl">골목끝 다락</span>
        </motion.div>
        <h1 className="title text-6xl text-espresso">러시아워 바</h1>
        <p className="text-base font-bold text-ink/70">커피 한 잔의 원리를 몸으로 익히는 바리스타 타이밍 게임</p>
        <div className="flex items-end justify-center gap-4">
          <CafeArt />
          <div className="hidden sm:block"><Senpai size={130} /></div>
        </div>
        <div className="flex w-full max-w-sm flex-col gap-3">
          <button type="button" className="btn-primary min-h-20 text-2xl" onClick={start}>게임 시작</button>
          <button type="button" className="btn-soft" onClick={() => setFlow('practiceSetup')}>연습 모드</button>
          <button type="button" className="btn-soft" onClick={() => goto('settings')}>설정</button>
        </div>
        <button type="button" className="min-h-16 px-4 text-sm font-bold text-ink/70 underline underline-offset-4" onClick={() => goto('teacher')}>
          교사용 기록
        </button>
      </main>
      <Footer />
    </div>
  );
}
