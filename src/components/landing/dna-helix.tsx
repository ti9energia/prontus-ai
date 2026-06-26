'use client';

import * as React from 'react';

/**
 * Living DNA double-helix — a thick, natural, fluid 3D double helix behind the landing.
 *
 * Two chunky sugar-phosphate backbones wind around a vertical axis as smooth glowing
 * tubes (with a sheen highlight for cylinder volume — fat and bright in front, thin and
 * dim behind). Between them, two-tone base pairs meet in the middle like real A-T / G-C
 * bonds, and a shaded spherical atom sits at each pair. Everything is depth-sorted, so
 * the strands genuinely cross over and behind each other as the helix rotates and slowly
 * falls. Theme-aware (vivid on dark, deep saturated on light); honors reduced-motion.
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

    // Pre-rendered shaded sphere sprites (bright offset core → body → dark rim → clear).
    const makeSphere = (light: string, body: string, rim: string) => {
      const SS = 48;
      const s = document.createElement('canvas');
      s.width = s.height = SS;
      const c = s.getContext('2d');
      if (c) {
        const g = c.createRadialGradient(SS * 0.38, SS * 0.35, SS * 0.04, SS / 2, SS / 2, SS / 2);
        g.addColorStop(0, 'rgba(255,255,255,0.97)');
        g.addColorStop(0.3, light);
        g.addColorStop(0.72, body);
        g.addColorStop(0.96, rim);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = g;
        c.beginPath();
        c.arc(SS / 2, SS / 2, SS / 2, 0, Math.PI * 2);
        c.fill();
      }
      return s;
    };
    const sphereTeal = makeSphere('rgba(150,245,238,0.95)', 'rgba(20,200,196,0.92)', 'rgba(7,110,107,0.85)');
    const sphereCyan = makeSphere('rgba(185,238,252,0.95)', 'rgba(34,211,238,0.92)', 'rgba(12,110,130,0.85)');
    const sphereDeepA = makeSphere('rgba(70,210,204,0.95)', 'rgba(13,148,144,0.95)', 'rgba(5,80,78,0.9)');
    const sphereDeepB = makeSphere('rgba(90,205,228,0.95)', 'rgba(14,165,183,0.95)', 'rgba(6,90,104,0.9)');

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

    const TURN = 320; // px per full turn (elegant, readable twist)
    const STEP = 12; // dense sampling → smooth, fluid strand tubes
    const RUNG_EVERY = 3; // a base pair (rung + atoms) every N samples
    const t0 = performance.now();
    const edgeFade = (y: number) => Math.max(0, Math.min(1, Math.min(y, h - y) / (h * 0.14)));

    const tealCol = (dark: boolean) => (dark ? '20 200 196' : '13 148 144');
    const cyanCol = (dark: boolean) => (dark ? '34 211 238' : '14 165 183');

    type Pt = { x: number; y: number; d: number };
    type El =
      | { t: 'seg'; a: Pt; b: Pt; z: number; strand: 0 | 1 }
      | { t: 'rung'; a: Pt; b: Pt; z: number }
      | { t: 'atom'; p: Pt; z: number; strand: 0 | 1 };

    const frame = (now: number) => {
      const time = (now - t0) / 1000;
      ctx.clearRect(0, 0, w, h);
      const dark = isDark();
      const pulse = 0.95 + 0.05 * Math.sin(time * 1.2);
      const cx = w * 0.5;
      const R = Math.max(110, Math.min(210, w * 0.14));
      const fall = (time * 18 + scrollY * 0.1) % STEP;
      const spin = time * 0.36;
      const count = Math.ceil(h / STEP) + 8;

      const A: Pt[] = [];
      const B: Pt[] = [];
      for (let i = -4; i < count; i++) {
        const y = i * STEP - fall + STEP;
        const ang = (y / TURN) * Math.PI * 2 + spin;
        A.push({ x: cx + Math.sin(ang) * R, y, d: (Math.cos(ang) + 1) / 2 });
        B.push({ x: cx + Math.sin(ang + Math.PI) * R, y, d: (Math.cos(ang + Math.PI) + 1) / 2 });
      }

      const els: El[] = [];
      for (let i = 0; i < A.length - 1; i++) {
        els.push({ t: 'seg', a: A[i], b: A[i + 1], z: (A[i].d + A[i + 1].d) / 2, strand: 0 });
        els.push({ t: 'seg', a: B[i], b: B[i + 1], z: (B[i].d + B[i + 1].d) / 2, strand: 1 });
        if (i % RUNG_EVERY === 0) {
          els.push({ t: 'rung', a: A[i], b: B[i], z: (A[i].d + B[i].d) / 2 });
          els.push({ t: 'atom', p: A[i], z: A[i].d, strand: 0 });
          els.push({ t: 'atom', p: B[i], z: B[i].d, strand: 1 });
        }
      }
      // Depth sort → far drawn first, near occludes it (real 3D twist).
      els.sort((p, q) => p.z - q.z);

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (const el of els) {
        if (el.t === 'rung') {
          const fade = edgeFade(el.a.y);
          if (fade <= 0) continue;
          const mx = (el.a.x + el.b.x) / 2;
          const my = (el.a.y + el.b.y) / 2;
          ctx.lineWidth = 1.8 + el.z * 3.4;
          ctx.globalAlpha = (dark ? 0.16 + el.z * 0.26 : 0.18 + el.z * 0.3) * fade * pulse;
          // two-tone base pair meeting in the middle
          ctx.strokeStyle = `rgb(${tealCol(dark)})`;
          ctx.beginPath();
          ctx.moveTo(el.a.x, el.a.y);
          ctx.lineTo(mx, my);
          ctx.stroke();
          ctx.strokeStyle = `rgb(${cyanCol(dark)})`;
          ctx.beginPath();
          ctx.moveTo(mx, my);
          ctx.lineTo(el.b.x, el.b.y);
          ctx.stroke();
        } else if (el.t === 'seg') {
          const fade = edgeFade((el.a.y + el.b.y) / 2);
          if (fade <= 0) continue;
          const teal = el.strand === 0;
          const col = teal ? tealCol(dark) : cyanCol(dark);
          const lw = 4 + el.z * 11; // thick tube: fat in front, thin behind
          // outer halo (cheap glow)
          if (el.z > 0.35) {
            ctx.globalAlpha = (dark ? 0.1 : 0.07) * fade * el.z * pulse;
            ctx.strokeStyle = `rgb(${col})`;
            ctx.lineWidth = lw * 2.1;
            ctx.beginPath();
            ctx.moveTo(el.a.x, el.a.y);
            ctx.lineTo(el.b.x, el.b.y);
            ctx.stroke();
          }
          // tube body
          ctx.globalAlpha = (dark ? 0.45 + el.z * 0.5 : 0.5 + el.z * 0.45) * fade * pulse;
          ctx.strokeStyle = `rgb(${col})`;
          ctx.lineWidth = lw;
          ctx.beginPath();
          ctx.moveTo(el.a.x, el.a.y);
          ctx.lineTo(el.b.x, el.b.y);
          ctx.stroke();
          // sheen highlight (cylinder volume) for the nearer half
          if (el.z > 0.5) {
            ctx.globalAlpha = 0.22 * (el.z - 0.5) * 2 * fade * pulse;
            ctx.strokeStyle = 'rgba(255,255,255,0.92)';
            ctx.lineWidth = lw * 0.32;
            ctx.beginPath();
            ctx.moveTo(el.a.x, el.a.y - lw * 0.2);
            ctx.lineTo(el.b.x, el.b.y - lw * 0.2);
            ctx.stroke();
          }
        } else {
          const fade = edgeFade(el.p.y);
          if (fade <= 0) continue;
          const r = 5 + el.z * 10; // atom radius grows toward the viewer
          const alpha = (0.6 + el.z * 0.4) * fade * pulse;
          const sprite = dark
            ? el.strand === 1
              ? sphereCyan
              : sphereTeal
            : el.strand === 1
              ? sphereDeepB
              : sphereDeepA;
          ctx.globalAlpha = alpha;
          ctx.drawImage(sprite, el.p.x - r, el.p.y - r, r * 2, r * 2);
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
