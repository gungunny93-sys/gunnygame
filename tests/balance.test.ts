import { it } from 'vitest';
import { STAGES } from '../src/data/stages';
import { createGameStore } from '../src/game/store';
import { Bot } from './bot';
// 밸런스 리포트(기본 실행 안 함): BALANCE=1 npx vitest run tests/balance.test.ts
// 봇 종류(병렬 작업 여부·버튼 반응 시간)별로 스테이지마다 시드 6개의 클리어·별·이탈·소요 시간을 출력한다.
const enabled = !!(globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.BALANCE;
it.runIf(enabled)('balance report', () => {
  for (const [parallel, reaction] of [[true, 0.5], [true, 1.0], [true, 1.5], [false, 1.0]] as const) {
    for (const st of STAGES) {
      const out: string[] = [];
      for (const seed of [1, 2, 3, 4, 5, 6]) {
        const store = createGameStore({ persist: false });
        store.getState().startStage(st.id, seed);
        const bot = new Bot(store, { parallel, reaction });
        let t = 0; const orig = store.getState().tick;
        store.setState({ tick: (dt: number) => { t += dt; orig(dt); } });
        bot.playStage();
        const r = store.getState().lastResult!.summary;
        out.push(`${r.cleared ? 'C' : 'x'}${r.stars} to${r.timeouts} ${Math.round(t)}s`);
      }
      // eslint-disable-next-line no-console
      console.log(`par=${parallel} react=${reaction} S${st.id}: ${out.join(' | ')}`);
    }
  }
}, 600000);
