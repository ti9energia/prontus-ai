'use client';

import * as React from 'react';

/**
 * Living DNA double-helix — a fully-connected 2.5D canvas field behind the landing.
 *
 * Unlike a field of loose dots, this draws the two **continuous sugar-phosphate
 * backbones** as unbroken strands, the **base-pair rungs** linking them, and the
 * **atoms** at every node. Everything is collected into one list and depth-sorted,
 * so near geometry is thicker/brighter and actually occludes the far geometry — a
 * real 3D double helix that winds in front of and behind itself as it rotates and
 * falls. A breathing pulse keeps it alive.
 *
 * Theme-aware (vivid turquoise glow on dark, deep saturated turquoise on light, so
 * it never washes out). Honors reduced-motion (one still frame).
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

    const isDark = () => document.documentElement.classList.contains('dark');

    // Pre-rendered radial glow sprite for the atoms (cheap drawImage per node).
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
    const spriteTeal = makeSprite([
      [0, 'rgba(255,255,255,0.98)'],
      [0.28, 'rgba(150,245,238,0.9)'],
      [0.6, 'rgba(20,200,196,0.45)'],
      [1, 'rgba(20,200,196,0)'],
    ]);
    const spriteCyan = makeSprite([
      [0, 'rgba(255,255,255,0.98)'],
      [0.3, 'rgba(185,238,252,0.85)'],
      [0.62, 'rgba(34,211,238,0.4)'],
      [1, 'rgba(34,211,238,0)'],
    ]);
    const spriteDeep = makeSprite([
      [0, 'rgba(6,110,107,0.98)'],
      [0.4, 'rgba(20,200,196,0.6)'],
      [0.72, 'rgba(34,211,238,0.22)'],
      [1, 'rgba(20,200,196,0)'],
    ]);

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

    const TURN = 230; // px per full helix turn
    const STEP = 18; // px between base pairs (dense → smooth continuous strands)
    const t0 = performance.now();

    const edgeFade = (y: number) => Math.max(0, Math.min(1, Math.min(y, h - y) / (h * 0.15)));

    type Pt = { x: number; y: number; d: number }; // d = depth 0 (back) … 1 (front)
    type El =
      | { t: 'seg'; a: Pt; b: Pt; z: number; strand: 0 | 1 }
      | { t: 'rung'; a: Pt; b: Pt; z: number }
      | { t: 'node'; p: Pt; z: number; strand: 0 | 1 };

    const colorFor = (dark: boolean, strand: 0 | 1) =>
      dark
        ? strand === 0
          ? '20 200 196'
          : '34 211 238'
        : strand === 0
          ? '13 148 144'
          : '14 165 183';

    const frame = (now: number) => {
      const time = (now - t0) / 1000;
      ctx.clearRect(0, 0, w, h);
      const dark = isDark();
      const pulse = 0.92 + 0.08 * Math.sin(time * 1.4);
      const cx = w * 0.5;
      const R = Math.max(70, Math.min(165, w * 0.12));
      const fall = (time * 22 + scrollY * 0.12) % STEP;
      const spin = time * 0.42;
      const count = Math.ceil(h / STEP) + 6;

      // Sample the two strands along the height.
      const A: Pt[] = [];
      const B: Pt[] = [];
      for (let i = -3; i < count; i++) {
        const y = i * STEP - fall + STEP;
        const ang = (y / TURN) * Math.PI * 2 + spin;
        const za = Math.sin(ang);
        const zb = Math.sin(ang + Math.PI);
        A.push({ x: cx + Math.cos(ang) * R, y, d: (za + 1) / 2 });
        B.push({ x: cx + Math.cos(ang + Math.PI) * R, y, d: (zb + 1) / 2 });
      }

      // Collect connected geometry: backbone segments, base-pair rungs, atoms.
      const els: El[] = [];
      for (let i = 0; i < A.length - 1; i++) {
        els.push({ t: 'seg', a: A[i], b: A[i + 1], z: (A[i].d + A[i + 1].d) / 2, strand: 0 });
        els.push({ t: 'seg', a: B[i], b: B[i + 1], z: (B[i].d + B[i + 1].d) / 2, strand: 1 });
      }
      for (let i = 0; i < A.length; i++) {
        els.push({ t: 'rung', a: A[i], b: B[i], z: (A[i].d + B[i].d) / 2 });
        els.push({ t: 'node', p: A[i], z: A[i].d, strand: 0 });
        els.push({ t: 'node', p: B[i], z: B[i].d, strand: 1 });
      }

      // Depth sort → far geometry drawn first, near geometry occludes it (true 3D).
      els.sort((p, q) => p.z - q.z);

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = 'source-over';

      for (const el of els) {
        if (el.t === 'rung') {
          const y = (el.a.y + el.b.y) / 2;
          const fade = edgeFade(y);
          if (fade <= 0) continue;
          ctx.globalAlpha = (dark ? 0.05 + el.z * 0.16 : 0.08 + el.z * 0.22) * fade * pulse;
          ctx.strokeStyle = dark ? 'rgb(190 200 212)' : 'rgb(16 150 146)';
          ctx.lineWidth = 0.6 + el.z * 1.3;
          ctx.beginPath();
          ctx.moveTo(el.a.x, el.a.y);
          ctx.lineTo(el.b.x, el.b.y);
          ctx.stroke();
        } else if (el.t === 'seg') {
          const y = (el.a.y + el.b.y) / 2;
          const fade = edgeFade(y);
          if (fade <= 0) continue;
          const col = colorFor(dark, el.strand);
          const lw = 1.4 + el.z * 4.2; // thick in front, thin behind → 3D depth
          // Soft glow underlay for nearer segments (cheap halo, no shadowBlur).
          if (el.z > 0.4) {
            ctx.globalAlpha = (dark ? 0.1 : 0.06) * fade * el.z * pulse;
            ctx.strokeStyle = `rgb(${col})`;
            ctx.lineWidth = lw * 2.6;
            ctx.beginPath();
            ctx.moveTo(el.a.x, el.a.y);
            ctx.lineTo(el.b.x, el.b.y);
            ctx.stroke();
          }
          // Core strand.
          ctx.globalAlpha = (dark ? 0.22 + el.z * 0.55 : 0.32 + el.z * 0.5) * fade * pulse;
          ctx.strokeStyle = `rgb(${col})`;
          ctx.lineWidth = lw;
          ctx.beginPath();
          ctx.moveTo(el.a.x, el.a.y);
          ctx.lineTo(el.b.x, el.b.y);
          ctx.stroke();
        } else {
          const fade = edgeFade(el.p.y);
          if (fade <= 0) continue;
          const r = 1.6 + el.z * 4.4;
          const alpha = (dark ? 0.16 + el.z * 0.62 : 0.26 + el.z * 0.6) * fade * pulse;
          const s = r * 4.6;
          const sprite = dark ? (el.strand === 1 ? spriteCyan : spriteTeal) : spriteDeep;
          ctx.globalAlpha = alpha;
          ctx.drawImage(sprite, el.p.x - s / 2, el.p.y - s / 2, s, s);
        }
      }
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
