import { useGame } from '../game/store';
import type { GroupId } from '../data/types';

const GROUPS: GroupId[] = ['1', '2', '3', '4', '5', '6', '7', '8'];

export function GroupSelect() {
  const setGroup = useGame((s) => s.setGroup);
  const goto = useGame((s) => s.goto);
  const group = useGame((s) => s.group);
  return (
    <div className="h-full overflow-y-auto bg-wall">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-6">
        <div className="flex items-center justify-between gap-2">
          <button type="button" className="btn-soft" onClick={() => goto('title')}>← 타이틀</button>
        </div>
        <h1 className="title text-center text-4xl text-espresso">우리 모둠은?</h1>
        <p className="text-center text-base">기록은 모둠 번호로만 남아요. 이름은 묻지 않아요.</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {GROUPS.map((g) => (
            <button
              key={g}
              type="button"
              aria-pressed={group === g}
              className={`btn min-h-24 title text-3xl ${group === g ? 'bg-wood text-milk' : 'bg-milk text-ink border-2 border-wood/30'}`}
              onClick={() => setGroup(g)}
            >
              {g}모둠
            </button>
          ))}
        </div>
        <button type="button" className="btn-primary min-h-20 text-xl" onClick={() => setGroup('solo')}>개인 연습</button>
      </main>
    </div>
  );
}
