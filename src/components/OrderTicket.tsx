import { getMenu } from '../data/menus';

export function OrderTicket(props: { menuId: string; focused?: boolean; compact?: boolean }) {
  const { menuId, focused, compact } = props;
  const menu = getMenu(menuId);
  const iced = menu.temp === 'iced';
  return (
    <div
      className={`rounded-md border-2 bg-milk px-2 text-left shadow-sm ${focused ? 'border-warn' : 'border-wood/50'} ${compact ? 'py-0.5' : 'py-1'}`}
      style={{ clipPath: 'polygon(0 0, 100% 0, 100% 92%, 94% 100%, 88% 92%, 82% 100%, 76% 92%, 70% 100%, 64% 92%, 58% 100%, 52% 92%, 46% 100%, 40% 92%, 34% 100%, 28% 92%, 22% 100%, 16% 92%, 10% 100%, 4% 92%, 0 100%)' }}
    >
      <div className={`title leading-tight text-ink ${compact ? 'text-sm' : 'text-base'}`}>{menu.name}</div>
      <span className={`inline-flex items-center gap-1 rounded-full px-1.5 text-xs font-bold text-milk ${iced ? 'bg-cold' : 'bg-danger'}`}>
        <span aria-hidden>{iced ? '🧊' : '☕'}</span>{iced ? '아이스' : '핫'}
      </span>
    </div>
  );
}
