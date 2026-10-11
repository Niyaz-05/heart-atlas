import { describe, expect, it } from 'vitest';
import { createHeartClock } from '../src/clock.ts';
import { soundEvents } from '../src/sounds.ts';

describe('soundEvents', () => {
  it('puts S1 at the R peak and S2 at aortic closure', () => {
    const clock = createHeartClock({ heartRate: 60 });
    const beat = clock.beatAt(2000);
    expect(soundEvents(beat)).toEqual([
      { sound: 'S1', time: 2000 + beat.timing.rPeak, beatIndex: 2 },
      { sound: 'S2', time: 2000 + beat.timing.aorticClosure, beatIndex: 2 },
    ]);
  });

  it('falls in systole: S1 starts isovolumic contraction, S2 ends ejection', () => {
    const clock = createHeartClock({ heartRate: 75 });
    const beat = clock.beatAt(0);
    const [s1, s2] = soundEvents(beat);
    expect(clock.sample(s1?.time ?? 0).phase).toBe('isovolumic-contraction');
    expect(clock.sample(s2?.time ?? 0).phase).toBe('isovolumic-relaxation');
    expect(clock.sample((s2?.time ?? 0) - 1).phase).toBe('ejection');
  });
});
