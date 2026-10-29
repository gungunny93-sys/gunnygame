// 그라인더: 호퍼 + 몸체 + 큰 다이얼(1~10). 곱게 ← → 굵게
import { motion } from 'framer-motion';
import { STANDARDS } from '../data/standards';

export function GrinderDial(props: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  const { value, onChange, disabled } = props;
  const { min, max } = STANDARDS.grind;
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  const angle = -135 + ((value - min) / (max - min)) * 270;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <button type="button" className="btn-soft !px-0 text-3xl" disabled={disabled || value <= min} aria-label="분쇄도 곱게" onClick={() => onChange(clamp(value - 1))}>−</button>
        <svg viewBox="0 0 120 110" className="h-24 min-w-0 flex-1" role="img" aria-label={`그라인더 분쇄도 ${value}`}>
          <path d="M38 6 L82 6 L70 34 L50 34 Z" fill="#F7EFE5" stroke="#2A1E17" strokeWidth="2.5" strokeLinejoin="round" />
          <rect x="30" y="34" width="60" height="68" rx="10" fill="#8A5A3B" stroke="#2A1E17" strokeWidth="2.5" />
          <circle cx="60" cy="66" r="25" fill="#F7EFE5" stroke="#2A1E17" strokeWidth="2.5" />
          {Array.from({ length: max - min + 1 }, (_, i) => {
            const a = ((-135 + (i / (max - min)) * 270) * Math.PI) / 180;
            return <line key={i} x1={60 + Math.sin(a) * 21} y1={66 - Math.cos(a) * 21} x2={60 + Math.sin(a) * 25} y2={66 - Math.cos(a) * 25} stroke="#2A1E17" strokeWidth="1.5" />;
          })}
          <motion.g animate={{ rotate: angle }} transition={{ type: 'spring', stiffness: 220, damping: 20 }} style={{ originX: '60px', originY: '66px' }}>
            <line x1="60" y1="66" x2="60" y2="46" stroke="#D2553F" strokeWidth="4" strokeLinecap="round" />
          </motion.g>
          <text x="60" y="72" textAnchor="middle" fontSize="16" fontWeight="700" fill="#2A1E17">{value}</text>
        </svg>
        <button type="button" className="btn-soft !px-0 text-3xl" disabled={disabled || value >= max} aria-label="분쇄도 굵게" onClick={() => onChange(clamp(value + 1))}>+</button>
      </div>
      <div className="flex justify-between px-1 text-xs font-bold">
        <span>곱게 ←</span>
        <span className="text-base tabular-nums">분쇄도 {value}</span>
        <span>→ 굵게</span>
      </div>
    </div>
  );
}
