// 누르고 있는 동안 동작하는 버튼(터치·마우스 공용). 손을 떼거나 버튼 밖으로 나가면 멈춘다.
import { type ReactNode, useEffect, useRef } from 'react';
import { type HoldKey, gameStore, useGame } from '../game/store';

interface Props {
  hold: HoldKey;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
  tut?: string;            // 튜토리얼 하이라이트용 data-tut
  ariaLabel?: string;
}

export function HoldButton({ hold, children, disabled, className = '', tut, ariaLabel }: Props) {
  const on = useGame((s) => s.session?.holds[hold] ?? false);
  const pressed = useRef(false);
  const set = (v: boolean) => {
    if (pressed.current === v) return;
    pressed.current = v;
    gameStore.getState().setHold(hold, v);
  };
  useEffect(() => () => { if (pressed.current) gameStore.getState().setHold(hold, false); }, [hold]);
  return (
    <button
      type="button"
      data-tut={tut}
      aria-label={ariaLabel}
      aria-pressed={on}
      disabled={disabled}
      className={`${className} ${on ? 'ring-4 ring-warn scale-95' : ''}`}
      onPointerDown={(e) => { if (disabled) return; (e.target as Element).setPointerCapture?.(e.pointerId); set(true); }}
      onPointerUp={() => set(false)}
      onPointerCancel={() => set(false)}
      onLostPointerCapture={() => set(false)}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); e.stopPropagation(); set(true); } }}
      onKeyUp={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); set(false); } }}
    >
      {children}
    </button>
  );
}
