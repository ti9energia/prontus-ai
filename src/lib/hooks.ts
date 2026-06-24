'use client';

import * as React from 'react';

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

/** Animate a number from 0 → target when `active` becomes true. */
export function useCountUp(target: number, active: boolean, duration = 1400) {
  const [value, setValue] = React.useState(0);
  const reduced = usePrefersReducedMotion();
  React.useEffect(() => {
    if (!active) return;
    if (reduced) {
      setValue(target);
      return;
    }
    let raf = 0;
    let start = 0;
    const tick = (t: number) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration, reduced]);
  return value;
}

/** IntersectionObserver-based "in view" flag (one-shot). */
export function useInView<T extends Element>(options?: IntersectionObserverInit) {
  const ref = React.useRef<T>(null);
  const [inView, setInView] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.25, ...options },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [options]);
  return { ref, inView };
}

/** Track a localStorage-backed boolean (e.g. session/auth flags). */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = React.useState<T>(initial);
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) setValue(JSON.parse(raw));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const set = React.useCallback(
    (v: T) => {
      setValue(v);
      try {
        localStorage.setItem(key, JSON.stringify(v));
      } catch {}
    },
    [key],
  );
  return [value, set] as const;
}
