import type { ReactNode } from 'react';
// 샷 잔: ml/80 만큼 차오르고, 크레마 색은 시간에 따라 변한다.
import { EQUIPMENT } from '../data/standards';

function cremaColor(timeSec: number): string {
  if (timeSec > 30) return '#E3C27D';   // 과다추출 구간: 옅은 금색
  if (timeSec < 8) return '#5A3622';    // 초반: 진한 갈색
  return '#C68B59';
}

export function ShotGlass(props: { ml: number; running: boolean; timeSec: number; targetMl: number | null; guide: 'full' | 'targetOnly' | 'hidden' }) {
  const { ml, running, timeSec, targetMl, guide } = props;
  const max = EQUIPMENT.shotGlassMaxMl;
  const top = 8, bot = 84;
  const yAt = (v: number) => bot - Math.max(0, Math.min(1, v / max)) * (bot - top);
  const path = `M20 ${top} L26 ${bot - 4} Q26 ${bot} 30 ${bot} L50 ${bot} Q54 ${bot} 54 ${bot - 4} L60 ${top} Z`;
  const y = yAt(ml);
  const ticks: ReactNode[] = [];
  if (guide === 'full') {
    for (let v = 10; v < max; v += 10) {
      ticks.push(
        <g key={v}>
          <line x1="12" y1={yAt(v)} x2="18" y2={yAt(v)} stroke="#2A1E17" strokeWidth="1" />
          {v % 20 === 0 && <text x="10" y={yAt(v) + 3} fontSize="7" textAnchor="end" fill="#2A1E17">{v}</text>}
        </g>,
      );
    }
  }
  return (
    <svg viewBox="0 0 110 92" className="h-24 w-auto" role="img" aria-label={`샷 잔 ${ml.toFixed(1)}ml${running ? ', 추출 중' : ''}`}>
      <defs><clipPath id="shotclip"><path d={path} /></clipPath></defs>
      <path d={path} fill="#FBF5EC" fillOpacity=".6" />
      <g clipPath="url(#shotclip)">
        <rect x="0" y={y} width="80" height={bot - y + 1} fill="#3B2418" />
        {ml > 0 && <rect x="0" y={y} width="80" height={Math.min(6, bot - y)} fill={cremaColor(timeSec)} />}
      </g>
      <path d={path} fill="none" stroke="#2A1E17" strokeWidth="2.5" strokeLinejoin="round" />
      {ticks}
      {guide !== 'hidden' && targetMl !== null && (
        <g>
          <line x1="16" y1={yAt(targetMl)} x2="66" y2={yAt(targetMl)} stroke="#D2553F" strokeWidth="2" strokeDasharray="4 3" />
          <text x="68" y={yAt(targetMl) + 3} fontSize="9" fontWeight="700" fill="#2A1E17">목표 {targetMl}ml</text>
        </g>
      )}
    </svg>
  );
}
