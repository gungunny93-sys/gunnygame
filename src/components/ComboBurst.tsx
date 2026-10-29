import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { comboMultiplier } from '../game/scoring';
import { useGame } from '../game/store';

interface Burst { key: number; tip: number; streak: number; returned: boolean }

export function ComboBurst() {
  const lastServe = useGame((s) => s.session?.lastServe ?? null);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const seen = useRef<number | null>(lastServe?.at ?? null);

  useEffect(() => {
    if (!lastServe || lastServe.at === seen.current) return;
    seen.current = lastServe.at;
    if (!lastServe.returned && lastServe.tip <= 0) return;
    const b: Burst = { key: lastServe.at, tip: lastServe.tip, streak: lastServe.streak, returned: lastServe.returned };
    setBursts((x) => [...x, b]);
    setTimeout(() => setBursts((x) => x.filter((y) => y.key !== b.key)), 1800);
  }, [lastServe]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[22%] z-50 flex justify-center" aria-hidden>
      <AnimatePresence>
        {bursts.map((b) => b.returned ? (
          <motion.div key={b.key} className="title absolute rounded-xl bg-danger px-4 py-1 text-2xl text-milk shadow-lg"
            initial={{ opacity: 0, x: 0 }} animate={{ opacity: 1, x: [0, -12, 12, -8, 8, 0] }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            반품
          </motion.div>
        ) : (
          <motion.div key={b.key} className="absolute flex flex-col items-center"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: -50 }} exit={{ opacity: 0, y: -80 }} transition={{ duration: 1.2 }}>
            <span className="title text-3xl text-warn drop-shadow">+{b.tip} 🪙</span>
            {b.streak >= 2 && <span className="title text-lg text-good drop-shadow">COMBO ×{comboMultiplier(b.streak)}</span>}
            {b.streak >= 2 && Array.from({ length: b.streak >= 4 ? 5 : b.streak === 3 ? 4 : 3 }).map((_, i, arr) => {
              const dx = (i - (arr.length - 1) / 2) * 60;
              return (
                <motion.span key={i} className="absolute top-4 h-4 w-4 rounded-full border-2 border-wood bg-warn"
                  initial={{ x: 0, y: 0, opacity: 1 }}
                  animate={{ x: dx, y: [0, -60 - (i % 2) * 20, 40], opacity: [1, 1, 0] }}
                  transition={{ duration: 1.1, ease: 'easeOut', delay: i * 0.05 }} />
              );
            })}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
