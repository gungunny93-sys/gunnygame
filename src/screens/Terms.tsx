import { useGame } from '../game/store';

export function Terms() {
  const goto = useGame((s) => s.goto);
  return (
    <div className="h-full overflow-y-auto bg-wall">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6">
        <button type="button" className="btn-soft self-start" onClick={() => goto('title')}>← 타이틀</button>
        <h1 className="title text-4xl text-espresso">이용 안내</h1>
        <div className="panel flex flex-col gap-2 p-4 text-base">
          <p>이 게임은 수업용 교육 게임이에요.</p>
          <p>게임 속 커피 수치(추출량, 시간, 온도 등)는 일반적인 기준이며 학교 교재와 다를 수 있어요. 교사가 교재와 확인해 주세요.</p>
          <p>실제 실습에서는 장비 사용법과 위생·안전 수칙을 먼저 지켜 주세요.</p>
        </div>
        <p className="text-sm text-ink/70">제공: [공급자명]</p>
      </main>
    </div>
  );
}
