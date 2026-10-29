import { STAGES } from '../data/stages';
import { getMenu } from '../data/menus';
import { gameStore, useGame } from '../game/store';

export function StageSelect() {
  const group = useGame((s) => s.group);
  const progress = useGame((s) => s.progress);
  const isUnlocked = useGame((s) => s.isUnlocked);
  const selectStage = useGame((s) => s.selectStage);
  const goto = useGame((s) => s.goto);
  const startTutorial = useGame((s) => s.startTutorial);
  // progress 변경 시 재렌더되도록 구독
  void progress;

  const groupLabel = group === 'solo' ? '개인 연습' : group ? `${group}모둠` : '모둠 미선택';

  return (
    <div className="h-full overflow-y-auto bg-wall">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button type="button" className="btn-soft" onClick={() => goto('title')}>← 타이틀</button>
          <div className="flex items-center gap-2">
            <span className="title text-2xl text-espresso">{groupLabel}</span>
            <button
              type="button"
              className="btn-soft"
              onClick={() => gameStore.setState({ afterGroup: 'stageSelect', screen: 'group' })}
            >
              모둠 바꾸기
            </button>
          </div>
        </div>
        <h1 className="title text-center text-4xl text-espresso">오늘은 어떤 영업?</h1>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {STAGES.map((st) => {
            const open = isUnlocked(st.id);
            const stars = progress.stars[st.id] ?? 0;
            return (
              <button
                key={st.id}
                type="button"
                disabled={!open}
                aria-label={`${st.id}단계 ${st.name}${open ? '' : ' 잠김'}, 별 ${stars}개`}
                className={`panel flex min-h-16 flex-col items-start gap-1 p-4 text-left transition active:scale-95 ${open ? '' : 'opacity-50'}`}
                onClick={() => { selectStage(st.id); goto('prep'); }}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="title text-2xl text-espresso">{st.id}. {st.name}</span>
                  {!open && <span aria-hidden="true" className="text-2xl">🔒</span>}
                </div>
                <span className="text-sm font-bold text-wood">{st.timeOfDay}</span>
                <span className="text-sm">{st.learn}</span>
                <span className="text-sm text-ink/70">{st.menuIds.slice(0, 4).map((id) => getMenu(id).name).join(', ')}{st.menuIds.length > 4 ? ' 외' : ''}</span>
                <span className="text-xl text-warn" aria-label={`별 ${stars}개`}>
                  {[0, 1, 2].map((i) => (i < stars ? '★' : '☆')).join('')}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn-soft flex-1" onClick={() => startTutorial()}>튜토리얼 다시 보기</button>
          <button type="button" className="btn-soft flex-1" onClick={() => goto('practiceSetup')}>연습 모드</button>
        </div>
      </main>
    </div>
  );
}
