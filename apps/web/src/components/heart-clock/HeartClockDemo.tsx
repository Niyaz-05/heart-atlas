import {
  createHeartClock,
  paramRanges,
  type HeartParams,
  type Phase,
} from '@heart-atlas/heart-clock';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { drawEcg, ecgHeight, maxEcgWidth, readColors, windowMs } from './ecg-canvas.ts';
import { HeartSoundPlayer } from './heart-sounds.ts';
import { drawWiggers, readWiggersColors, wiggersHeight } from './wiggers-canvas.ts';
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
  'heartClock.soundOn',
  'heartClock.soundOff',
  'heartClock.wiggers.title',
  'heartClock.wiggers.label',
  'heartClock.wiggers.description',
  'heartClock.wiggers.pressure',
  'heartClock.wiggers.volume',
  'heartClock.wiggers.ecg',
  'heartClock.wiggers.lv',
  'heartClock.wiggers.aorta',
  'heartClock.wiggers.la',
  'heartClock.wiggers.lvVolume',
  'heartClock.wiggers.systole',
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
  const [soundOn, setSoundOn] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wiggersRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  // Clock time shown at the right edge of the strip. Starts one strip in, so the paused
  // first frame already shows a full trace.
  const nowRef = useRef(windowMs(maxEcgWidth));
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const audioRef = useRef<AudioContext | null>(null);
  // Set only while sound is on.
  const playerRef = useRef<HeartSoundPlayer | null>(null);

  const wiggersLabels = useMemo(
    () => ({
      pressure: t['heartClock.wiggers.pressure'],
      volume: t['heartClock.wiggers.volume'],
      ecg: t['heartClock.wiggers.ecg'],
    }),
    [t],
  );

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
    const wiggers = wiggersRef.current;
    const wiggersContext = wiggers?.getContext('2d');
    if (!canvas || !context || !wiggers || !wiggersContext || width === 0) return;

    for (const [element, ctx, height] of [
      [canvas, context, ecgHeight],
      [wiggers, wiggersContext, wiggersHeight],
    ] as const) {
      element.width = Math.round(width * dpr);
      element.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    let colors = readColors(canvas);
    let wiggersColors = readWiggersColors(wiggers);
    const scheme = window.matchMedia('(prefers-color-scheme: dark)');
    const onScheme = () => {
      colors = readColors(canvas);
      wiggersColors = readWiggersColors(wiggers);
      render();
    };
    scheme.addEventListener('change', onScheme);

    function render() {
      if (!context || !wiggersContext) return;
      drawEcg(context, width, nowRef.current, clock, colors);
      drawWiggers(wiggersContext, width, nowRef.current, clock, wiggersColors, wiggersLabels);
      setPhase(clock.sample(nowRef.current).phase);
    }

    let frame = 0;
    let last: number | undefined;
    const tick = (time: number) => {
      const step = last === undefined ? 0 : Math.min(maxFrameMs, time - last);
      last = time;
      nowRef.current += step * speedRef.current;
      render();
      playerRef.current?.schedule(clock, nowRef.current, speedRef.current);
      frame = requestAnimationFrame(tick);
    };
    render();
    if (playing) frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      scheme.removeEventListener('change', onScheme);
      playerRef.current?.cancel();
    };
  }, [clock, playing, width, dpr, wiggersLabels]);

  // Closes the audio context when the island goes away.
  useEffect(
    () => () => {
      void audioRef.current?.close();
    },
    [],
  );

  function changeHeartRate(value: number) {
    setHeartRate(value);
    const firstChanged = clock.setParams({ heartRate: value }, nowRef.current);
    playerRef.current?.cancel(firstChanged);
  }

  function changeSpeed(value: number) {
    setSpeed(value);
    // Queued sounds were timed for the old speed; the next frame queues them again.
    playerRef.current?.cancel();
  }

  // The audio context is created only here, on a click: browsers block sound before a gesture.
  // Everything up to resume() runs synchronously inside the click, so a quick second click
  // sees the player and turns sound off instead of starting a second one.
  function toggleSound() {
    const player = playerRef.current;
    if (player) {
      player.cancel();
      playerRef.current = null;
      setSoundOn(false);
      void audioRef.current?.suspend().catch(() => undefined);
      return;
    }
    // Safari: play through the silent switch, like a media player (not in the TS DOM types yet).
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
    if (session) session.type = 'playback';
    try {
      audioRef.current ??= new AudioContext();
    } catch {
      return; // No Web Audio: the button stays off.
    }
    void audioRef.current.resume().catch(() => undefined);
    playerRef.current = new HeartSoundPlayer(audioRef.current);
    setSoundOn(true);
    // Sound follows the trace, so turning it on also starts the trace.
    setPlaying(true);
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
        <button type="button" className={styles['play']} onClick={toggleSound}>
          {soundOn ? t['heartClock.soundOff'] : t['heartClock.soundOn']}
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
                onChange={() => changeSpeed(value)}
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
      <h2 className={styles['wiggers-title']}>{t['heartClock.wiggers.title']}</h2>
      <div className={styles['strip']} dir="ltr">
        <canvas
          ref={wiggersRef}
          className={styles['wiggers']}
          role="img"
          aria-label={t['heartClock.wiggers.label']}
          aria-describedby={`${id}-wiggers`}
          style={{ inlineSize: width ? `${width}px` : '100%', blockSize: `${wiggersHeight}px` }}
        />
      </div>
      <ul className={styles['legend']}>
        {(
          [
            ['lv', 'heartClock.wiggers.lv'],
            ['aorta', 'heartClock.wiggers.aorta'],
            ['la', 'heartClock.wiggers.la'],
            ['volume', 'heartClock.wiggers.lvVolume'],
            ['systole', 'heartClock.wiggers.systole'],
          ] as const
        ).map(([key, label]) => (
          <li key={key} data-series={key}>
            {t[label]}
          </li>
        ))}
      </ul>
      <p id={`${id}-wiggers`} className={styles['description']}>
        {t['heartClock.wiggers.description']}
      </p>
    </div>
  );
}
