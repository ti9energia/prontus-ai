'use client';

import * as React from 'react';

/**
 * Living DNA double-helix — a real 2.5D canvas field behind the landing.
 *
 * Two strands of glowing "atoms" wind around a vertical axis. They rotate, fall
 * continuously, and are **depth-sorted**, so the strands genuinely pass in front
 * of and behind each other (atoms near the viewer are bigger and brighter; far
 * ones shrink and dim). Base pairs link the strands. A pre-rendered glow sprite
 * with additive blending keeps it cheap; scroll adds a parallax drift. Honors
 * reduced-motion (renders one still frame). Sits behind all content (-z-10).
 */
export function DnaHelix() {
  const ref = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let w = 0;
    let h = 0;
    let raf = 0;
    let scrollY = window.scrollY;

    // Pre-render a soft turquoise glow sprite (white-hot core → transparent edge).
    const SS = 64;
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = SS;
    const sctx = sprite.getContext('2d');
    if (sctx) {
      const g = sctx.createRadialGradient(SS / 2, SS / 2, 0, SS / 2, SS / 2, SS / 2);
      g.addColorStop(0, 'rgba(255,255,255,0.96)');
      g.addColorStop(0.22, 'rgba(170,248,243,0.85)');
      g.addColorStop(0.55, 'rgba(20,200,196,0.40)');
      g.addColorStop(1, 'rgba(20,200,196,0)');
      sctx.fillStyle = g;
      sctx.fillRect(0, 0, SS, SS);
    }

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const onScroll = () => {
      scrollY = window.scrollY;
    };
    window.addEventListener('resize', resize);
    window.addEventListener('scroll', onScroll, { passive: true });

    const TURN = 270; // px per full helix turn
    const STEP = 28; // px between base pairs
    const t0 = performance.now();

    type Atom = { x: number; y: number; depth: number };

    const edgeFade = (y: number) => Math.max(0, Math.min(1, Math.min(y, h - y) / (h * 0.18)));

    const frame = (now: number) => {
      const time = (now - t0) / 1000;
      ctx.clearRect(0, 0, w, h);
      const cx = w * 0.5;
      const R = Math.max(60, Math.min(140, w * 0.11));
      const fall = (time * 26 + scrollY * 0.12) % STEP;
      const spin = time * 0.5;
      const count = Math.ceil(h / STEP) + 4;

      const atoms: Atom[] = [];
      const links: { ax: number; bx: number; y: number; depth: number }[] = [];

      for (let i = -2; i < count; i++) {
        const y = i * STEP - fall + STEP;
        const ang = (y / TURN) * Math.PI * 2 + spin;
        const za = Math.sin(ang);
        const zb = Math.sin(ang + Math.PI);
        const ax = cx + Math.cos(ang) * R;
        const bx = cx + Math.cos(ang + Math.PI) * R;
        atoms.push({ x: ax, y, depth: (za + 1) / 2 });
        atoms.push({ x: bx, y, depth: (zb + 1) / 2 });
        links.push({ ax, bx, y, depth: (Math.max(za, zb) + 1) / 2 });
      }

      // Base-pair links — behind the atoms, depth-faded chrome.
      ctx.lineCap = 'round';
      for (const lk of links) {
        const a = (0.05 + lk.depth * 0.16) * edgeFade(lk.y);
        if (a <= 0) continue;
        ctx.globalAlpha = a;
        ctx.strokeStyle = 'rgb(197 204 214)';
        ctx.lineWidth = 0.5 + lk.depth * 1.4;
        ctx.beginPath();
        ctx.moveTo(lk.ax, lk.y);
        ctx.lineTo(lk.bx, lk.y);
        ctx.stroke();
      }

      // Atoms — depth-sorted back-to-front, additive glow.
      atoms.sort((p, q) => p.depth - q.depth);
      ctx.globalCompositeOperation = 'lighter';
      for (const at of atoms) {
        const fade = edgeFade(at.y);
        if (fade <= 0) continue;
        const r = 2 + at.depth * 6;
        const alpha = (0.12 + at.depth * 0.7) * fade;
        const s = r * 5;
        ctx.globalAlpha = alpha;
        ctx.drawImage(sprite, at.x - s / 2, at.y - s / 2, s, s);
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;

      if (!reduce) raf = requestAnimationFrame(frame);
    };

    if (reduce) frame(t0 + 1200);
    else raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 -z-10" />;
}
