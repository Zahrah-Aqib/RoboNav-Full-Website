import { useState, useEffect, useRef, useCallback } from 'react';

export type PlayState = 'idle' | 'playing' | 'paused' | 'done';

/**
 * Frame-based playback shared by the Simulator and Comparison pages.
 * `speed` is frames per second-ish multiplier (1 = slow, 10 = fast).
 */
export function usePlayback(totalFrames: number, speed: number) {
  const [frame, setFrame] = useState(0);
  const [state, setState] = useState<PlayState>('idle');
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  const interval = Math.max(16, 700 / speed);

  const play = useCallback(() => {
    setState((s) => (s === 'done' ? 'playing' : s === 'idle' ? 'playing' : s));
    if (state === 'done') setFrame(0);
    setState('playing');
  }, [state]);

  const pause = useCallback(() => {
    setState((s) => (s === 'playing' ? 'paused' : s));
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setFrame(0);
  }, []);

  const stepForward = useCallback(() => {
    setState((s) => (s === 'playing' ? 'paused' : s));
    setFrame((f) => {
      const next = Math.min(f + 1, totalFrames);
      if (next >= totalFrames) setState('done');
      return next;
    });
  }, [totalFrames]);

  const stepBack = useCallback(() => {
    setState((s) => (s === 'playing' ? 'paused' : s));
    setFrame((f) => Math.max(0, f - 1));
  }, []);

  const goTo = useCallback((n: number) => {
    setState((s) => (s === 'playing' ? 'paused' : s));
    setFrame(() => {
      const next = Math.max(0, Math.min(n, totalFrames));
      if (next >= totalFrames && totalFrames > 0) setState('done');
      else if (next < totalFrames) setState((s) => (s === 'done' ? 'paused' : s));
      return next;
    });
  }, [totalFrames]);

  // Advance animation while playing.
  useEffect(() => {
    if (state !== 'playing') return;
    const tick = (t: number) => {
      if (t - lastTickRef.current >= interval) {
        lastTickRef.current = t;
        setFrame((f) => {
          if (f + 1 >= totalFrames) {
            setState('done');
            return totalFrames;
          }
          return f + 1;
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [state, interval, totalFrames]);

  // Reset frame count when the frame count itself changes (new map/run).
  useEffect(() => {
    setFrame(0);
    setState('idle');
  }, [totalFrames]);

  return {
    frame,
    state,
    play,
    pause,
    reset,
    stepForward,
    stepBack,
    goTo,
    progress: totalFrames === 0 ? 0 : frame / totalFrames,
  };
}
