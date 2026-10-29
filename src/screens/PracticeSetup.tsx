import { useState } from 'react';
import { STAGES, getStage } from '../data/stages';
import { getMenu } from '../data/menus';
import { useGame } from '../game/store';

export function PracticeSetup() {
  const goto = useGame((s) => s.goto);
  const startPractice = useGame((s) => s.startPractice);
  const [stageId, setStageId] = useState(1);
  const [picked, setPicked] = useState<string[] | null>(null);
  const stage = getStage(stageId);
  const selected = picked ?? stage.menuIds;

  const chooseStage = (id: number) => { setStageId(id); setPicked(null); };
  const toggle = (id: string) => {
    const next = selected.includes(id) ? selected.filter((m) => m !== id) : [...selected, id];
    setPicked(next);
  };

  return (
    <div className="h-full overflow-y-auto bg-wall">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6">
        <button type="button" className="btn-soft self-start" onClick={() => goto('title')}>← 타이틀</button>
        <h1 className="title text-center text-4xl text-espresso">연습 모드</h1>
        <section className="panel flex flex-col gap-2 p-4">
          <h2 className="title text-2xl">1. 스테이지 고르기</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {STAGES.map((st) => (
              <button
                key={st.id}
                type="button"
                aria-pressed={st.id === stageId}
                className={`btn text-left ${st.id === stageId ? 'bg-wood text-milk' : 'bg-wall text-ink border-2 border-wood/30'}`}
                onClick={() => chooseStage(st.id)}
              >
                {st.id}. {st.name}
              </button>
            ))}
          </div>
        </section>
        <section className="panel flex flex-col gap-2 p-4">
          <h2 className="title text-2xl">2. 연습할 메뉴</h2>
          <div className="flex flex-wrap gap-2">
            {stage.menuIds.map((id) => {
              const on = selected.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={on}
                  className={`btn ${on ? 'bg-good text-ink' : 'bg-wall text-ink border-2 border-wood/30'}`}
                  onClick={() => toggle(id)}
                >
                  {on ? '✓ ' : ''}{getMenu(id).name}
                </button>
              );
            })}
          </div>
        </section>
        <p className="rounded-2xl bg-milk/90 p-3 text-center text-base font-bold">인내심 무제한 · 가이드선 항상 표시 · 실패하면 선배 힌트 후 같은 주문 재도전</p>
        <button
          type="button"
          className="btn-primary min-h-20 text-xl"
          disabled={selected.length === 0}
          onClick={() => startPractice(stageId, selected)}
        >
          연습 시작
        </button>
      </main>
    </div>
  );
}
