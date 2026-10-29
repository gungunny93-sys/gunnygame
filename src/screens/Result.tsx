import { motion } from 'framer-motion';
import { useState } from 'react';
import { GENERAL_PRACTICE_CHECKS, PRACTICE_CHECKS } from '../data/practiceChecks';
import { FEEDBACK } from '../data/feedback';
import { getMenu } from '../data/menus';
import { getStage, STAGES } from '../data/stages';
import { useGame } from '../game/store';
import { Senpai } from './Title';

function Check({ text }: { text: string }) {
  const [on, setOn] = useState(false);
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      className="flex min-h-16 w-full items-center gap-3 rounded-2xl bg-wall p-3 text-left"
      onClick={() => setOn(!on)}
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-wood ${on ? 'bg-good' : 'bg-milk'}`}>{on ? '✓' : ''}</span>
      <span className="text-base">{text}</span>
    </button>
  );
}

export function Result() {
  const r = useGame((s) => s.lastResult);
  const goto = useGame((s) => s.goto);
  const startStage = useGame((s) => s.startStage);
  const selectStage = useGame((s) => s.selectStage);

  if (!r) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-wall p-4 text-center">
        <p className="title text-2xl">아직 결과가 없어요</p>
        <button type="button" className="btn-primary" onClick={() => goto('title')}>타이틀로</button>
      </div>
    );
  }

  const practice = r.mode !== 'stage';
  const sm = r.summary;
  const stage = getStage(r.stageId);
  const checks: string[] = [];
  for (const code of r.topMistakes) {
    for (const c of PRACTICE_CHECKS[code]) {
      if (checks.length < 3 && !checks.includes(c)) checks.push(c);
    }
  }
  const checklist = checks.length ? checks : GENERAL_PRACTICE_CHECKS.slice(0, 3);
  const canNext = !practice && sm.cleared && r.stageId < STAGES.length;

  return (
    <div className="h-full overflow-y-auto bg-wall">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6">
        <motion.div
          initial={{ rotateX: 90, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          transition={{ duration: 0.7, type: 'spring' }}
          style={{ transformPerspective: 600 }}
          className="mx-auto rounded-2xl border-4 border-espresso bg-wood px-8 py-3 text-center text-milk shadow-md"
        >
          <h1 className="title text-4xl">{practice ? '연습 결과' : '오늘 영업 끝!'}</h1>
          <div className="text-sm">{stage.id}. {stage.name}</div>
        </motion.div>

        {!practice && (
          <div className="flex flex-col items-center gap-1">
            <div className="flex gap-2 text-5xl text-warn" role="img" aria-label={`별 ${sm.stars}개`}>
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.8 + i * 0.4, type: 'spring' }}
                >
                  {i < sm.stars ? '★' : '☆'}
                </motion.span>
              ))}
            </div>
            <p className={`title text-2xl ${sm.cleared ? 'text-good' : 'text-danger'}`}>
              {sm.cleared ? '클리어! 잘했어요!' : '아쉬워요, 다시 도전해 봐요'}
            </p>
            <p className="text-base">{r.totalOrders}잔 중 {sm.successes}잔 성공 (목표 {r.clearCount}잔)</p>
            {r.hygieneRequired !== null && r.minHygiene !== null && r.minHygiene < r.hygieneRequired && (
              <p className="text-base font-bold text-danger">위생 게이지가 {r.hygieneRequired}% 아래로 내려갔어요</p>
            )}
          </div>
        )}

        <section className="panel grid grid-cols-2 gap-3 p-4 text-center sm:grid-cols-4">
          <div><div className="text-sm">총점</div><div className="title text-3xl">{sm.totalScore}</div></div>
          <div><div className="text-sm">평균 점수</div><div className="title text-3xl">{sm.avgScore.toFixed(1)}</div></div>
          <div><div className="text-sm">서빙 / 반품 / 이탈</div><div className="title text-3xl">{sm.served} / {sm.returned} / {sm.timeouts}</div></div>
          <div>
            <div className="text-sm">팁{r.minHygiene !== null ? ' · 최저 위생' : ''}</div>
            <div className="title text-3xl">{sm.tips}{r.minHygiene !== null ? ` · ${Math.round(r.minHygiene)}%` : ''}</div>
          </div>
        </section>

        <section className="panel flex flex-col gap-3 p-4">
          <h2 className="title text-2xl text-espresso">실수 노트</h2>
          {r.topMistakes.length === 0 ? (
            <div className="flex items-center gap-3">
              <Senpai size={80} mood="wow" />
              <p className="text-base font-bold">실수가 하나도 없어요! 완벽한 바리스타예요.</p>
            </div>
          ) : (
            r.topMistakes.map((code) => {
              const f = FEEDBACK[code];
              return (
                <div key={code} className="rounded-2xl bg-wall p-3">
                  <p className="text-base font-bold">“{f.customerLine}” <span className="text-sm font-normal text-ink/70">({sm.mistakeCounts[code] ?? 0}번)</span></p>
                  <p className="mt-1 text-base"><b>원리</b> {f.why}</p>
                  <p className="text-base"><b>고치는 법</b> {f.fixHint}</p>
                </div>
              );
            })
          )}
        </section>

        <section className="panel flex flex-col gap-2 p-4">
          <h2 className="title text-2xl text-espresso">실습 체크리스트</h2>
          {checklist.map((c) => <Check key={c} text={c} />)}
        </section>

        <section className="panel flex flex-col gap-2 p-4">
          <h2 className="title text-2xl text-espresso">주문별 기록</h2>
          <ul className="flex flex-col gap-1">
            {r.records.map((rec, i) => (
              <li key={i} className="flex flex-wrap items-center gap-2 rounded-xl bg-wall px-3 py-2 text-base">
                <span className="font-bold">{getMenu(rec.menuId).name}</span>
                <span>{rec.score}점</span>
                {rec.returned && <span className="rounded-full bg-danger px-2 text-sm text-milk">반품</span>}
                {rec.timeout && <span className="rounded-full bg-warn px-2 text-sm text-ink">이탈</span>}
              </li>
            ))}
          </ul>
        </section>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <button
            type="button"
            className="btn-primary"
            onClick={() => (practice ? goto('practiceSetup') : startStage(r.stageId))}
          >
            다시 하기
          </button>
          {canNext && (
            <button type="button" className="btn-primary" onClick={() => { selectStage(r.stageId + 1); goto('prep'); }}>다음 스테이지</button>
          )}
          <button type="button" className="btn-soft" onClick={() => goto('stageSelect')}>스테이지 선택</button>
          <button type="button" className="btn-soft" onClick={() => goto('title')}>타이틀</button>
        </div>
      </main>
    </div>
  );
}
