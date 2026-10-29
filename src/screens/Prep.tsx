import { getMenu } from '../data/menus';
import { getStage } from '../data/stages';
import { INGREDIENTS, UNIT_NAMES } from '../data/standards';
import { SENPAI_NAME } from '../data/tutorial';
import { useGame } from '../game/store';
import { Senpai } from './Title';

const S = { stroke: '#2A1E17', strokeWidth: 3 } as const;

function MechanicArt({ id }: { id: number }) {
  const common = { viewBox: '0 0 160 120', className: 'h-28 w-40 shrink-0', 'aria-hidden': true } as const;
  switch (id) {
    case 1:
      return (
        <svg {...common}>
          <path d="M50 20 H110 L102 104 H58 Z" fill="#F7EFE5" {...S} />
          <rect x="55" y="62" width="50" height="40" fill="#3B2418" />
          <line x1="40" y1="46" x2="120" y2="46" stroke="#D2553F" strokeWidth="4" strokeDasharray="8 5" />
          <text x="122" y="50" fontSize="12" fill="#D2553F">목표</text>
        </svg>
      );
    case 2:
      return (
        <svg {...common}>
          <circle cx="80" cy="60" r="44" fill="#F7EFE5" {...S} />
          {Array.from({ length: 10 }, (_, i) => {
            const a = (-120 + i * 26.7) * (Math.PI / 180);
            return <line key={i} x1={80 + Math.cos(a) * 34} y1={60 + Math.sin(a) * 34} x2={80 + Math.cos(a) * 42} y2={60 + Math.sin(a) * 42} stroke="#2A1E17" strokeWidth="2" />;
          })}
          <line x1="80" y1="60" x2="100" y2="38" stroke="#D2553F" strokeWidth="5" strokeLinecap="round" />
          <circle cx="80" cy="60" r="6" fill="#8A5A3B" />
        </svg>
      );
    case 3:
      return (
        <svg {...common}>
          <rect x="68" y="10" width="24" height="84" rx="12" fill="#F7EFE5" {...S} />
          <rect x="68" y="10" width="24" height="24" rx="12" fill="#D2553F" opacity="0.6" />
          <rect x="68" y="34" width="24" height="22" fill="#E0A43A" opacity="0.6" />
          <rect x="68" y="56" width="24" height="22" fill="#4CAF7A" opacity="0.7" />
          <rect x="68" y="78" width="24" height="16" fill="#6FA8DC" opacity="0.6" />
          <circle cx="80" cy="102" r="12" fill="#D2553F" {...S} />
        </svg>
      );
    case 4:
      return (
        <svg {...common}>
          <path d="M44 20 H116 L108 108 H52 Z" fill="#F7EFE5" {...S} />
          <rect x="49" y="24" width="62" height="26" fill="#F7EFE5" />
          {[60, 78, 96, 70, 88].map((x, i) => <circle key={i} cx={x} cy={30 + (i % 2) * 8} r="3" fill="#C68B59" />)}
          <rect x="52" y="52" width="56" height="52" fill="#C68B59" opacity="0.45" />
        </svg>
      );
    case 5:
      return (
        <svg {...common}>
          <rect x="52" y="14" width="56" height="94" rx="8" fill="#F7EFE5" fillOpacity="0.5" {...S} />
          <rect x="55" y="80" width="50" height="26" fill="#3B2418" />
          <rect x="55" y="50" width="50" height="30" fill="#F7EFE5" />
          {[0, 1, 2].map((i) => <rect key={i} x={58 + i * 15} y={22 + i * 3} width="12" height="14" rx="2" fill="#6FA8DC" opacity="0.7" />)}
          <line x1="96" y1="2" x2="90" y2="60" stroke="#D2553F" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case 6:
      return (
        <svg {...common}>
          <rect x="14" y="60" width="40" height="44" rx="6" fill="#8A5A3B" {...S} />
          <path d="M82 80 L130 40" stroke="#2A1E17" strokeWidth="6" strokeLinecap="round" />
          <rect x="96" y="70" width="40" height="22" rx="8" fill="#C68B59" {...S} />
          {[70, 86, 102].map((x, i) => <circle key={i} cx={x} cy={30 - i * 4} r="6" fill="#6FA8DC" opacity="0.6" />)}
        </svg>
      );
    default:
      return (
        <svg {...common}>
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <circle cx={28 + i * 36} cy="46" r="14" fill={['#6FA8DC', '#E0A43A', '#4CAF7A', '#6FA8DC'][i]} {...S} />
              <rect x={14 + i * 36} y="62" width="28" height="40" rx="12" fill={['#6FA8DC', '#E0A43A', '#4CAF7A', '#6FA8DC'][i]} {...S} />
            </g>
          ))}
        </svg>
      );
  }
}

export function Prep() {
  const stageId = useGame((s) => s.selectedStageId);
  const goto = useGame((s) => s.goto);
  const startStage = useGame((s) => s.startStage);
  const stage = getStage(stageId);
  const patience = stage.patienceSec;

  return (
    <div className="h-full overflow-y-auto bg-wall">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6">
        <button type="button" className="btn-soft self-start" onClick={() => goto('stageSelect')}>← 스테이지 선택</button>
        <header className="text-center">
          <div className="text-base font-bold text-wood">{stage.timeOfDay}</div>
          <h1 className="title text-4xl text-espresso">{stage.id}. {stage.name} — 영업 준비</h1>
        </header>

        <section className="panel flex flex-col items-center gap-3 p-4 sm:flex-row">
          <MechanicArt id={stage.id} />
          <Senpai size={90} />
          <div>
            <h2 className="title text-2xl text-espresso">새로 배울 것</h2>
            <p className="mt-1 text-base"><b>{SENPAI_NAME}</b>: {stage.newMechanic}</p>
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="title text-2xl text-espresso">오늘의 메뉴</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stage.menuIds.map((id) => {
              const m = getMenu(id);
              return (
                <div key={id} className="panel flex flex-col gap-1 p-3">
                  <div className="flex items-center justify-between">
                    <span className="title text-xl">{m.name}</span>
                    <span className={`rounded-full px-3 py-1 text-sm font-bold ${m.temp === 'hot' ? 'bg-danger text-milk' : 'bg-cold text-ink'}`}>
                      {m.temp === 'hot' ? '핫' : '아이스'}
                    </span>
                  </div>
                  <p className="text-sm">{m.learnPoint}</p>
                  <p className="text-sm text-ink/70">
                    {m.steps.map((st) => `${INGREDIENTS[st.ingredient].name} ${st.amount}${UNIT_NAMES[st.unit]}`).join(' → ')}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel p-4 text-base">
          <h2 className="title text-2xl text-espresso">클리어 조건</h2>
          <p className="mt-1 font-bold">{stage.totalOrders}잔 중 {stage.clearCount}잔 성공</p>
          {stage.minHygiene !== undefined && <p className="font-bold">위생 게이지 {stage.minHygiene}% 이상 유지</p>}
          <p>손님 인내심: 약 {patience}초</p>
        </section>

        <button type="button" className="btn-primary min-h-20 text-2xl" onClick={() => startStage(stage.id)}>영업 시작!</button>
      </main>
    </div>
  );
}
