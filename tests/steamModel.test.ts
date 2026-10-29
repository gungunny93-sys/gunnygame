import { describe, expect, it } from 'vitest';
import { judgeMilk } from '../src/game/judge';
import { advanceSteam, foamJudge, freshPitcher, tempZone } from '../src/game/steamModel';

function run(steps: Array<['aerate' | 'roll', number]>, mult = 1) {
  let p = freshPitcher();
  for (const [mode, sec] of steps) for (let t = 0; t < sec - 1e-9; t += 0.05) p = advanceSteam(p, mode, 0.05, mult);
  return p;
}

describe('steamModel', () => {
  it('시작 5℃, 공기 주입 1초 = 거품 +0.3cm, 온도 +5℃', () => {
    const p = run([['aerate', 1]]);
    expect(p.foamCm).toBeCloseTo(0.3);
    expect(p.tempC).toBeCloseTo(10);
  });
  it('롤링 1초 = 온도 +6℃, 거품 그대로', () => {
    const p = run([['roll', 1]]);
    expect(p.tempC).toBeCloseTo(11);
    expect(p.foamCm).toBe(0);
  });
  it('37℃ 이후 공기 주입하면 거친 거품', () => {
    expect(run([['aerate', 6]]).coarse).toBe(false);    // 35℃까지
    expect(run([['roll', 6], ['aerate', 1]]).coarse).toBe(true); // 41℃에서 주입
  });
  it('70℃를 넘으면 탄 우유', () => {
    expect(run([['roll', 10]]).scalded).toBe(false);    // 65℃
    expect(run([['roll', 11]]).scalded).toBe(true);     // 71℃
  });
  it('게임 속도 느림: 온도 상승 0.75배', () => {
    expect(run([['roll', 1]], 0.75).tempC).toBeCloseTo(9.5);
  });
  it('온도 구간 경계', () => {
    expect(tempZone(54.9)).toBe('cold');
    expect(tempZone(55)).toBe('low');
    expect(tempZone(60)).toBe('ideal');
    expect(tempZone(65)).toBe('ideal');
    expect(tempZone(65.1)).toBe('high');
    expect(tempZone(70)).toBe('high');
    expect(tempZone(70.1)).toBe('scalded');
  });
  it('거품 두께 판정', () => {
    expect(foamJudge(0.9, [1, 2])).toBe('thin');
    expect(foamJudge(1, [1, 2])).toBe('ok');
    expect(foamJudge(2.1, [1, 2])).toBe('thick');
  });
});

describe('우유 판정', () => {
  const base = { tempC: 62, foamCm: 1.5, coarse: false, wandDirty: false };
  it('최상 온도 + 거품 범위 → 100', () => {
    expect(judgeMilk(base, [1, 2])).toEqual({ quality: 100, mistakes: [] });
  });
  it('55~60·65~70℃는 감점만, 55 미만 MILK_COLD, 70 초과 MILK_SCALDED', () => {
    expect(judgeMilk({ ...base, tempC: 57 }, [1, 2]).quality).toBe(80);
    expect(judgeMilk({ ...base, tempC: 68 }, [1, 2]).quality).toBe(80);
    expect(judgeMilk({ ...base, tempC: 50 }, [1, 2]).mistakes).toEqual(['MILK_COLD']);
    expect(judgeMilk({ ...base, tempC: 75 }, [1, 2]).mistakes).toEqual(['MILK_SCALDED']);
  });
  it('거품 얇음/두꺼움/거친 거품', () => {
    expect(judgeMilk({ ...base, foamCm: 0.5 }, [1, 2]).mistakes).toEqual(['FOAM_THIN']);
    expect(judgeMilk({ ...base, foamCm: 2.5 }, [1, 2]).mistakes).toEqual(['FOAM_THICK']);
    expect(judgeMilk({ ...base, coarse: true }, [1, 2]).mistakes).toEqual(['COARSE_FOAM']);
  });
  it('위생: 스팀완드 미관리 우유는 품질 −20', () => {
    const j = judgeMilk({ ...base, wandDirty: true }, [1, 2]);
    expect(j.quality).toBe(80);
    expect(j.mistakes).toEqual(['WAND_NOT_CLEANED']);
  });
});
