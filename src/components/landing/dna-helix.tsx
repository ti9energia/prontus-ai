'use client';

import * as React from 'react';

/**
 * Living DNA double-helix — a real 2.5D canvas field behind the landing.
 *
 * Two strands of glowing "atoms" wind around a vertical axis: they rotate, fall
 * continuously, and are **depth-sorted**, so the strands genuinely pass in front
 * of and behind each other (near atoms grow brighter, far ones shrink and dim),
 * linked by molecular base-pair "rungs". A subtle breathing pulse keeps it alive.
 *
 * **Theme-aware** so it stays vivid in both modes: on dark it uses additive
 * turquoise/cyan glow; on light it switches to a normal blend with deep, saturated
 * turquoise so it never washes out. Honors reduced-motion (one still frame).
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

    // Pre-render glow sprites once (cheap drawImage per atom afterwards).
    const makeSprite = (stops: [number, string][]) => {
      const SS = 64;
      const s = document.createElement('canvas');
      s.width = s.height = SS;
      const c = s.getContext('2d');
      if (c) {
        const g = c.createRadialGradient(SS / 2, SS / 2, 0, SS / 2, SS / 2, SS / 2);
        for (const [o, col] of stops) g.addColorStop(o, col);
        c.fillStyle = g;
        c.fillRect(0, 0, SS, SS);
      }
      return s;
    };
    // Dark theme: white-hot turquoise + cyan (additive blend).
    const spriteTeal = makeSprite([
      [0, 'rgba(255,255,255,0.96)'],
      [0.22, 'rgba(170,248,243,0.85)'],
      [0.55, 'rgba(20,200,196,0.40)'],
      [1, 'rgba(20,200,196,0)'],
    ]);
    const spriteCyan = makeSprite([
      [0, 'rgba(255,255,255,0.95)'],
      [0.25, 'rgba(190,240,252,0.80)'],
      [0.6, 'rgba(34,211,238,0.38)'],
      [1, 'rgba(34,211,238,0)'],
    ]);
    // Light theme: deep saturated turquoise/teal (normal blend over white).
    const spriteDeep = makeSprite([
      [0, 'rgba(8,120,116,0.95)'],
      [0.35, 'rgba(20,200,196,0.62)'],
      [0.7, 'rgba(34,211,238,0.24)'],
      [1, 'rgba(20,200,196,0)'],
    ]);

    const isDark = () => document.documentElement.classList.contains('dark');

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

    const TURN = 250; // px per full helix turn
    const STEP = 22; // px between base pairs (denser = more "alive")
    const t0 = performance.now();

    const edgeFade = (y: number) => Math.max(0, Math.min(1, Math.min(y, h - y) / (h * 0.16)));

    const frame = (now: number) => {
      const time = (now - t0) / 1000;
      ctx.clearRect(0, 0, w, h);
      const dark = isDark();
      const pulse = 0.9 + 0.1 * Math.sin(time * 1.4); // gentle breathing
      const cx = w * 0.5;
      const R = Math.max(64, Math.min(150, w * 0.115));
      const fall = (time * 24 + scrollY * 0.12) % STEP;
      const spin = time * 0.45;
      const count = Math.ceil(h / STEP) + 4;

      type Atom = { x: number; y: number; depth: number; strand: 0 | 1 };
      const atoms: Atom[] = [];
      const links: { ax: number; bx: number; y: number; depth: number }[] = [];

      for (let i = -2; i < count; i++) {
        const y = i * STEP - fall + STEP;
        const ang = (y / TURN) * Math.PI * 2 + spin;
        const za = Math.sin(ang);
        const zb = Math.sin(ang + Math.PI);
        const ax = cx + Math.cos(ang) * R;
        const bx = cx + Math.cos(ang + Math.PI) * R;
        atoms.push({ x: ax, y, depth: (za + 1) / 2, strand: 0 });
        atoms.push({ x: bx, y, depth: (zb + 1) / 2, strand: 1 });
        links.push({ ax, bx, y, depth: (Math.max(za, zb) + 1) / 2 });
      }

      // Molecular base-pair links — behind the atoms, depth-faded.
      ctx.lineCap = 'round';
      for (const lk of links) {
        const fade = edgeFade(lk.y);
        if (fade <= 0) continue;
        const a = (dark ? 0.06 + lk.depth * 0.18 : 0.1 + lk.depth * 0.26) * fade * pulse;
        ctx.globalAlpha = a;
        ctx.strokeStyle = dark ? 'rgb(197 204 214)' : 'rgb(16 150 146)';
        ctx.lineWidth = 0.5 + lk.depth * 1.6;
        ctx.beginPath();
        ctx.moveTo(lk.ax, lk.y);
        ctx.lineTo(lk.bx, lk.y);
        ctx.stroke();
      }

      // Atoms — depth-sorted back-to-front; blend depends on theme.
      atoms.sort((p, q) => p.depth - q.depth);
      ctx.globalCompositeOperation = dark ? 'lighter' : 'source-over';
      for (const at of atoms) {
        const fade = edgeFade(at.y);
        if (fade <= 0) continue;
        const r = 2 + at.depth * 6.5;
        const baseAlpha = dark ? 0.12 + at.depth * 0.7 : 0.2 + at.depth * 0.66;
        const alpha = baseAlpha * fade * pulse;
        const s = r * 5;
        const sprite = dark ? (at.strand === 1 ? spriteCyan : spriteTeal) : spriteDeep;
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
