// 게임 상태 스토어(Zustand). 규칙·계산은 game/의 순수 함수를 호출하고 여기서는 상태 전이만 한다.
import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import { CUSTOMER_TYPES } from '../data/customers';
import { FEEDBACK } from '../data/feedback';
import { MENU_BY_ID, MENUS, getMenu } from '../data/menus';
import { getStage } from '../data/stages';
import { CUPS, EQUIPMENT, HYGIENE_RULES, INGREDIENTS, JUDGE_RULES, STANDARDS } from '../data/standards';
import type {
  CupId, CustomerTypeId, DrinkRecipe, GroupId, Ingredient, MistakeCode, PlayLog, Progress, Settings, StageConfig,
} from '../data/types';
import {
  DEFAULT_PROGRESS, DEFAULT_SETTINGS, appendLog, loadProgress, loadSettings, saveProgress, saveSettings,
} from '../storage/save';
import {
  beanChangeDue, guideFor, hygieneEnabled, makeRng, maxConcurrentAt, patienceFor, resolveIdealGrind, steamTempMult,
} from './difficulty';
import {
  type CleaningState, type CleaningStepId, type PortafilterHygiene, type WandHygiene,
  applyGaugePenalty, cleaningDone, cleaningTap, initialPortafilter, initialWand, onShotStart, onSteamStart, startCleaning,
} from './hygiene';
import { type CupState, type ShotResult, addToCup, cupVolumeMl, emptyCup, judgeDrink, tasteOf } from './judge';
import { type ActiveCustomer, type PlannedOrder, buildOrderPlan, canSpawn, patienceRatio, tickPatience } from './orderQueue';
import { type OrderRecord, type StageSummary, nextStreak, scoreDrink, summarize, tipFor, topMistakes } from './scoring';
import { advanceShot, clampGrind, shiftIdealGrind } from './shotModel';
import { type PitcherState, advanceSteam, freshPitcher, pourFromPitcher } from './steamModel';

export type Screen =
  | 'title' | 'tutorial' | 'group' | 'stageSelect' | 'practiceSetup' | 'prep' | 'play' | 'result'
  | 'settings' | 'teacher' | 'privacy' | 'terms';

export type SessionMode = 'stage' | 'practice' | 'tutorial';
export type HoldKey = 'aerate' | 'roll' | 'hotWater' | 'coldWater' | 'steamedMilk' | 'coldMilk';
export const HOLD_KEYS: HoldKey[] = ['aerate', 'roll', 'hotWater', 'coldWater', 'steamedMilk', 'coldMilk'];

export interface Bubble { uid: number; text: string; kind: 'happy' | 'okay' | 'returned' | 'timeout' | 'hint'; until: number }
export interface Departed { uid: number; menuId: string; typeId: CustomerTypeId; outcome: 'served' | 'returned' | 'timeout'; at: number }
export interface Toast { id: number; text: string; kind: 'info' | 'warn' | 'combo' | 'event'; until: number }

export interface EspressoState {
  grind: number;
  basket: 1 | 2;
  running: boolean;
  ml: number;
  timeSec: number;
  pendingPuckViolation: boolean;   // 지금 추출 중인 샷이 퍽 처리 없이 시작됐는가
  ready: ShotResult | null;        // 정지한 뒤 기다리는 샷
  taste: { label: string; codes: MistakeCode[]; ml: number; timeSec: number } | null; // 테스트 샷 결과
  pf: PortafilterHygiene;
}

export interface ServeCup extends CupState { id: number }

export interface LastServe {
  uid: number; menuId: string; score: number; tip: number; streak: number;
  returned: boolean; mistakes: MistakeCode[]; lookalikeId: string | null; at: number;
}

export interface Session {
  mode: SessionMode;
  stage: StageConfig;
  menuIds: string[];
  guide: StageConfig['guide'];
  hygieneOn: boolean;
  rng: () => number;
  elapsed: number;
  paused: boolean;
  idealGrind: number;
  beanChanged: boolean;
  plan: PlannedOrder[];
  planLength: number;          // 연습 모드는 Infinity
  planIndex: number;
  nextSpawnAt: number;
  nextUid: number;
  customers: ActiveCustomer[];
  bubbles: Bubble[];
  departed: Departed[];
  espresso: EspressoState;
  pitcher: PitcherState;
  wand: WandHygiene;
  cup: CupState;
  slots: (ServeCup | null)[];
  selectedSlot: number | null;
  focusUid: number | null;      // 플레이어가 고른 주문(가이드선 기준). 없으면 줄 맨 앞
  nextCupId: number;
  holds: Record<HoldKey, boolean>;
  hygiene: number;
  minHygiene: number;
  cleaning: CleaningState | null;
  streak: number;
  tips: number;
  records: OrderRecord[];
  acceptedCount: number;
  toasts: Toast[];
  nextToastId: number;
  lastServe: LastServe | null;
  hint: string | null;          // 연습·튜토리얼에서 선배 힌트
  finished: boolean;
}

export interface StageResult {
  stageId: number;
  mode: SessionMode;
  summary: StageSummary;
  topMistakes: MistakeCode[];
  records: OrderRecord[];
  clearCount: number;
  totalOrders: number;
  minHygiene: number | null;
  hygieneRequired: number | null;
}

export interface GameState {
  screen: Screen;
  settings: Settings;
  progress: Progress;
  group: GroupId | null;
  afterGroup: Screen;
  selectedStageId: number;
  session: Session | null;
  lastResult: StageResult | null;
  activeStation: 1 | 2 | 3 | 4;   // 휴대폰 세로 화면 탭

  // 화면·설정
  goto: (s: Screen) => void;
  setGroup: (g: GroupId) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setUnlockAll: (v: boolean) => void;
  setTutorialDone: (v: boolean) => void;
  resetProgress: () => void;
  selectStage: (id: number) => void;
  setActiveStation: (n: 1 | 2 | 3 | 4) => void;
  isUnlocked: (id: number) => boolean;

  // 세션
  startStage: (id: number, seed?: number) => void;
  startPractice: (stageId: number, menuIds: string[], seed?: number) => void;
  startTutorial: (seed?: number) => void;
  tick: (dtReal: number) => void;
  setPaused: (p: boolean) => void;
  togglePause: () => void;
  quitSession: () => void;
  finishSession: () => void;

  // 에스프레소
  setGrind: (g: number) => void;
  setBasket: (b: 1 | 2) => void;
  startShot: () => void;
  stopShot: () => void;
  toggleShot: () => void;
  discardShot: () => void;
  knockPuck: () => void;
  flushGroup: () => void;

  // 스팀
  setHold: (k: HoldKey, on: boolean) => void;
  emptyPitcher: () => void;
  purgeWand: () => void;
  wipeWand: () => void;

  // 조립
  selectCup: (id: CupId) => void;
  tapIngredient: (ing: Ingredient) => void;
  pourShot: () => void;
  resetCup: () => void;
  sendToServe: () => void;

  // 서빙
  selectSlot: (i: number | null) => void;
  focusCustomer: (uid: number | null) => void;
  /** 손님 티켓을 탭: 서빙대 컵이 선택돼 있으면 서빙, 아니면 그 주문에 집중 */
  tapCustomer: (uid: number) => void;
  serveTo: (uid: number, slot?: number) => void;
  serveDefault: () => void;
  discardSlot: (i: number) => void;

  // 청소
  cleanTap: (step: CleaningStepId) => void;
}

const MAX_DT = 0.1;
const BUBBLE_SEC = 3.2;
const DEPART_SEC = 1.5;
const TOAST_SEC = 3.5;

function pickLine(lines: string[], rng: () => number): string {
  return lines[Math.floor(rng() * lines.length)] ?? '';
}

function noHolds(): Record<HoldKey, boolean> {
  return { aerate: false, roll: false, hotWater: false, coldWater: false, steamedMilk: false, coldMilk: false };
}

function newSession(mode: SessionMode, stage: StageConfig, menuIds: string[], seed: number): Session {
  const rng = makeRng(seed);
  const idealGrind = resolveIdealGrind(stage, rng);
  let plan: PlannedOrder[];
  let planLength: number;
  if (mode === 'stage') { plan = buildOrderPlan(stage, rng, menuIds); planLength = plan.length; }
  else if (mode === 'tutorial') { plan = [{ menuId: 'espresso', customerType: 'regular' }, { menuId: 'americano-hot', customerType: 'regular' }]; planLength = 2; }
  else { plan = []; planLength = Infinity; }
  return {
    mode, stage, menuIds, guide: guideFor(stage, mode !== 'stage'), hygieneOn: hygieneEnabled(stage), rng,
    elapsed: 0, paused: false, idealGrind, beanChanged: false,
    plan, planLength, planIndex: 0, nextSpawnAt: 1, nextUid: 1,
    customers: [], bubbles: [], departed: [],
    espresso: {
      grind: 5, basket: 1, running: false, ml: 0, timeSec: 0, pendingPuckViolation: false,
      ready: null, taste: null, pf: initialPortafilter(),
    },
    pitcher: freshPitcher(), wand: initialWand(),
    cup: emptyCup(), slots: Array.from({ length: EQUIPMENT.serveSlots }, () => null), selectedSlot: null, focusUid: null, nextCupId: 1,
    holds: noHolds(),
    hygiene: HYGIENE_RULES.start, minHygiene: HYGIENE_RULES.start, cleaning: null,
    streak: 0, tips: 0, records: [], acceptedCount: 0,
    toasts: [], nextToastId: 1, lastServe: null, hint: null, finished: false,
  };
}

function addToast(s: Session, text: string, kind: Toast['kind']): Session {
  return { ...s, toasts: [...s.toasts, { id: s.nextToastId, text, kind, until: s.elapsed + TOAST_SEC }], nextToastId: s.nextToastId + 1 };
}

function penalize(s: Session, kind: 'puck' | 'wand'): Session {
  const hygiene = applyGaugePenalty(s.hygiene, kind);
  let next: Session = { ...s, hygiene, minHygiene: Math.min(s.minHygiene, hygiene) };
  next = addToast(next, kind === 'puck' ? '퍽을 버리지 않고 추출했어요! 위생 −10' : '스팀완드를 관리하지 않았어요! 위생 −15', 'warn');
  if (hygiene <= 0) {
    next = { ...next, cleaning: startCleaning(), holds: noHolds(), espresso: { ...next.espresso, running: false } };
  }
  return next;
}

/** 다음 주문 꺼내기(연습 모드는 고른 메뉴에서 무작위) */
function takeOrder(s: Session): PlannedOrder {
  if (s.mode === 'practice') {
    const menuId = s.menuIds[Math.floor(s.rng() * s.menuIds.length)];
    return { menuId, customerType: 'regular' };
  }
  return s.plan[s.planIndex];
}

export function createGameStore(opts: { persist?: boolean } = {}) {
  const persist = opts.persist ?? true;

  return createStore<GameState>()((set, get) => {
    const upd = (fn: (s: Session) => Session | null | undefined) => {
      const s = get().session;
      if (!s) return;
      const n = fn(s);
      if (n && n !== s) set({ session: n });
    };
    const active = (s: Session) => !s.paused && !s.finished && !s.cleaning;

    return {
      screen: 'title',
      settings: persist ? loadSettings() : { ...DEFAULT_SETTINGS },
      progress: persist ? loadProgress() : { ...DEFAULT_PROGRESS, stars: {} },
      group: null,
      afterGroup: 'stageSelect',
      selectedStageId: 1,
      session: null,
      lastResult: null,
      activeStation: 1,

      goto: (screen) => set({ screen }),
      setGroup: (group) => set({ group, screen: get().afterGroup }),
      updateSettings: (patch) => {
        const settings = { ...get().settings, ...patch };
        set({ settings });
        if (persist) saveSettings(settings);
      },
      setUnlockAll: (v) => {
        const progress = { ...get().progress, unlockAll: v };
        set({ progress });
        if (persist) saveProgress(progress);
      },
      setTutorialDone: (v) => {
        const progress = { ...get().progress, tutorialDone: v };
        set({ progress });
        if (persist) saveProgress(progress);
      },
      resetProgress: () => {
        const progress = { ...DEFAULT_PROGRESS, stars: {} };
        set({ progress });
        if (persist) saveProgress(progress);
      },
      selectStage: (id) => set({ selectedStageId: id }),
      setActiveStation: (n) => set({ activeStation: n }),
      isUnlocked: (id) => {
        const p = get().progress;
        return id === 1 || p.unlockAll || (p.stars[id - 1] ?? 0) > 0;
      },

      startStage: (id, seed = Date.now()) => {
        const stage = getStage(id);
        set({ session: newSession('stage', stage, stage.menuIds, seed), screen: 'play', selectedStageId: id, activeStation: 1 });
      },
      startPractice: (stageId, menuIds, seed = Date.now()) => {
        const base = getStage(stageId);
        const ids = menuIds.length ? menuIds : base.menuIds;
        const stage: StageConfig = { ...base, maxConcurrent: 1, menuIds: ids, events: base.events.filter((e) => e === 'hygiene') };
        set({ session: newSession('practice', stage, ids, seed), screen: 'play', activeStation: 1 });
      },
      startTutorial: (seed = Date.now()) => {
        const base = getStage(1);
        const stage: StageConfig = { ...base, maxConcurrent: 1, totalOrders: 2, clearCount: 0 };
        set({ session: newSession('tutorial', stage, stage.menuIds, seed), screen: 'tutorial', activeStation: 1 });
      },

      tick: (dtRaw) => {
        const s0 = get().session;
        if (!s0 || s0.paused || s0.finished) return;
        const dt = Math.max(0, Math.min(MAX_DT, dtRaw));
        let s: Session = { ...s0, elapsed: s0.elapsed + dt };

        // 청소 중에는 영업이 멈춘다
        if (s.cleaning) {
          s.cleaning = { ...s.cleaning, elapsed: s.cleaning.elapsed + dt };
          if (cleaningDone(s.cleaning)) s = finishCleaning(s);
          set({ session: s });
          return;
        }

        const settings = get().settings;

        // 1. 에스프레소 추출
        if (s.espresso.running) {
          const e = s.espresso;
          const p = advanceShot({ ml: e.ml, timeSec: e.timeSec }, dt, e.grind, s.idealGrind, e.basket, STANDARDS.timeScale);
          s.espresso = { ...e, ml: p.ml, timeSec: p.timeSec };
          if (p.ml >= EQUIPMENT.shotGlassMaxMl) s = stopShotIn(s);
        }

        // 2. 스팀
        const steamMode = s.holds.aerate ? 'aerate' : s.holds.roll ? 'roll' : null;
        if (steamMode && s.pitcher.milkMl > 0) {
          if (!s.pitcher.steamed && s.hygieneOn) {
            const r = onSteamStart(s.wand);
            s.wand = r.next;
            if (r.violation) {
              s.pitcher = { ...s.pitcher, wandDirty: true };
              s = penalize(s, 'wand');
              if (s.cleaning) { set({ session: s }); return; }
            }
          }
          s.pitcher = advanceSteam(s.pitcher, steamMode, dt, steamTempMult(settings.speed));
        }

        // 3. 붓기(누르는 동안)
        for (const k of ['hotWater', 'coldWater', 'coldMilk', 'steamedMilk'] as const) {
          if (!s.holds[k] || !s.cup.cupId) continue;
          const room = CUPS[s.cup.cupId].capacityMl - cupVolumeMl(s.cup);
          let amt = Math.min(room, (INGREDIENTS[k].pourMlPerSec ?? 0) * dt);
          if (amt <= 0) continue;
          if (k === 'steamedMilk') {
            if (s.pitcher.scalded) continue;
            const r = pourFromPitcher(s.pitcher, amt);
            s.pitcher = r.pitcher;
            amt = r.pouredMl;
            if (amt <= 0) continue;
            const p = s.pitcher;
            s.cup = { ...addToCup(s.cup, k, amt), milk: { tempC: p.tempC, foamCm: p.foamCm, coarse: p.coarse, wandDirty: p.wandDirty } };
          } else {
            s.cup = addToCup(s.cup, k, amt);
          }
        }

        // 4. 손님 인내심
        const tp = tickPatience(s.customers, dt);
        if (tp.timedOut.length) {
          for (const uid of tp.timedOut) {
            const c = s.customers.find((x) => x.uid === uid)!;
            s.records = [...s.records, { menuId: c.menuId, score: 0, returned: false, timeout: true, tip: 0, mistakes: ['TIMEOUT'] }];
            s.departed = [...s.departed, { uid, menuId: c.menuId, typeId: c.typeId, outcome: 'timeout', at: s.elapsed }];
            s.bubbles = [...s.bubbles.filter((b) => b.uid !== uid),
              { uid, text: pickLine(CUSTOMER_TYPES[c.typeId].lines.timeout, s.rng), kind: 'timeout', until: s.elapsed + BUBBLE_SEC }];
            s.streak = 0;
          }
        }
        s.customers = tp.customers;
        if (s.focusUid !== null && !s.customers.some((c) => c.uid === s.focusUid)) s.focusUid = null;

        // 5. 원두 상태 변화 이벤트
        if (s.mode === 'stage' && beanChangeDue(s.stage, s.records.length, s.beanChanged)) {
          s.idealGrind = shiftIdealGrind(s.idealGrind, s.rng);
          s.beanChanged = true;
          s = addToast(s, '원두 상태가 바뀌었어요! 테스트 샷으로 맛을 확인하고 분쇄도를 다시 맞춰 보세요.', 'event');
        }

        // 6. 손님 입장
        if (canSpawn(s.stage, {
          planIndex: s.planIndex, planLength: s.planLength, activeCount: s.customers.length,
          resolvedCount: s.records.length, elapsed: s.elapsed, nextSpawnAt: s.nextSpawnAt,
        }) && s.departed.every((d) => s.elapsed - d.at > 0.6)) {
          const o = takeOrder(s);
          const ct = CUSTOMER_TYPES[o.customerType];
          const patience = patienceFor(s.stage, ct, settings.speed, s.mode !== 'stage');
          s.customers = [...s.customers, {
            uid: s.nextUid, menuId: o.menuId, typeId: o.customerType, patience, patienceMax: patience, arrivedAt: s.elapsed,
          }];
          s.nextUid += 1;
          s.planIndex += 1;
          s.nextSpawnAt = s.elapsed + s.stage.spawnIntervalSec;
        }

        // 7. 만료된 말풍선·토스트·퇴장 정리
        if (s.bubbles.some((b) => b.until <= s.elapsed)) s.bubbles = s.bubbles.filter((b) => b.until > s.elapsed);
        if (s.toasts.some((t) => t.until <= s.elapsed)) s.toasts = s.toasts.filter((t) => t.until > s.elapsed);
        if (s.departed.some((d) => s.elapsed - d.at > DEPART_SEC)) s.departed = s.departed.filter((d) => s.elapsed - d.at <= DEPART_SEC);

        // 8. 영업 종료
        if (s.mode === 'stage' && s.records.length >= s.planLength && s.customers.length === 0) s.finished = true;
        if (s.mode === 'tutorial' && s.acceptedCount >= 2) s.finished = true;

        set({ session: s });
        if (s.finished && s.mode === 'stage') get().finishSession();
        if (s.finished && s.mode === 'tutorial') get().setTutorialDone(true);
      },

      setPaused: (p) => upd((s) => ({ ...s, paused: p, holds: noHolds() })),
      togglePause: () => upd((s) => ({ ...s, paused: !s.paused, holds: noHolds() })),
      quitSession: () => {
        const s = get().session;
        if (s?.mode === 'practice' && s.records.length > 0) { get().finishSession(); return; }
        set({ session: null, screen: s?.mode === 'tutorial' ? 'stageSelect' : s?.mode === 'practice' ? 'practiceSetup' : 'stageSelect' });
      },
      finishSession: () => {
        const s = get().session;
        if (!s) return;
        const hygieneReq = s.mode === 'stage' ? s.stage.minHygiene ?? null : null;
        const summary = summarize(
          s.records, s.mode === 'stage' ? s.stage.clearCount : 0,
          hygieneReq === null || s.minHygiene >= hygieneReq,
        );
        const result: StageResult = {
          stageId: s.stage.id, mode: s.mode, summary, topMistakes: topMistakes(summary.mistakeCounts, 3),
          records: s.records, clearCount: s.stage.clearCount, totalOrders: s.mode === 'stage' ? s.stage.totalOrders : s.records.length,
          minHygiene: s.hygieneOn ? s.minHygiene : null, hygieneRequired: hygieneReq,
        };
        const st = get();
        let progress = st.progress;
        if (s.mode === 'stage' && summary.stars > (progress.stars[s.stage.id] ?? 0)) {
          progress = { ...progress, stars: { ...progress.stars, [s.stage.id]: summary.stars } };
          if (persist) saveProgress(progress);
        }
        if (persist && s.mode !== 'tutorial') {
          const log: PlayLog = {
            id: `${Date.now()}-${Math.floor(Math.random() * 1e6)}`, dateISO: new Date().toISOString(),
            group: st.group ?? 'solo', stageId: s.stage.id, practice: s.mode === 'practice',
            stars: s.mode === 'stage' ? summary.stars : 0, score: summary.totalScore, avgScore: summary.avgScore,
            served: summary.served, returned: summary.returned, timeouts: summary.timeouts,
            cleared: s.mode === 'stage' && summary.cleared, mistakes: summary.mistakeCounts,
          };
          appendLog(log);
        }
        set({ lastResult: result, progress, session: null, screen: 'result' });
      },

      // ── 에스프레소 ──
      setGrind: (g) => upd((s) => (s.espresso.running ? s : { ...s, espresso: { ...s.espresso, grind: clampGrind(g) } })),
      setBasket: (b) => upd((s) => (s.espresso.running ? s : { ...s, espresso: { ...s.espresso, basket: b } })),
      startShot: () => upd((s) => {
        if (!active(s) || s.espresso.running) return s;
        let next = s;
        let violation = false;
        let pf = s.espresso.pf;
        if (s.hygieneOn) {
          const r = onShotStart(pf);
          pf = r.next;
          violation = r.violation;
        }
        next = { ...next, espresso: { ...s.espresso, running: true, ml: 0, timeSec: 0, ready: null, taste: null, pf, pendingPuckViolation: violation } };
        if (violation) next = penalize(next, 'puck');
        return next;
      }),
      stopShot: () => upd((s) => (s.espresso.running ? stopShotIn(s) : s)),
      toggleShot: () => {
        const s = get().session;
        if (!s) return;
        if (s.espresso.running) get().stopShot(); else get().startShot();
      },
      discardShot: () => upd((s) => {
        const shot = s.espresso.ready;
        if (!shot) return s;
        const std = STANDARDS.shots[shotTypeFor(s)];
        const t = tasteOf(shot, std, s.stage.shotTolerance);
        return { ...s, espresso: { ...s.espresso, ready: null, ml: 0, timeSec: 0, taste: { ...t, ml: shot.ml, timeSec: shot.timeSec } } };
      }),
      knockPuck: () => upd((s) => (s.espresso.running ? s : { ...s, espresso: { ...s.espresso, pf: { ...s.espresso.pf, puckKnocked: true } } })),
      flushGroup: () => upd((s) => (s.espresso.running ? s : { ...s, espresso: { ...s.espresso, pf: { ...s.espresso.pf, flushed: true } } })),

      // ── 스팀 ──
      setHold: (k, on) => upd((s) => {
        if (on && !active(s)) return s;
        if (s.holds[k] === on) return s;
        const holds = { ...s.holds, [k]: on };
        if (on && k === 'aerate') holds.roll = false;
        if (on && k === 'roll') holds.aerate = false;
        let next = { ...s, holds };
        if (on && k === 'steamedMilk' && s.pitcher.scalded) next = addToast(next, '우유가 너무 뜨거워 쓸 수 없어요. 피처를 비우고 다시 데워요.', 'warn');
        return next;
      }),
      emptyPitcher: () => upd((s) => ({ ...s, pitcher: freshPitcher(), holds: { ...s.holds, aerate: false, roll: false, steamedMilk: false } })),
      purgeWand: () => upd((s) => ({ ...s, wand: { ...s.wand, purged: true } })),
      wipeWand: () => upd((s) => ({ ...s, wand: { ...s.wand, wiped: true } })),

      // ── 조립 ──
      selectCup: (id) => upd((s) => (active(s) ? { ...s, cup: emptyCup(id) } : s)),
      tapIngredient: (ing) => upd((s) => {
        if (!active(s) || !s.cup.cupId) return s;
        if (INGREDIENTS[ing].input !== 'tap') return s;
        if (ing === 'foamSpoon' && (s.pitcher.foamCm < JUDGE_RULES.macchiatoMinFoamCm || s.pitcher.scalded)) {
          return addToast(s, '피처에 거품이 없어요. 스팀 작업대에서 공기 주입으로 거품을 먼저 만들어요.', 'warn');
        }
        const room = CUPS[s.cup.cupId].capacityMl - cupVolumeMl(s.cup);
        if (room < INGREDIENTS[ing].volumeMl * 0.5) return addToast(s, '컵이 가득 찼어요.', 'warn');
        return { ...s, cup: addToCup(s.cup, ing, 1) };
      }),
      pourShot: () => upd((s) => {
        if (!active(s) || !s.cup.cupId || !s.espresso.ready) return s;
        if ((s.cup.amounts.espresso ?? 0) > 0) return addToast(s, '이 컵에는 이미 샷을 부었어요.', 'warn');
        const shot = s.espresso.ready;
        return { ...s, cup: { ...addToCup(s.cup, 'espresso', shot.ml), shot }, espresso: { ...s.espresso, ready: null, ml: 0, timeSec: 0 } };
      }),
      resetCup: () => upd((s) => ({ ...s, cup: emptyCup(s.cup.cupId), holds: { ...s.holds, hotWater: false, coldWater: false, coldMilk: false, steamedMilk: false } })),
      sendToServe: () => upd((s) => {
        if (!active(s) || !s.cup.cupId || cupVolumeMl(s.cup) <= 0) return s;
        const idx = s.slots.findIndex((x) => x === null);
        if (idx < 0) return addToast(s, '서빙대가 가득 찼어요. 먼저 서빙하거나 버려요.', 'warn');
        const slots = s.slots.slice();
        slots[idx] = { ...s.cup, id: s.nextCupId };
        return {
          ...s, slots, nextCupId: s.nextCupId + 1, cup: emptyCup(),
          holds: { ...s.holds, hotWater: false, coldWater: false, coldMilk: false, steamedMilk: false },
        };
      }),

      // ── 서빙 ──
      selectSlot: (i) => upd((s) => ({ ...s, selectedSlot: i })),
      focusCustomer: (uid) => upd((s) => ({ ...s, focusUid: uid })),
      tapCustomer: (uid) => {
        const s = get().session;
        if (!s) return;
        if (s.selectedSlot !== null && s.slots[s.selectedSlot]) get().serveTo(uid, s.selectedSlot);
        else get().focusCustomer(uid);
      },
      serveTo: (uid, slot) => upd((s) => {
        if (!active(s)) return s;
        const si = slot ?? s.selectedSlot ?? s.slots.findIndex((x) => x !== null);
        const cup = si !== null && si >= 0 ? s.slots[si] : null;
        const customer = s.customers.find((c) => c.uid === uid);
        if (!cup || !customer || si === null) return s;
        return serveCup(s, si, cup, customer);
      }),
      serveDefault: () => {
        const s = get().session;
        if (!s || s.customers.length === 0) return;
        const si = s.selectedSlot ?? s.slots.findIndex((x) => x !== null);
        if (si === null || si < 0 || !s.slots[si]) return;
        get().serveTo(bestCustomerFor(s, s.slots[si]!).uid, si);
      },
      discardSlot: (i) => upd((s) => {
        const slots = s.slots.slice();
        slots[i] = null;
        return { ...s, slots, selectedSlot: s.selectedSlot === i ? null : s.selectedSlot };
      }),

      // ── 청소 ──
      cleanTap: (step) => upd((s) => {
        if (!s.cleaning) return s;
        const c = cleaningTap(s.cleaning, step);
        const next = { ...s, cleaning: c };
        return cleaningDone(c) ? finishCleaning(next) : next;
      }),
    };
  });
}

// ── 세션 내부 도우미(순수) ─────────────────────────────────

function stopShotIn(s: Session): Session {
  const e = s.espresso;
  const ready: ShotResult = { ml: e.ml, timeSec: e.timeSec, basket: e.basket, puckViolation: e.pendingPuckViolation };
  return { ...s, espresso: { ...e, running: false, ready, pendingPuckViolation: false } };
}

function finishCleaning(s: Session): Session {
  const next: Session = {
    ...s, cleaning: null, hygiene: HYGIENE_RULES.resumeAt,
    espresso: { ...s.espresso, pf: initialPortafilter() }, wand: { wiped: true, purged: true },
  };
  return addToast(next, '마감 청소 끝! 위생 게이지 50%로 영업을 다시 시작해요.', 'info');
}

/** 테스트 샷 맛 판정 기준: 집중한 주문 메뉴의 샷, 없으면 스테이지 첫 메뉴 */
function shotTypeFor(s: Session) {
  return (focusRecipe(s) ?? getMenu(s.menuIds[0])).shot;
}

/** Enter 서빙: 이 컵과 가장 잘 맞는 손님(같으면 먼저 온 손님) */
function bestCustomerFor(s: Session, cup: CupState): ActiveCustomer {
  let best = s.customers[0];
  let bestScore = -Infinity;
  for (const c of s.customers) {
    const j = judgeDrink(cup, getMenu(c.menuId), { shotTolerance: s.stage.shotTolerance, ingredientTolerance: s.stage.ingredientTolerance, menus: [] });
    const sc = j.composition * 100 - j.mistakes.length;
    if (sc > bestScore) { best = c; bestScore = sc; }
  }
  return best;
}

function serveCup(s: Session, slotIndex: number, cup: ServeCup, customer: ActiveCustomer): Session {
  const recipe = getMenu(customer.menuId);
  const ct = CUSTOMER_TYPES[customer.typeId];
  const judgement = judgeDrink(cup, recipe, {
    shotTolerance: s.stage.shotTolerance, ingredientTolerance: s.stage.ingredientTolerance, menus: MENUS,
  });
  const ratio = s.mode === 'stage' ? patienceRatio(customer) : 1;
  const score = scoreDrink(judgement, ratio, ct.returnThreshold);
  const accepted = !score.returned;
  const streak = nextStreak(s.streak, score.total, accepted);
  const tip = accepted ? tipFor(score.total, streak, ct) : 0;
  const slots = s.slots.slice();
  slots[slotIndex] = null;

  let text: string;
  if (score.wrongMenu && judgement.lookalikeId) text = `이건 ${MENU_BY_ID[judgement.lookalikeId].name} 같은데요? 제가 시킨 게 아니에요.`;
  else if (!accepted) text = judgement.mistakes[0] ? FEEDBACK[judgement.mistakes[0]].customerLine : pickLine(ct.lines.returned, s.rng);
  else if (score.total >= 90) text = pickLine(ct.lines.happy, s.rng);
  else text = judgement.mistakes[0] ? `${pickLine(ct.lines.okay, s.rng)} ${FEEDBACK[judgement.mistakes[0]].customerLine}` : pickLine(ct.lines.okay, s.rng);

  const record: OrderRecord = { menuId: recipe.id, score: score.total, returned: !accepted, timeout: false, tip, mistakes: judgement.mistakes };
  const retry = !accepted && s.mode !== 'stage';
  const lastServe: LastServe = {
    uid: customer.uid, menuId: recipe.id, score: score.total, tip, streak, returned: !accepted,
    mistakes: judgement.mistakes, lookalikeId: judgement.lookalikeId, at: s.elapsed,
  };

  let next: Session = {
    ...s, slots, selectedSlot: null, streak, tips: s.tips + tip,
    records: [...s.records, record], lastServe,
    acceptedCount: s.acceptedCount + (accepted ? 1 : 0),
    bubbles: [...s.bubbles.filter((b) => b.uid !== customer.uid), { uid: customer.uid, text, kind: accepted ? (score.total >= 80 ? 'happy' : 'okay') : 'returned', until: s.elapsed + BUBBLE_SEC }],
  };
  if (retry) {
    // 연습·튜토리얼: 선배 힌트 후 같은 주문 재도전
    const code = judgement.mistakes[0];
    const hint = code ? FEEDBACK[code].fixHint : '레시피 카드를 다시 확인해 봐요.';
    next.hint = `도담 선배: ${hint}`;
  } else {
    next.hint = accepted ? null : next.hint;
    next.customers = s.customers.filter((c) => c.uid !== customer.uid);
    if (next.focusUid === customer.uid) next.focusUid = null;
    next.departed = [...s.departed, { uid: customer.uid, menuId: customer.menuId, typeId: customer.typeId, outcome: accepted ? 'served' : 'returned', at: s.elapsed }];
  }
  if (accepted && streak >= 2) next = addToast(next, `콤보 ×${streak >= 3 ? '1.5' : '1.2'}! 팁 +${tip}`, 'combo');
  return next;
}

// ── 앱 전역 스토어와 훅 ──────────────────────────────────

export const gameStore = createGameStore();

export function useGame<T>(selector: (s: GameState) => T): T {
  return useStore(gameStore, selector);
}

// ── 화면용 셀렉터 ─────────────────────────────────────────

export const sel = {
  session: (s: GameState) => s.session,
  screen: (s: GameState) => s.screen,
  settings: (s: GameState) => s.settings,
  espresso: (s: GameState) => s.session?.espresso ?? null,
  pitcher: (s: GameState) => s.session?.pitcher ?? null,
  wand: (s: GameState) => s.session?.wand ?? null,
  cup: (s: GameState) => s.session?.cup ?? null,
  slots: (s: GameState) => s.session?.slots ?? null,
  customers: (s: GameState) => s.session?.customers ?? null,
  holds: (s: GameState) => s.session?.holds ?? null,
};

/** 지금 집중한 주문(없으면 줄 맨 앞 손님) */
export function focusCustomerOf(s: Session): ActiveCustomer | null {
  return s.customers.find((c) => c.uid === s.focusUid) ?? s.customers[0] ?? null;
}

/** 가이드선 기준 레시피: 집중한 주문의 메뉴 */
export function focusRecipe(s: Session): DrinkRecipe | null {
  const c = focusCustomerOf(s);
  return c ? getMenu(c.menuId) : null;
}

/** 조립대 가이드 레시피: 고른 컵과 같은 컵을 쓰는 주문을 우선 */
export function assemblyRecipe(s: Session): DrinkRecipe | null {
  const focus = focusRecipe(s);
  if (!s.cup.cupId || (focus && focus.cup === s.cup.cupId)) return focus;
  const c = s.customers.find((x) => getMenu(x.menuId).cup === s.cup.cupId);
  return c ? getMenu(c.menuId) : focus;
}

/** 이 세션에서 쓸 수 있는 재료 버튼(스테이지 메뉴의 재료 합집합) */
export function availableIngredients(menuIds: string[]): Ingredient[] {
  const order = Object.keys(INGREDIENTS) as Ingredient[];
  const used = new Set<Ingredient>();
  for (const id of menuIds) for (const st of getMenu(id).steps) used.add(st.ingredient);
  if (used.has('foamSpoon')) used.add('steamedMilk');
  return order.filter((i) => used.has(i));
}

export function sessionUsesMilk(menuIds: string[]): boolean {
  return menuIds.some((id) => !!getMenu(id).milk || getMenu(id).steps.some((s) => s.ingredient === 'foamSpoon'));
}

export function sessionUsesGrinder(stage: StageConfig): boolean {
  return stage.id >= 2;
}

export { maxConcurrentAt };
