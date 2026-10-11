import { describe, expect, it } from 'vitest';
import { createHeartClock, type HeartClock } from '../src/clock.ts';
import type { Hemodynamics } from '../src/hemodynamics.ts';
import { defaultParams } from '../src/params.ts';
import { phaseStarts } from '../src/timing.ts';

const keys = ['lv', 'aorta', 'la', 'volume'] as const;

function series(clock: HeartClock, from: number, to: number, step: number) {
  const out: { t: number; h: Hemodynamics }[] = [];
  for (let t = from; t <= to; t += step) out.push({ t, h: clock.hemodynamicsAt(t) });
  return out;
}

function expectContinuous(clock: HeartClock, from: number, to: number) {
  const points = series(clock, from, to, 0.25);
  for (let i = 1; i < points.length; i += 1) {
    for (const key of keys) {
      const jump = Math.abs((points[i]?.h[key] ?? 0) - (points[i - 1]?.h[key] ?? 0));
      // The fastest change, the rise of LV pressure in early ejection, is under 3 units per 0.25 ms (volume at 150 bpm).
      expect(jump, `${key} at ${points[i]?.t} ms`).toBeLessThan(3);
    }
  }
}

describe('hemodynamicsAt', () => {
  it('is continuous across phases and beats', () => {
    expectContinuous(createHeartClock({ heartRate: 75 }), 0, 4000);
    expectContinuous(createHeartClock({ heartRate: 150, rrIrregularity: 0.2, seed: 5 }), 0, 3000);
  });

  it('stays continuous when parameters change', () => {
    const clock = createHeartClock();
    clock.setParams(
      { lvSystolic: 180, aorticDiastolic: 100, lvEndDiastolic: 25, ejectionFraction: 0.3 },
      500,
    );
    expectContinuous(clock, 0, 3000);
  });

  it('reaches the set systolic and diastolic pressures', () => {
    const clock = createHeartClock({ heartRate: 60 });
    const points = series(clock, 2000, 2999, 0.5).map((p) => p.h);
    expect(Math.max(...points.map((h) => h.lv))).toBeCloseTo(defaultParams.lvSystolic, 3);
    expect(Math.max(...points.map((h) => h.aorta))).toBeCloseTo(defaultParams.lvSystolic, 3);
    expect(Math.min(...points.map((h) => h.aorta))).toBeCloseTo(defaultParams.aorticDiastolic, 0);
    expect(Math.max(...points.map((h) => h.volume))).toBeCloseTo(100, 5);
    expect(Math.min(...points.map((h) => h.volume))).toBeCloseTo(
      100 * (1 - defaultParams.ejectionFraction),
      5,
    );
  });

  it('keeps volume constant in the isovolumic phases and opens valves on pressure', () => {
    const clock = createHeartClock({ heartRate: 75 });
    const beat = clock.beatAt(1600);
    const [, ivc, ejection, ivr, filling] = phaseStarts(beat.timing).map((t) => beat.start + t);
    const at = (t: number) => clock.hemodynamicsAt(t);
    for (const [from, to] of [
      [ivc, ejection],
      [ivr, filling],
    ] as const) {
      const v = at((from ?? 0) + 1).volume;
      expect(at((to ?? 0) - 1).volume).toBeCloseTo(v, 6);
    }
    // Ejection: LV and aorta move together. Diastole: aorta above LV, LA above LV in filling.
    const mid = ((ejection ?? 0) + (ivr ?? 0)) / 2;
    expect(at(mid).aorta).toBe(at(mid).lv);
    const late = (filling ?? 0) + 0.5 * (beat.start + beat.rr - (filling ?? 0));
    expect(at(late).aorta).toBeGreaterThan(at(late).lv);
    expect(at(late).la).toBeGreaterThan(at(late).lv);
  });

  it('keeps each pressure on the side of its valve state', () => {
    for (const params of [
      { heartRate: 45 },
      { heartRate: 75 },
      { heartRate: 150 },
      { heartRate: 75, atrialContribution: 0 },
      { heartRate: 110, atrialContribution: 0.4, lvEndDiastolic: 25 },
    ]) {
      const clock = createHeartClock(params);
      const beat = clock.beatAt(3000);
      const { rPeak, ejectionStart, aorticClosure, mitralOpening } = beat.timing;
      for (let t = 0; t < beat.rr; t += 0.5) {
        const h = clock.hemodynamicsAt(beat.start + t);
        const where = `${JSON.stringify(params)} at ${t} ms`;
        // Closed aortic valve: aorta at or above LV.
        expect(h.aorta, where).toBeGreaterThanOrEqual(h.lv - 1e-9);
        // Open mitral valve: LA at or above LV.
        if (t <= rPeak || t >= mitralOpening)
          expect(h.la, where).toBeGreaterThanOrEqual(h.lv - 0.05);
        // Isovolumic phases: both valves shut, LV between LA and aorta.
        if ((t > rPeak && t < ejectionStart) || (t > aorticClosure && t < mitralOpening)) {
          expect(h.lv, where).toBeGreaterThanOrEqual(h.la);
          expect(h.lv, where).toBeLessThanOrEqual(h.aorta);
        }
      }
    }
  });

  it('has no atrial kick in volume when the atria do not contract', () => {
    const clock = createHeartClock({ atrialContribution: 0 });
    const beat = clock.beatAt(1600);
    const start = clock.hemodynamicsAt(beat.start).volume;
    expect(start).toBeCloseTo(100, 6);
  });

  it('rejects pressures that would keep a valve shut', () => {
    expect(() => createHeartClock({ lvSystolic: 85, aorticDiastolic: 80 })).toThrow(RangeError);
    expect(() => createHeartClock({ lvEndDiastolic: 35, aorticDiastolic: 40 })).toThrow(RangeError);
  });
});
