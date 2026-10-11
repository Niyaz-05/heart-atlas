import {
  createHeartClock,
  paramRanges,
  type HeartParams,
  type Phase,
} from '@heart-atlas/heart-clock';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { drawEcg, ecgHeight, maxEcgWidth, readColors, windowMs } from './ecg-canvas.ts';
import styles from './HeartClockDemo.module.css';

export const heartClockMessageKeys = [
  'heartClock.play',
  'heartClock.pause',
  'heartClock.heartRate',
  'heartClock.speed',
  'heartClock.phase',
  'heartClock.phase.atrial-systole',
  'heartClock.phase.isovolumic-contraction',
  'heartClock.phase.ejection',
  'heartClock.phase.isovolumic-relaxation',
  'heartClock.phase.filling',
  'heartClock.ecgLabel',
  'heartClock.ecgDescription',
] as const;

export type HeartClockMessages = Record<(typeof heartClockMessageKeys)[number], string>;

export interface HeartClockDemoProps {
  /** Locale code from the registry, for number formatting. */
  locale: string;
  messages: HeartClockMessages;
  /** Clock parameters; disease presets will pass theirs here. */
  params?: Partial<HeartParams>;
}

const speeds = [0.25, 0.5, 1] as const;
/** Longest frame step, so a background tab does not jump the trace when it comes back. */
const maxFrameMs = 100;

export default function HeartClockDemo({ locale, messages: t, params }: HeartClockDemoProps) {
  const clock = useMemo(() => createHeartClock(params), [params]);
  const [heartRate, setHeartRate] = useState(clock.params.heartRate);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  const [phase, setPhase] = useState<Phase>('atrial-systole');
  const [width, setWidth] = useState(0);
  const [dpr, setDpr] = useState(1);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  // Clock time shown at the right edge of the strip. Starts one strip in, so the paused
  // first frame already shows a full trace.
  const nowRef = useRef(windowMs(maxEcgWidth));
  const speedRef = useRef(speed);
  speedRef.current = speed;

  const id = useId();
  const descriptionId = `${id}-description`;

  // Motion starts on its own unless the reader asked for reduced motion.
  useEffect(() => {
    setPlaying(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  // Redraws sharp after zooming or moving the window to a screen with another pixel ratio.
  useEffect(() => {
    const ratio = window.devicePixelRatio || 1;
    setDpr(ratio);
    const query = window.matchMedia(`(resolution: ${ratio}dppx)`);
    const onChange = () => setDpr(window.devicePixelRatio || 1);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [dpr]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.min(maxEcgWidth, Math.floor(entry.contentRect.width)));
    });
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  // Draws one frame now and, while playing, on every animation frame.
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context || width === 0) return;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(ecgHeight * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    let colors = readColors(canvas);
    const scheme = window.matchMedia('(prefers-color-scheme: dark)');
    const onScheme = () => {
      colors = readColors(canvas);
      render();
    };
    scheme.addEventListener('change', onScheme);

    function render() {
      if (!context) return;
      drawEcg(context, width, nowRef.current, clock, colors);
      setPhase(clock.sample(nowRef.current).phase);
    }

    let frame = 0;
    let last: number | undefined;
    const tick = (time: number) => {
      const step = last === undefined ? 0 : Math.min(maxFrameMs, time - last);
      last = time;
      nowRef.current += step * speedRef.current;
      render();
      frame = requestAnimationFrame(tick);
    };
    render();
    if (playing) frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      scheme.removeEventListener('change', onScheme);
    };
  }, [clock, playing, width, dpr]);

  function changeHeartRate(value: number) {
    setHeartRate(value);
    clock.setParams({ heartRate: value }, nowRef.current);
  }

  const [minRate, maxRate] = paramRanges.heartRate;
  const speedFormat = new Intl.NumberFormat(locale);
  const description = t['heartClock.ecgDescription'].replace('{rate}', String(heartRate));

  return (
    <div className={styles['demo']}>
      <div className={styles['controls']}>
        <button
          type="button"
          className={styles['play']}
          onClick={() => setPlaying((value) => !value)}
        >
          {playing ? t['heartClock.pause'] : t['heartClock.play']}
        </button>
        <div className={styles['rate']}>
          <label htmlFor={`${id}-rate`}>{t['heartClock.heartRate']}</label>
          <input
            id={`${id}-rate`}
            type="range"
            min={minRate}
            max={maxRate}
            step={1}
            value={heartRate}
            onChange={(event) => changeHeartRate(Number(event.currentTarget.value))}
          />
          <output htmlFor={`${id}-rate`}>{heartRate}</output>
        </div>
        <fieldset className={styles['speed']}>
          <legend>{t['heartClock.speed']}</legend>
          {speeds.map((value) => (
            <label key={value}>
              <input
                type="radio"
                name={`${id}-speed`}
                value={value}
                checked={speed === value}
                onChange={() => setSpeed(value)}
              />
              ×{speedFormat.format(value)}
            </label>
          ))}
        </fieldset>
      </div>
      <p className={styles['phase']}>
        {t['heartClock.phase']}:{' '}
        <strong data-phase={phase}>{t[`heartClock.phase.${phase}`]}</strong>
      </p>
      {/* ECG paper runs left to right in every language. */}
      <div ref={wrapperRef} className={styles['strip']} dir="ltr">
        <canvas
          ref={canvasRef}
          className={styles['ecg']}
          role="img"
          aria-label={t['heartClock.ecgLabel']}
          aria-describedby={descriptionId}
          style={{ inlineSize: width ? `${width}px` : '100%', blockSize: `${ecgHeight}px` }}
        />
      </div>
      <p id={descriptionId} className={styles['description']}>
        {description}
      </p>
    </div>
  );
}
