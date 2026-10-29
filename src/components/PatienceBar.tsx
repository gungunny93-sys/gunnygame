export function PatienceBar(props: { patience: number; max: number }) {
  const { patience, max } = props;
  if (!Number.isFinite(max)) {
    return <div className="rounded-full bg-ink/10 px-2 text-center text-xs font-bold text-ink">∞ 연습</div>;
  }
  const ratio = Math.max(0, Math.min(1, patience / max));
  const color = ratio > 0.6 ? 'bg-good' : ratio > 0.3 ? 'bg-warn' : 'bg-danger';
  return (
    <div className="flex items-center gap-1" role="progressbar" aria-valuemin={0} aria-valuemax={Math.ceil(max)} aria-valuenow={Math.ceil(patience)} aria-label="인내심">
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink/15">
        <div className={`h-full rounded-full transition-[width] duration-200 ${color}`} style={{ width: `${ratio * 100}%` }} />
      </div>
      <span className="w-9 text-right text-xs font-bold tabular-nums text-ink">{Math.ceil(patience)}초</span>
    </div>
  );
}
