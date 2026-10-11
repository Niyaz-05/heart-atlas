import { beatWaves, fWaves } from './ecg.ts';
import { paramRanges, resolveParams, type HeartParams } from './params.ts';
import { beatTiming, phaseAt, type BeatTiming, type Phase } from './timing.ts';

export interface Beat {
  /** 0 for the first beat of the clock. */
  index: number;
  /** Absolute clock time of the P wave onset, ms. */
  start: number;
  rr: number;
  timing: BeatTiming;
  /** Parameters this beat was built with; `setParams` affects only later beats. */
  params: HeartParams;
}

export interface ClockSample {
  beat: Beat;
  /** Time since the start of the beat, ms. */
  tInBeat: number;
  phase: Phase;
  /** ECG, mV. */
  ecg: number;
}

export interface HeartClock {
  /** Parameters for beats that have not started yet. */
  readonly params: HeartParams;
  /** Applies a patch from the first beat that starts after `t`. Throws RangeError if invalid. */
  setParams(patch: Partial<HeartParams>, t: number): void;
  beatAt(t: number): Beat;
  /** Beats that overlap [from, to]. */
  beatsBetween(from: number, to: number): Beat[];
  sample(t: number): ClockSample;
  ecgAt(t: number): number;
}

/** How far back beats are kept, ms. */
export const historyMs = 10_000;
/** Beats kept after the one that contains the latest queried time. */
const lookAheadBeats = 2;

const minRr = 60000 / paramRanges.heartRate[1];
const maxRr = 60000 / paramRanges.heartRate[0];

/** Uniform number in [0, 1) from a seed and a beat index; the same inputs give the same number. */
function unitRandom(seed: number, index: number): number {
  let x = (seed ^ Math.imul(index + 1, 0x9e3779b9)) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 2 ** 32;
}

function clampRr(rr: number): number {
  return Math.min(maxRr, Math.max(minRr, rr));
}

function rrFor(params: HeartParams, index: number): number {
  const mean = 60000 / params.heartRate;
  const spread = params.rrIrregularity * (2 * unitRandom(params.seed, index) - 1);
  return clampRr(mean * (1 + spread));
}

/**
 * Checks that every RR the parameters can produce fits the cardiac cycle, so an invalid
 * combination fails when it is set, not in the middle of playback.
 */
export function checkParams(params: HeartParams): void {
  const mean = 60000 / params.heartRate;
  const low = clampRr(mean * (1 - params.rrIrregularity));
  const high = clampRr(mean * (1 + params.rrIrregularity));
  const steps = low === high ? 0 : 32;
  for (let i = 0; i <= steps; i += 1) beatTiming(low + ((high - low) * i) / (steps || 1), params);
}

export function createHeartClock(initial: Partial<HeartParams> = {}): HeartClock {
  let params = resolveParams(initial);
  checkParams(params);
  const beats: Beat[] = [];

  function makeBeat(index: number, start: number): Beat {
    const rr = rrFor(params, index);
    return { index, start, rr, timing: beatTiming(rr, params), params };
  }

  function checkTime(t: number): void {
    if (!Number.isFinite(t) || t < 0) throw new RangeError(`Clock time must be ≥ 0, got ${t}`);
    const first = beats[0];
    if (first && t < first.start) {
      throw new RangeError(`Clock time ${t} ms is older than the kept history`);
    }
  }

  /** Index in `beats` of the beat that contains `t`, extending the schedule as needed. */
  function locate(t: number): number {
    checkTime(t);
    if (beats.length === 0) beats.push(makeBeat(0, 0));
    for (;;) {
      const last = beats[beats.length - 1] as Beat;
      if (last.start > t && beats.filter((b) => b.start > t).length >= lookAheadBeats) break;
      beats.push(makeBeat(last.index + 1, last.start + last.rr));
    }
    while ((beats[0] as Beat).start + (beats[0] as Beat).rr < t - historyMs) beats.shift();
    return beats.findIndex((b) => t < b.start + b.rr);
  }

  function beatAt(t: number): Beat {
    return beats[locate(t)] as Beat;
  }

  function ecgAt(t: number): number {
    const i = locate(t);
    const beat = beats[i] as Beat;
    let value = fWaves(t, beat.params);
    for (const b of [beats[i - 1], beat, beats[i + 1]]) {
      if (b) value += beatWaves(t - b.start, b.timing, b.params);
    }
    return value;
  }

  return {
    get params() {
      return params;
    },
    setParams(patch, t) {
      const next = resolveParams(patch, params);
      checkParams(next);
      const current = locate(t);
      params = next;
      beats.splice(current + 1);
    },
    beatAt,
    beatsBetween(from, to) {
      locate(to);
      locate(from);
      return beats.filter((b) => b.start <= to && b.start + b.rr >= from);
    },
    sample(t) {
      const beat = beatAt(t);
      const tInBeat = t - beat.start;
      return { beat, tInBeat, phase: phaseAt(tInBeat, beat.timing), ecg: ecgAt(t) };
    },
    ecgAt,
  };
}
