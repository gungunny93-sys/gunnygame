import { useMemo, useState } from 'react';
import { MISTAKE_LABELS } from '../data/mistakeLabels';
import { MISTAKE_CODES } from '../data/types';
import type { MistakeCode, PlayLog } from '../data/types';
import { useGame } from '../game/store';
import { clearLogs, downloadCsv, loadLogs, logsToCsv } from '../storage/save';

const groupName = (g: string) => (g === 'solo' ? '개인 연습' : `${g}모둠`);

export function TeacherLog() {
  const goto = useGame((s) => s.goto);
  const progress = useGame((s) => s.progress);
  const setUnlockAll = useGame((s) => s.setUnlockAll);
  const resetProgress = useGame((s) => s.resetProgress);
  const [logs, setLogs] = useState<PlayLog[]>(() => loadLogs());
  const [confirmLogs, setConfirmLogs] = useState(false);
  const [confirmProg, setConfirmProg] = useState(false);

  const sorted = useMemo(() => [...logs].sort((a, b) => b.dateISO.localeCompare(a.dateISO)), [logs]);
  const stats = useMemo(() => {
    const m = new Map<string, Partial<Record<MistakeCode, number>>>();
    for (const l of logs) {
      const cur = m.get(l.group) ?? {};
      for (const c of MISTAKE_CODES) {
        const n = l.mistakes[c] ?? 0;
        if (n > 0) cur[c] = (cur[c] ?? 0) + n;
      }
      m.set(l.group, cur);
    }
    return [...m.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([g, counts]) => ({
        g,
        top: (Object.entries(counts) as [MistakeCode, number][]).sort((a, b) => b[1] - a[1]).slice(0, 5),
      }));
  }, [logs]);

  const exportCsv = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    downloadCsv(`rush-hour-bar-기록-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.csv`, logsToCsv(logs));
  };

  return (
    <div className="h-full overflow-y-auto bg-wall">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6">
        <button type="button" className="btn-soft self-start" onClick={() => goto('title')}>← 타이틀</button>
        <h1 className="title text-center text-4xl text-espresso">교사용 기록</h1>
        <p className="text-center text-base font-bold">기록은 이 기기의 브라우저에만 저장돼요. 외부로 보내지 않아요.</p>

        <section className="panel flex flex-col gap-2 p-4">
          <h2 className="title text-2xl">모둠별 실수 통계</h2>
          {stats.length === 0 ? <p>아직 기록이 없어요.</p> : stats.map(({ g, top }) => (
            <div key={g} className="rounded-2xl bg-wall p-3 text-base">
              <b>{groupName(g)}</b>{' '}
              {top.length === 0 ? '실수 없음' : top.map(([c, n]) => `${MISTAKE_LABELS[c]} ${n}`).join(' · ')}
            </div>
          ))}
        </section>

        <section className="panel p-4">
          <h2 className="title mb-2 text-2xl">플레이 기록</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead>
                <tr className="border-b-2 border-wood/30">
                  {['날짜', '모둠', '스테이지', '구분', '별', '점수', '평균', '서빙/반품/이탈', '클리어'].map((h) => <th key={h} className="p-2">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {sorted.map((l) => (
                  <tr key={l.id} className="border-b border-wood/20">
                    <td className="p-2">{new Date(l.dateISO).toLocaleString('ko-KR')}</td>
                    <td className="p-2">{groupName(l.group)}</td>
                    <td className="p-2">{l.stageId}</td>
                    <td className="p-2">{l.practice ? '연습' : '영업'}</td>
                    <td className="p-2">{l.stars}</td>
                    <td className="p-2">{l.score}</td>
                    <td className="p-2">{l.avgScore.toFixed(1)}</td>
                    <td className="p-2">{l.served}/{l.returned}/{l.timeouts}</td>
                    <td className="p-2">{l.cleared ? '예' : '아니오'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sorted.length === 0 && <p className="p-2">기록이 없어요.</p>}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button type="button" className="btn-primary" disabled={logs.length === 0} onClick={exportCsv}>CSV 내보내기</button>
          {!confirmLogs ? (
            <button type="button" className="btn-danger" disabled={logs.length === 0} onClick={() => setConfirmLogs(true)}>기록 초기화</button>
          ) : (
            <div className="flex gap-2">
              <button type="button" className="btn-danger flex-1" onClick={() => { clearLogs(); setLogs(loadLogs()); setConfirmLogs(false); }}>정말 지울게요</button>
              <button type="button" className="btn-soft flex-1" onClick={() => setConfirmLogs(false)}>취소</button>
            </div>
          )}
          <button
            type="button"
            role="switch"
            aria-checked={progress.unlockAll}
            className={`btn ${progress.unlockAll ? 'bg-good text-ink' : 'bg-milk text-ink border-2 border-wood/30'}`}
            onClick={() => setUnlockAll(!progress.unlockAll)}
          >
            전체 스테이지 해금: {progress.unlockAll ? '켜짐' : '꺼짐'}
          </button>
          {!confirmProg ? (
            <button type="button" className="btn-danger" onClick={() => setConfirmProg(true)}>진행도 초기화</button>
          ) : (
            <div className="flex gap-2">
              <button type="button" className="btn-danger flex-1" onClick={() => { resetProgress(); setConfirmProg(false); }}>정말 초기화할게요</button>
              <button type="button" className="btn-soft flex-1" onClick={() => setConfirmProg(false)}>취소</button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
