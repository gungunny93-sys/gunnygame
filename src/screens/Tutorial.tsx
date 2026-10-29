import { useEffect, useRef, useState } from 'react';
import { speak } from '../audio/tts';
import { SENPAI_NAME, TUTORIAL_DONE_TEXT, TUTORIAL_STEPS } from '../data/tutorial';
import { gameStore, useGame } from '../game/store';
import { tutorialConditionMet } from '../game/tutorial';
import { Play } from './Play';

export function TutorialScreen() {
  const mode = useGame((s) => s.session?.mode);
  useEffect(() => {
    if (gameStore.getState().session?.mode !== 'tutorial') gameStore.getState().startTutorial();
  }, []);
  void mode;
  return <Play />;
}

type Face = 'smile' | 'wow' | 'think';

function Dodam({ face }: { face: Face }) {
  const mouth = face === 'wow' ? <ellipse cx="30" cy="40" rx="3" ry="4" fill="#2B1B12" />
    : face === 'think' ? <path d="M25 40 H34" stroke="#2B1B12" strokeWidth="2" strokeLinecap="round" />
      : <path d="M24 38 Q30 45 36 38" stroke="#2B1B12" strokeWidth="2" fill="none" strokeLinecap="round" />;
  return (
    <svg viewBox="0 0 60 70" className="h-16 w-14 shrink-0" role="img" aria-label={SENPAI_NAME}>
      <path d="M8 70 Q8 50 30 50 Q52 50 52 70 Z" fill="#E8C9A0" />
      <circle cx="30" cy="28" r="18" fill="#F3D2B3" />
      <path d="M12 26 A18 18 0 0 1 24 11 L24 26 Z M24 12 A18 18 0 0 1 36 12 L36 24 Q30 20 24 24 Z M36 11 A18 18 0 0 1 48 26 L36 26 Z" fill="#2B1B12" />
      <rect x="46" y="14" width="3" height="16" rx="1.5" fill="#E0A43A" transform="rotate(15 47 22)" />
      <circle cx="23" cy="30" r="1.8" fill="#2B1B12" />
      <circle cx="37" cy="30" r="1.8" fill="#2B1B12" />
      {mouth}
    </svg>
  );
}

/** 안내판이 하이라이트한 버튼을 가리지 않도록 반대쪽에 둔다 */
// 넓은 화면: 손님 줄 오른쪽 빈 곳(위 오른쪽)에 고정 / 좁은 화면: 하이라이트한 버튼의 반대쪽(위·아래)
function panelPosFor(key: string | undefined): 'bottom' | 'top' | 'tr' {
  if (window.innerWidth >= 700) return 'tr';
  const el = key ? document.querySelector(`[data-tut="${key}"]`) : null;
  if (!el) return 'top';
  const r = el.getBoundingClientRect();
  return r.top + r.height / 2 > window.innerHeight * 0.45 ? 'top' : 'bottom';
}

function setHighlight(key: string | undefined) {
  document.querySelectorAll('.tut-highlight').forEach((el) => el.classList.remove('tut-highlight'));
  if (key) document.querySelectorAll(`[data-tut="${key}"]`).forEach((el) => el.classList.add('tut-highlight'));
}

export function TutorialOverlay() {
  const session = useGame((s) => s.session);
  const [idx, setIdx] = useState(0);
  const [small, setSmall] = useState(false);
  const [pos, setPos] = useState<'bottom' | 'top' | 'tr'>(() => panelPosFor(undefined));
  const idxRef = useRef(0);
  const finished = !!session?.finished;
  const step = TUTORIAL_STEPS[Math.min(idx, TUTORIAL_STEPS.length - 1)];

  const advance = () => {
    if (idxRef.current < TUTORIAL_STEPS.length - 1) { idxRef.current += 1; setIdx(idxRef.current); }
  };

  useEffect(() => {
    const check = () => {
      const s = gameStore.getState().session;
      if (!s || s.mode !== 'tutorial') return;
      const cur = TUTORIAL_STEPS[idxRef.current];
      if (cur && cur.until !== 'none' && tutorialConditionMet(cur.until, s)) advance();
    };
    check();
    return gameStore.subscribe(check);
  }, []);

  useEffect(() => {
    if (finished) { setHighlight(undefined); return; }
    if (step.station) gameStore.getState().setActiveStation(step.station);
    // 작업대 전환 뒤 요소가 그려질 때까지 잠시 기다렸다가 하이라이트
    setHighlight(step.highlight);
    const t = setTimeout(() => { setHighlight(step.highlight); setPos(panelPosFor(step.highlight)); }, 150);
    const st = gameStore.getState().settings;
    if (st.tts && !st.muted) speak(step.text);
    return () => clearTimeout(t);
  }, [idx, finished]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => setHighlight(undefined), []);

  if (!session || session.mode !== 'tutorial') return null;

  const leave = () => { gameStore.setState({ session: null, screen: 'stageSelect' }); };
  const skip = () => { gameStore.getState().setTutorialDone(true); leave(); };
  const text = finished ? TUTORIAL_DONE_TEXT : step.text;

  return (
    <div className={`pointer-events-none fixed z-[60] w-[calc(100vw-1rem)] max-w-md ${pos === 'top' ? 'left-2 top-2' : pos === 'tr' ? 'right-2 top-14' : 'bottom-2 left-2'}`}>
      <div className="pointer-events-auto rounded-2xl border-4 border-wood bg-milk p-2 shadow-xl">
        <div className="flex items-start gap-2">
          <Dodam face={finished ? 'wow' : step.until === 'none' ? 'smile' : 'think'} />
          <div className="min-w-0 flex-1">
            <div className="title text-sm text-wood">{SENPAI_NAME}</div>
            {!small && <p className="text-sm font-bold leading-snug text-ink">{text}</p>}
          </div>
          <button type="button" className="btn-soft min-h-16 min-w-16 shrink-0 text-xs" onClick={() => setSmall((v) => !v)}>
            {small ? '크게 보기' : '작게 보기'}
          </button>
        </div>
        {!small && (
          <div className="mt-2 flex flex-wrap justify-end gap-2">
            {finished ? (
              <button type="button" className="btn-primary min-h-16" onClick={leave}>스테이지 선택으로</button>
            ) : (
              <>
                <button type="button" className="btn-soft min-h-16" onClick={skip}>건너뛰기</button>
                {step.until === 'none' && <button type="button" className="btn-primary min-h-16" onClick={advance}>다음</button>}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
