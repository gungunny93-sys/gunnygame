// 세로 온도계 0~90℃. 색 + 아이콘 + 숫자를 함께 보여 준다.
import { STANDARDS } from '../data/standards';
import { tempZone } from '../game/steamModel';

const MAX = 90;
const TOP = 10, H = 130;
const yAt = (t: number) => TOP + H * (1 - Math.max(0, Math.min(MAX, t)) / MAX);

const ZONE_COLOR = { cold: '#6FA8DC', low: '#E0A43A', ideal: '#4CAF7A', high: '#E0A43A', scalded: '#D2553F' } as const;
const ZONE_ICON = { cold: '❄', low: '!', ideal: '✓', high: '!', scalded: '🔥' } as const;
const ZONE_TEXT = { cold: '차가움', low: '조금 낮음', ideal: '좋아요', high: '조금 높음', scalded: '너무 뜨거움' } as const;

export function Thermometer(props: { tempC: number; highlightTarget: boolean }) {
  const { tempC, highlightTarget } = props;
  const m = STANDARDS.milk;
  const zone = tempZone(tempC);
  const zones: [number, number, string][] = [
    [0, m.okC[0], ZONE_COLOR.cold], [m.okC[0], m.idealC[0], ZONE_COLOR.low],
    [m.idealC[0], m.idealC[1], ZONE_COLOR.ideal], [m.idealC[1], m.okC[1], ZONE_COLOR.high], [m.okC[1], MAX, ZONE_COLOR.scalded],
  ];
  const cy = yAt(tempC);
  return (
    <svg viewBox="0 0 110 150" className="h-36 w-auto shrink-0" role="img" aria-label={`우유 온도 ${tempC.toFixed(0)}도, ${ZONE_TEXT[zone]}`}>
      {zones.map(([a, b, c], i) => (
        <rect key={i} x="30" y={yAt(b)} width="20" height={yAt(a) - yAt(b)} fill={c} opacity=".35" />
      ))}
      <rect x="30" y={cy} width="20" height={TOP + H - cy} fill={ZONE_COLOR[zone]} />
      <rect x="30" y={TOP} width="20" height={H} rx="4" fill="none" stroke="#2A1E17" strokeWidth="2.5" />
      {[m.okC[0], m.idealC[0], m.idealC[1], m.okC[1]].map((t) => (
        <g key={t}>
          <line x1="26" y1={yAt(t)} x2="30" y2={yAt(t)} stroke="#2A1E17" strokeWidth="1.5" />
          <text x="24" y={yAt(t) + 3} fontSize="8" textAnchor="end" fill="#2A1E17">{t}</text>
        </g>
      ))}
      {highlightTarget && (
        <g>
          <rect x="27" y={yAt(m.idealC[1])} width="26" height={yAt(m.idealC[0]) - yAt(m.idealC[1])} fill="none" stroke="#2A1E17" strokeWidth="2" strokeDasharray="4 2" />
          <text x="56" y={yAt((m.idealC[0] + m.idealC[1]) / 2) + 3} fontSize="9" fontWeight="700" fill="#2A1E17">목표</text>
        </g>
      )}
      <g>
        <path d={`M52 ${cy} l8 -5 l0 10 Z`} fill="#2A1E17" />
        <text x="62" y={Math.max(14, Math.min(146, cy + 4))} fontSize="12" fontWeight="700" fill="#2A1E17">
          {ZONE_ICON[zone]}{tempC.toFixed(0)}℃
        </text>
      </g>
    </svg>
  );
}
