import { useGame } from '../game/store';

export function Privacy() {
  const goto = useGame((s) => s.goto);
  return (
    <div className="h-full overflow-y-auto bg-wall">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6">
        <button type="button" className="btn-soft self-start" onClick={() => goto('title')}>← 타이틀</button>
        <h1 className="title text-4xl text-espresso">개인정보 처리방침</h1>
        <div className="panel flex flex-col gap-2 p-4 text-base">
          <p>이름, 연락처 등 개인정보를 수집하지 않아요. 모둠 번호만 사용해요.</p>
          <p>플레이 기록과 설정은 이 기기의 브라우저(localStorage)에만 저장돼요.</p>
          <p>외부 서버로 전송하지 않으며, 분석 도구와 광고도 없어요.</p>
          <p>카메라와 마이크를 사용하지 않아요.</p>
          <p>교사용 기록 화면에서 기록을 언제든 지우거나 내보낼 수 있어요.</p>
        </div>
        <p className="text-sm text-ink/70">제공: [공급자명]</p>
      </main>
    </div>
  );
}
