import { gameStore } from '../game/store';

export function Footer() {
  const link = 'min-h-16 px-3 underline underline-offset-4 font-bold';
  return (
    <footer className="flex flex-wrap items-center justify-center gap-x-1 gap-y-0 py-2 text-sm text-ink/70">
      <span>© 2026 [공급자명]</span>
      <span aria-hidden="true">·</span>
      <button type="button" className={link} onClick={() => gameStore.getState().goto('privacy')}>개인정보 처리방침</button>
      <span aria-hidden="true">·</span>
      <button type="button" className={link} onClick={() => gameStore.getState().goto('terms')}>이용 안내</button>
    </footer>
  );
}
