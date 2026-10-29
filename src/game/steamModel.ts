// 우유 스티밍 모델 — GAME_PLAN.md 5.4 (실제 시간 기준, 배율 없음, 순수 함수)
import { EQUIPMENT, STANDARDS } from '../data/standards';

export interface PitcherState {
  tempC: number;
  foamCm: number;
  coarse: boolean;     // 37℃를 넘긴 뒤 공기를 주입했는가
  scalded: boolean;    // 70℃를 넘겼는가(쓸 수 없음)
  milkMl: number;      // 남은 우유
  steamed: boolean;    // 이번 우유를 스팀하기 시작했는가(위생 판정용)
  wandDirty: boolean;  // 이번 우유를 스팀하기 전에 스팀완드 위생을 지키지 않았는가
}

export type SteamMode = 'aerate' | 'roll';

export function freshPitcher(): PitcherState {
  return {
    tempC: STANDARDS.milk.startTempC, foamCm: 0, coarse: false, scalded: false,
    milkMl: EQUIPMENT.pitcherMl, steamed: false, wandDirty: false,
  };
}

/**
 * dt초 동안 스팀한다. tempMult는 게임 속도 '느림'일 때 0.75.
 * 공기 주입: 거품 +0.3cm/초, 온도 +5℃/초 / 롤링: 온도 +6℃/초
 */
export function advanceSteam(p: PitcherState, mode: SteamMode, dt: number, tempMult = 1): PitcherState {
  if (p.milkMl <= 0) return p;
  const m = STANDARDS.milk;
  const next = { ...p, steamed: true };
  if (mode === 'aerate') {
    if (p.tempC > m.aerateMaxTempC) next.coarse = true;
    next.foamCm = p.foamCm + m.aerateFoamCmPerSec * dt;
    next.tempC = p.tempC + m.aerateTempPerSec * dt * tempMult;
  } else {
    next.tempC = p.tempC + m.rollTempPerSec * dt * tempMult;
  }
  next.tempC = Math.min(EQUIPMENT.maxTempC, next.tempC);
  if (next.tempC > m.scaldC) next.scalded = true;
  return next;
}

export type TempZone = 'cold' | 'low' | 'ideal' | 'high' | 'scalded';

/** 온도 구간: 55 미만 cold / 55~60 low / 60~65 ideal / 65~70 high / 70 초과 scalded */
export function tempZone(tempC: number): TempZone {
  const m = STANDARDS.milk;
  if (tempC > m.scaldC) return 'scalded';
  if (tempC < m.okC[0]) return 'cold';
  if (tempC < m.idealC[0]) return 'low';
  if (tempC <= m.idealC[1]) return 'ideal';
  return 'high';
}

/** 거품 두께 판정 */
export function foamJudge(foamCm: number, range: readonly [number, number]): 'thin' | 'ok' | 'thick' {
  const eps = 1e-9;
  if (foamCm < range[0] - eps) return 'thin';
  if (foamCm > range[1] + eps) return 'thick';
  return 'ok';
}

/** 피처에서 우유를 따른다. 실제로 나간 양을 돌려준다. */
export function pourFromPitcher(p: PitcherState, wantMl: number): { pitcher: PitcherState; pouredMl: number } {
  const poured = Math.max(0, Math.min(wantMl, p.milkMl));
  return { pitcher: { ...p, milkMl: p.milkMl - poured }, pouredMl: poured };
}
