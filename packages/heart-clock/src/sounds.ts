import type { Beat } from './clock.ts';

export type HeartSound = 'S1' | 'S2';

export interface SoundEvent {
  sound: HeartSound;
  /** Absolute clock time, ms. */
  time: number;
  beatIndex: number;
}

/**
 * Heart sounds of a beat: S1 when the mitral valve closes (the model puts it at the R peak) and
 * S2 when the aortic valve closes (StatPearls, "Physiology, Cardiac Cycle").
 */
export function soundEvents(beat: Beat): SoundEvent[] {
  return [
    { sound: 'S1', time: beat.start + beat.timing.rPeak, beatIndex: beat.index },
    { sound: 'S2', time: beat.start + beat.timing.aorticClosure, beatIndex: beat.index },
  ];
}
