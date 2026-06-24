'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/** Ambient aurora field — blurred brand/accent orbs that drift and react to the pointer.
 *  Deliberately subtle + grain-overlaid to avoid the flat "AI gradient" look. */
export function Aurora({ className, interactive = true }: { className?: string; interactive?: boolean }) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!interactive) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--mx', `${x * 28}px`);
        el.style.setProperty('--my', `${y * 28}px`);
      });
    };
    window.addEventListener('pointermove', onMove);
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, [interactive]);

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      style={{ ['--mx' as string]: '0px', ['--my' as string]: '0px' }}
    >
      <div
        className="absolute -left-[10%] -top-[20%] h-[55vh] w-[55vh] rounded-full bg-brand-500/30 blur-[90px] animate-aurora"
        style={{ transform: 'translate(var(--mx), var(--my))' }}
      />
      <div
        className="absolute right-[2%] top-[-10%] h-[48vh] w-[48vh] rounded-full bg-brand-300/25 blur-[100px] animate-aurora"
        style={{ animationDelay: '-5s', transform: 'translate(calc(var(--mx) * -1), var(--my))' }}
      />
      <div
        className="absolute bottom-[-25%] left-[35%] h-[50vh] w-[50vh] rounded-full bg-accent-400/20 blur-[110px] animate-aurora"
        style={{ animationDelay: '-9s', transform: 'translate(var(--mx), calc(var(--my) * -1))' }}
      />
      {/* faint grid */}
      <div className="absolute inset-0 bg-grid bg-grid opacity-[0.5] mask-b" />
      {/* grain */}
      <div className="noise absolute inset-0" />
    </div>
  );
}
