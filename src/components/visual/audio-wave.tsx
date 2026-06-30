'use client';

import * as React from 'react';
import { usePrefersReducedMotion } from '@/lib/hooks';
import { cn } from '@/lib/utils';

/** Animated audio waveform on canvas. Smooth, GPU-friendly, theme-aware. */
export function AudioWave({
  active = true,
  className,
  color = '#14c8c4',
  bars = 48,
  height = 56,
}: {
  active?: boolean;
  className?: string;
  color?: string;
  bars?: number;
  height?: number;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;
    let t = 0;
    let visible = true;
    const phases = Array.from({ length: bars }, (_, i) => i * 0.45);

    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();

    const draw = () => {
      // Pause when offscreen or tab is hidden — saves CPU + battery.
      if (!visible || document.hidden) {
        raf = 0;
        return;
      }
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      const gap = w / bars;
      const bw = Math.max(2, gap * 0.42);
      for (let i = 0; i < bars; i++) {
        const base = active && !reduced ? Math.sin(t * 0.05 + phases[i]) * 0.5 + 0.5 : 0.12;
        const env = active && !reduced ? (0.4 + 0.6 * Math.abs(Math.sin(t * 0.02 + i * 0.2))) : 0.3;
        const amp = (0.12 + base * env) * h;
        const x = i * gap + (gap - bw) / 2;
        const y = (h - amp) / 2;
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.35 + base * 0.55;
        const r = bw / 2;
        // rounded bar
        ctx.beginPath();
        ctx.moveTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.arcTo(x + bw, y, x + bw, y + r, r);
        ctx.lineTo(x + bw, y + amp - r);
        ctx.arcTo(x + bw, y + amp, x + bw - r, y + amp, r);
        ctx.arcTo(x, y + amp, x, y + amp - r, r);
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      t += 1;
      raf = requestAnimationFrame(draw);
    };

    const resume = () => {
      if (visible && !document.hidden && raf === 0) {
        raf = requestAnimationFrame(draw);
      }
    };

    // Pause when the canvas scrolls off-screen.
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) resume();
      },
      { threshold: 0.1 },
    );
    observer.observe(canvas);

    document.addEventListener('visibilitychange', resume);

    draw();
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', resume);
      observer.disconnect();
    };
  }, [active, color, bars, reduced]);

  return <canvas ref={canvasRef} className={cn('w-full', className)} style={{ height }} />;
}
