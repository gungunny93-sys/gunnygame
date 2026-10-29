// 3번 작업대: 컵 고르기, 재료 담기
import { CupView, ingLabel } from '../CupView';
import { HoldButton } from '../HoldButton';
import { CUPS, CUP_ORDER, INGREDIENTS, UNIT_NAMES } from '../../data/standards';
import { getMenu } from '../../data/menus';
import { cupVolumeMl, emptyCup } from '../../game/judge';
import { type HoldKey, assemblyRecipe, availableIngredients, focusRecipe, gameStore, useGame } from '../../game/store';

export function AssemblyStation() {
  const session = useGame((s) => s.session);
  if (!session) return null;
  const st = gameStore.getState();
  const cup = session.cup;
  const recipe = assemblyRecipe(session);
  const guide = session.guide;
  const noCup = !cup.cupId;
  const ings = availableIngredients(session.menuIds);
  const empty = cupVolumeMl(cup) <= 0;
  const nameOnly = recipe ?? focusRecipe(session);

  const amountText = (ing: (typeof ings)[number]) => {
    const a = cup.amounts[ing] ?? 0;
    const u = INGREDIENTS[ing].unit;
    return `${u === 'ml' ? Math.round(a) : a}${UNIT_NAMES[u]}`;
  };

  return (
    <section className="panel flex h-full flex-col gap-2 p-2" aria-label="조립대">
      <h2 className="title flex items-center gap-2 text-xl"><span aria-hidden>🥤</span>조립대</h2>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
      <div className="grid grid-cols-3 gap-2">
        {CUP_ORDER.map((id) => (
          <button key={id} type="button" data-tut={`cup-${id}`} aria-pressed={cup.cupId === id}
            className={`flex min-h-16 flex-col items-center justify-center rounded-2xl border-2 p-1 text-xs font-bold ${cup.cupId === id ? 'border-warn bg-warn/30 ring-2 ring-warn' : 'border-wood/30 bg-milk'}`}
            onClick={() => st.selectCup(id)}>
            <CupView cup={emptyCup(id)} recipe={null} guide="hidden" size="sm" />
            <span>{cup.cupId === id ? '✓ ' : ''}{CUPS[id].name}</span>
          </button>
        ))}
      </div>

      <div className="flex items-start gap-2">
      <div className="shrink-0"><CupView cup={cup} recipe={recipe} guide={guide} size="md" /></div>

      {guide !== 'hidden' && recipe ? (
        <div className="min-w-0 flex-1 rounded-xl bg-wall p-2 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold">{recipe.name}</span>
            {recipe.orderMatters && <span className="rounded-full bg-warn px-2 text-xs font-bold">순서 중요!</span>}
          </div>
          <ol className="mt-1 list-decimal pl-5">
            {recipe.steps.map((s, i) => {
              const done = (cup.amounts[s.ingredient] ?? 0) > 0;
              return (
                <li key={i} className={done ? 'font-bold text-good' : ''}>
                  {done ? '✓ ' : ''}{ingLabel(s.ingredient)} {s.amount}{UNIT_NAMES[s.unit]}
                </li>
              );
            })}
          </ol>
        </div>
      ) : nameOnly && (
        <div className="min-w-0 flex-1 rounded-xl bg-wall p-2 text-sm font-bold">{getMenu(nameOnly.id).name} · 레시피를 기억해서!</div>
      )}
      </div>

      {noCup && <p className="text-center text-sm font-bold text-danger" role="status">먼저 컵을 골라요</p>}

      <div className="grid grid-cols-2 gap-2">
        {ings.map((ing) => {
          const info = INGREDIENTS[ing];
          const label = ing === 'espresso' ? '샷 붓기' : info.name;
          const body = (
            <span className="flex flex-col items-center leading-tight">
              <span>{label}</span>
              <span className="text-xs tabular-nums opacity-80">{amountText(ing)}</span>
            </span>
          );
          if (info.input === 'shot') {
            return (
              <button key={ing} type="button" data-tut="ing-espresso" className="btn-primary text-sm"
                disabled={noCup || !session.espresso.ready} onClick={() => st.pourShot()}>{body}</button>
            );
          }
          if (info.input === 'hold') {
            return (
              <HoldButton key={ing} hold={ing as HoldKey} tut={`ing-${ing}`} disabled={noCup} className="btn-primary text-sm">{body}</HoldButton>
            );
          }
          return (
            <button key={ing} type="button" data-tut={`ing-${ing}`} className="btn-primary text-sm"
              disabled={noCup} onClick={() => st.tapIngredient(ing)}>{body}</button>
          );
        })}
      </div>
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-2">
        <button type="button" className="btn-soft text-sm" onClick={() => st.resetCup()}>↺ 다시 만들기</button>
        <button type="button" data-tut="send-serve" className="btn-primary text-sm" disabled={empty || noCup} onClick={() => st.sendToServe()}>서빙대로 ▶</button>
      </div>
    </section>
  );
}
