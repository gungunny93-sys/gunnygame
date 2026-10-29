import { useGame } from '../game/store';

function Row({ label, note, on, onText, offText, onClick }: {
  label: string; note?: string; on: boolean; onText: string; offText: string; onClick: () => void;
}) {
  return (
    <div className="panel flex items-center justify-between gap-3 p-4">
      <div>
        <div className="title text-xl">{label}</div>
        {note && <div className="text-sm text-ink/70">{note}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        className={`btn min-w-28 min-h-16 ${on ? 'bg-good text-ink' : 'bg-milk text-ink border-2 border-wood/30'}`}
        onClick={onClick}
      >
        {on ? onText : offText}
      </button>
    </div>
  );
}

export function Settings() {
  const s = useGame((x) => x.settings);
  const update = useGame((x) => x.updateSettings);
  const goto = useGame((x) => x.goto);
  return (
    <div className="h-full overflow-y-auto bg-wall">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-6">
        <button type="button" className="btn-soft self-start" onClick={() => goto('title')}>← 타이틀</button>
        <h1 className="title text-center text-4xl text-espresso">설정</h1>
        <Row label="효과음" on={s.sfx} onText="켜짐" offText="꺼짐" onClick={() => update({ sfx: !s.sfx })} />
        <Row label="배경음" note="기본 꺼짐" on={s.bgm} onText="켜짐" offText="꺼짐" onClick={() => update({ bgm: !s.bgm })} />
        <Row label="TTS 주문 읽어주기" note="지원하지 않는 브라우저에서는 조용히 꺼져요" on={s.tts} onText="켜짐" offText="꺼짐" onClick={() => update({ tts: !s.tts })} />
        <Row
          label="게임 속도"
          note="느림: 인내심 1.5배, 스티밍 온도 상승 0.75배"
          on={s.speed === 'slow'}
          onText="느림"
          offText="보통"
          onClick={() => update({ speed: s.speed === 'slow' ? 'normal' : 'slow' })}
        />
        <Row label="연습 모드 기본값" note="타이틀의 「게임 시작」을 연습 모드로 시작해요" on={s.practiceDefault} onText="켜짐" offText="꺼짐" onClick={() => update({ practiceDefault: !s.practiceDefault })} />
      </main>
    </div>
  );
}
