/**
 * Parameters of the heart clock. Units: ms, mV, beats per minute.
 * Sources and model assumptions: docs/plans/2026-10-11-stage-2-heart-clock.md.
 */
export interface HeartParams {
  /** Mean heart rate, beats per minute. */
  heartRate: number;
  /** Beat-to-beat RR spread as a fraction of the mean RR (atrial fibrillation). */
  rrIrregularity: number;
  /** Seed of the RR generator, so irregular rhythms are reproducible. */
  seed: number;
  /** PR interval at 60 bpm, ms. Scales with √RR. */
  prInterval: number;
  /** QRS duration, ms. Does not depend on heart rate. */
  qrsDuration: number;
  /** QT interval at 60 bpm (QTc), ms. Scales with √RR. */
  qtc: number;
  /** Isovolumic relaxation time at 60 bpm, ms. Scales with √RR. */
  ivrt: number;
  /** P wave amplitude, mV. 0 removes the P wave. */
  pAmplitude: number;
  /** T wave amplitude, mV. Negative inverts the T wave. */
  tAmplitude: number;
  /** ST segment shift from the J point to the end of T, mV. */
  stShift: number;
  /** Amplitude of atrial fibrillation f waves, mV. 0 turns them off. */
  fWaveAmplitude: number;
  /** Frequency of f waves, Hz. */
  fWaveFrequency: number;
}

// assumption: defaults are model choices inside the normal ranges of StatPearls "Electrocardiogram"
// (PR 120–200 ms, QRS 60–100 ms, QT under 400–440 ms, T between 1/8 and 2/3 of R with R = 1 mV).
export const defaultParams: Readonly<HeartParams> = Object.freeze({
  heartRate: 75,
  rrIrregularity: 0,
  seed: 1,
  prInterval: 160,
  qrsDuration: 90,
  qtc: 400,
  ivrt: 80,
  pAmplitude: 0.15,
  tAmplitude: 0.3,
  stShift: 0,
  fWaveAmplitude: 0,
  fWaveFrequency: 6,
});

/** Inclusive [min, max] for every parameter. */
export const paramRanges: Readonly<Record<keyof HeartParams, readonly [number, number]>> = {
  heartRate: [40, 180],
  rrIrregularity: [0, 0.3],
  seed: [0, 0xffffffff],
  prInterval: [80, 300],
  qrsDuration: [40, 200],
  qtc: [250, 600],
  ivrt: [30, 150],
  pAmplitude: [-0.5, 0.5],
  tAmplitude: [-1, 1],
  stShift: [-0.5, 0.5],
  fWaveAmplitude: [0, 0.3],
  fWaveFrequency: [4, 10],
};

/** Merges a patch over `base` and checks every value; throws RangeError naming the parameter. */
export function resolveParams(
  patch: Partial<HeartParams> = {},
  base: Readonly<HeartParams> = defaultParams,
): HeartParams {
  const params = { ...base };
  for (const [key, value] of Object.entries(patch) as [keyof HeartParams, unknown][]) {
    if (!(key in paramRanges)) throw new RangeError(`Unknown heart clock parameter: ${key}`);
    if (value === undefined) continue;
    params[key] = value as number;
  }
  for (const key of Object.keys(paramRanges) as (keyof HeartParams)[]) {
    const value = params[key];
    const [min, max] = paramRanges[key];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
      throw new RangeError(`${key} must be a number from ${min} to ${max}, got ${String(value)}`);
    }
  }
  if (!Number.isInteger(params.seed)) {
    throw new RangeError(`seed must be an integer, got ${params.seed}`);
  }
  return params;
}
