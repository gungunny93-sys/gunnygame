// 컵 단면도: 층이 아래에서 위로 쌓인다. 레시피 가이드선·ml 눈금은 guide 단계에 따라 표시.
import { type ReactNode, useId } from 'react';
import { CUPS, INGREDIENTS, UNIT_NAMES } from '../data/standards';
import type { CupId, DrinkRecipe, Ingredient } from '../data/types';
import type { CupState } from '../game/judge';

export function ingLabel(ing: Ingredient): string {
  return ing === 'espresso' ? '에스프레소' : INGREDIENTS[ing].name;
}

interface Geo { top: number; bot: number; wt: number; wb: number }
const CX = 70;
const GEO: Record<CupId, Geo> = {
  demitasse: { top: 68, bot: 118, wt: 30, wb: 22 },
  cappuccinoCup: { top: 48, bot: 118, wt: 44, wb: 22 },
  latteCup: { top: 22, bot: 118, wt: 40, wb: 28 },
  mug: { top: 28, bot: 118, wt: 34, wb: 32 },
  icedCup: { top: 14, bot: 122, wt: 34, wb: 27 },
  dessertGlass: { top: 46, bot: 96, wt: 40, wb: 6 },
};

function cupPath(g: Geo): string {
  const r = Math.min(10, g.wb);
  return `M${CX - g.wt} ${g.top} L${CX - g.wb} ${g.bot - r} Q${CX - g.wb} ${g.bot} ${CX - g.wb + r} ${g.bot} L${CX + g.wb - r} ${g.bot} Q${CX + g.wb} ${g.bot} ${CX + g.wb} ${g.bot - r} L${CX + g.wt} ${g.top} Z`;
}

function Handle({ id, g }: { id: CupId; g: Geo }) {
  const x = CX + (g.wt + g.wb) / 2 - 2;
  const y = g.top + 10;
  if (id === 'demitasse') return <path d={`M${x} ${y} q16 0 13 13 q-3 9 -13 7`} fill="none" stroke="#2A1E17" strokeWidth="3" />;
  if (id === 'mug') return <path d={`M${x} ${y + 4} q22 0 20 22 q-2 16 -22 14`} fill="none" stroke="#2A1E17" strokeWidth="7" strokeLinecap="round" />;
  if (id === 'cappuccinoCup') return <path d={`M${x - 6} ${y + 6} q18 0 15 14 q-3 10 -16 6`} fill="none" stroke="#2A1E17" strokeWidth="3.5" />;
  if (id === 'latteCup') return <path d={`M${x - 2} ${y + 6} q20 0 17 18 q-3 12 -17 10`} fill="none" stroke="#2A1E17" strokeWidth="3.5" />;
  if (id === 'icedCup') return <line x1={CX + 8} y1={g.top - 12} x2={CX + 2} y2={g.bot - 12} stroke="#C68B59" strokeWidth="3" strokeLinecap="round" />;
  return (
    <g>
      <rect x={CX - 3} y={g.bot} width="6" height="20" fill="#F7EFE5" stroke="#2A1E17" strokeWidth="2.5" />
      <ellipse cx={CX} cy={g.bot + 22} rx="22" ry="5" fill="#F7EFE5" stroke="#2A1E17" strokeWidth="2.5" />
    </g>
  );
}

const SIZE_CLASS = { sm: 'w-14', md: 'w-32', lg: 'w-52' } as const;

function describe(cup: CupState): string {
  if (!cup.cupId) return '컵을 고르지 않았어요';
  const parts = (Object.entries(cup.amounts) as [Ingredient, number][])
    .filter(([, a]) => a > 0)
    .map(([ing, a]) => `${ingLabel(ing)} ${Math.round(a)}${UNIT_NAMES[INGREDIENTS[ing].unit]}`);
  return `${CUPS[cup.cupId].name}: ${parts.length ? parts.join(', ') : '비어 있음'}`;
}

export function CupView(props: { cup: CupState; recipe: DrinkRecipe | null; guide: 'full' | 'targetOnly' | 'hidden'; size?: 'sm' | 'md' | 'lg' }) {
  const { cup, recipe, guide, size = 'md' } = props;
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const cls = SIZE_CLASS[size];

  if (!cup.cupId) {
    return (
      <svg viewBox="0 0 170 140" className={`${cls} h-auto shrink-0`} role="img" aria-label="컵을 고르지 않았어요">
        <rect x="40" y="22" width="60" height="96" rx="12" fill="none" stroke="#8A5A3B" strokeWidth="3" strokeDasharray="6 5" opacity=".6" />
        <text x={CX} y="76" textAnchor="middle" fontSize="11" fontWeight="700" fill="#2A1E17">컵을 골라요</text>
      </svg>
    );
  }

  const g = GEO[cup.cupId];
  const cap = CUPS[cup.cupId].capacityMl;
  const yAt = (ml: number) => g.bot - Math.max(0, Math.min(1.06, ml / cap)) * (g.bot - g.top);
  const path = cupPath(g);
  const showGuide = guide !== 'hidden';

  let cum = 0;
  const bands: ReactNode[] = [];
  cup.layers.forEach((l, i) => {
    const ml = l.amount * INGREDIENTS[l.ingredient].volumeMl;
    const y1 = yAt(cum + ml);
    const y0 = yAt(cum);
    const h = Math.max(1.5, y0 - y1);
    const key = `${l.ingredient}${i}`;
    const ing = l.ingredient;
    if (ing === 'espresso') {
      bands.push(<rect key={key} x="0" y={y1} width="170" height={h + 0.5} fill="#3B2418" />);
      bands.push(<rect key={`${key}c`} x="0" y={y1} width="170" height={Math.min(3, h)} fill="#C68B59" />);
    } else if (ing === 'hotWater') {
      bands.push(<rect key={key} x="0" y={y1} width="170" height={h + 0.5} fill="#8A5A3B" opacity=".45" />);
    } else if (ing === 'coldWater') {
      bands.push(<rect key={key} x="0" y={y1} width="170" height={h + 0.5} fill="#6FA8DC" opacity=".45" />);
    } else if (ing === 'ice') {
      bands.push(<rect key={key} x="0" y={y1} width="170" height={h + 0.5} fill={`url(#ice${uid})`} />);
    } else if (ing === 'steamedMilk') {
      bands.push(<rect key={key} x="0" y={y1} width="170" height={h + 0.5} fill="#F7EFE5" />);
    } else if (ing === 'coldMilk') {
      bands.push(<rect key={key} x="0" y={y1} width="170" height={h + 0.5} fill="#F7EFE5" />);
      bands.push(<rect key={`${key}t`} x="0" y={y1} width="170" height={h + 0.5} fill="#6FA8DC" opacity=".22" />);
    } else if (ing === 'vanillaSyrup') {
      bands.push(<rect key={key} x="0" y={y1} width="170" height={Math.max(3, h)} fill="#C68B59" />);
    } else if (ing === 'chocolateSauce') {
      bands.push(<rect key={key} x="0" y={y1} width="170" height={Math.max(3, h)} fill="#3B2418" opacity=".9" />);
    }
    cum += ml;
  });
  const yTop = yAt(cum);

  // 구름·돔 장식(컵 밖으로 솟을 수 있어 클립하지 않는다)
  let cum2 = 0;
  const toppings: ReactNode[] = [];
  cup.layers.forEach((l, i) => {
    const ml = l.amount * INGREDIENTS[l.ingredient].volumeMl;
    const yc = (yAt(cum2) + yAt(cum2 + ml)) / 2;
    if (l.ingredient === 'whippedCream' || l.ingredient === 'iceCream') {
      const r = Math.max(7, Math.min(16, ml / 4));
      const rowW = Math.max(0, g.wt - r);
      toppings.push(
        <g key={`t${i}`} fill="#F7EFE5" stroke="#2A1E17" strokeWidth="2">
          <circle cx={CX - rowW * 0.55} cy={yc} r={r * 0.8} />
          <circle cx={CX + rowW * 0.55} cy={yc} r={r * 0.8} />
          <circle cx={CX} cy={yc - r * 0.35} r={r} />
        </g>,
      );
    } else if (l.ingredient === 'foamSpoon') {
      const w = Math.min(g.wt - 4, 10 + l.amount * 8);
      toppings.push(
        <path key={`f${i}`} d={`M${CX - w} ${yAt(cum2)} Q${CX} ${yAt(cum2) - 18} ${CX + w} ${yAt(cum2)} Z`} fill={`url(#foam${uid})`} stroke="#2A1E17" strokeWidth="1.5" />,
      );
    }
    cum2 += ml;
  });

  const foamPx = cup.milk && (cup.amounts.steamedMilk ?? 0) > 0 ? Math.min(26, Math.max(1.5, cup.milk.foamCm * 7)) : 0;
  const dot = cup.milk?.coarse ? 2.8 : 1.1;

  // 가이드선
  const guideEls: ReactNode[] = [];
  if (showGuide && recipe && recipe.cup === cup.cupId) {
    let c = 0;
    let lastY = -99;
    recipe.steps.forEach((s, i) => {
      c += s.amount * INGREDIENTS[s.ingredient].volumeMl;
      const y = yAt(c);
      const ly = Math.abs(y - lastY) < 9 ? lastY + 9 : y;
      lastY = ly;
      guideEls.push(
        <g key={i}>
          <line x1={CX - g.wt - 2} y1={y} x2="118" y2={y} stroke="#D2553F" strokeWidth="1.6" strokeDasharray="4 3" />
          <text x="120" y={ly + 3} fontSize="8.5" fontWeight="700" fill="#2A1E17">{ingLabel(s.ingredient)}</text>
        </g>,
      );
    });
  }
  const ticks: ReactNode[] = [];
  if (guide === 'full') {
    for (let ml = 50; ml < cap; ml += 50) {
      const y = yAt(ml);
      ticks.push(
        <g key={ml}>
          <line x1="16" y1={y} x2="23" y2={y} stroke="#2A1E17" strokeWidth="1.2" />
          <text x="14" y={y + 3} fontSize="8" textAnchor="end" fill="#2A1E17">{ml}</text>
        </g>,
      );
    }
  }

  return (
    <svg viewBox="0 0 170 140" className={`${cls} h-auto shrink-0`} role="img" aria-label={describe(cup)}>
      <defs>
        <clipPath id={`clip${uid}`}><path d={path} /></clipPath>
        <pattern id={`foam${uid}`} width="7" height="7" patternUnits="userSpaceOnUse">
          <rect width="7" height="7" fill="#F7EFE5" />
          <circle cx="3.5" cy="3.5" r={dot} fill="#8A5A3B" opacity=".55" />
        </pattern>
        <pattern id={`ice${uid}`} width="14" height="14" patternUnits="userSpaceOnUse">
          <rect width="14" height="14" fill="#6FA8DC" opacity=".25" />
          <rect x="2" y="2" width="10" height="10" rx="2" fill="#6FA8DC" opacity=".6" stroke="#F7EFE5" strokeWidth="1" />
        </pattern>
      </defs>
      <Handle id={cup.cupId} g={g} />
      <path d={path} fill="#FBF5EC" fillOpacity=".5" />
      <g clipPath={`url(#clip${uid})`}>
        {bands}
        {foamPx > 0 && <rect x="0" y={yTop - foamPx} width="170" height={foamPx + 0.5} fill={`url(#foam${uid})`} />}
      </g>
      {toppings}
      <path d={path} fill="none" stroke="#2A1E17" strokeWidth="3" strokeLinejoin="round" />
      {ticks}
      {guideEls}
    </svg>
  );
}
