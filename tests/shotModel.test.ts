import { describe, expect, it } from 'vitest';
import { STANDARDS } from '../src/data/standards';
import { judgeShot } from '../src/game/judge';
import { advanceShot, flowRate, grindsInRange, shiftIdealGrind, timeToReach } from '../src/game/shotModel';
import { makeRng } from '../src/game/difficulty';

const single = STANDARDS.shots.single;

describe('shotModel', () => {
  it('흐름 속도 = 1.2 × basket × 1.25^(grind − ideal)', () => {
    expect(flowRate(5, 5, 1)).toBeCloseTo(1.2);
    expect(flowRate(5, 5, 2)).toBeCloseTo(2.4);
    expect(flowRate(6, 5, 1)).toBeCloseTo(1.5);
    expect(flowRate(4, 5, 1)).toBeCloseTo(0.96);
  });
  it('굵게(숫자 크게) 하면 빨라지고 곱게 하면 느려진다', () => {
    expect(timeToReach(30, 7, 5, 1)).toBeLessThan(timeToReach(30, 5, 5, 1));
    expect(timeToReach(30, 3, 5, 1)).toBeGreaterThan(timeToReach(30, 5, 5, 1));
  });
  it('이상 분쇄도에서 모든 샷 종류가 목표량에 시간 범위 안으로 들어온다', () => {
    for (const std of Object.values(STANDARDS.shots)) {
      const t = timeToReach(std.targetMl, 5, 5, std.basket);
      expect(t).toBeGreaterThanOrEqual(std.timeSec[0]);
      expect(t).toBeLessThanOrEqual(std.timeSec[1]);
      expect(grindsInRange(std.targetMl, std.timeSec, 5, std.basket)).toContain(5);
    }
  });
  it('timeScale 3: 실제 1초 = 머신 3초', () => {
    const p = advanceShot({ ml: 0, timeSec: 0 }, 1, 5, 5, 1, 3);
    expect(p.timeSec).toBeCloseTo(3);
    expect(p.ml).toBeCloseTo(3.6);
  });
  it('원두 변화는 ±1~2 이동하고 범위를 벗어나지 않는다', () => {
    const rng = makeRng(7);
    for (let i = 0; i < 200; i++) {
      const ideal = 2 + (i % 7);
      const n = shiftIdealGrind(ideal, rng);
      expect(Math.abs(n - ideal)).toBeGreaterThanOrEqual(1);
      expect(Math.abs(n - ideal)).toBeLessThanOrEqual(2);
      expect(n).toBeGreaterThanOrEqual(2);
      expect(n).toBeLessThanOrEqual(9);
    }
  });
});

describe('샷 판정 경계값', () => {
  const tol = 0.2;
  const base = { basket: 1 as const, puckViolation: false };
  it('목표량·시간 정확 → 100점, 실수 없음', () => {
    const j = judgeShot({ ...base, ml: 30, timeSec: 25 }, single, tol);
    expect(j.quality).toBe(100);
    expect(j.mistakes).toEqual([]);
  });
  it('허용 오차 경계(±20%)는 통과, 넘으면 SHOT_LOW/HIGH', () => {
    expect(judgeShot({ ...base, ml: 24, timeSec: 25 }, single, tol).mistakes).toEqual([]);
    expect(judgeShot({ ...base, ml: 36, timeSec: 25 }, single, tol).mistakes).toEqual([]);
    expect(judgeShot({ ...base, ml: 23.9, timeSec: 25 }, single, tol).mistakes).toEqual(['SHOT_LOW']);
    expect(judgeShot({ ...base, ml: 36.1, timeSec: 25 }, single, tol).mistakes).toEqual(['SHOT_HIGH']);
  });
  it('시간 경계 20초·30초는 통과, 밖이면 과소/과다추출', () => {
    expect(judgeShot({ ...base, ml: 30, timeSec: 20 }, single, tol).mistakes).toEqual([]);
    expect(judgeShot({ ...base, ml: 30, timeSec: 30 }, single, tol).mistakes).toEqual([]);
    expect(judgeShot({ ...base, ml: 30, timeSec: 19.9 }, single, tol).mistakes).toEqual(['UNDER_EXTRACTED']);
    expect(judgeShot({ ...base, ml: 30, timeSec: 30.1 }, single, tol).mistakes).toEqual(['OVER_EXTRACTED']);
  });
  it('양·시간 모두 크게 벗어나면 0점까지 떨어진다', () => {
    expect(judgeShot({ ...base, ml: 80, timeSec: 70 }, single, tol).quality).toBe(0);
  });
  it('위생: 퍽 미처리 샷은 품질 −20', () => {
    const ok = judgeShot({ ...base, ml: 30, timeSec: 25 }, single, tol);
    const bad = judgeShot({ ...base, ml: 30, timeSec: 25, puckViolation: true }, single, tol);
    expect(ok.quality - bad.quality).toBe(20);
    expect(bad.mistakes).toContain('PUCK_NOT_KNOCKED');
  });
});
