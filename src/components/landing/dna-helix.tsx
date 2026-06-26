'use client';

import * as React from 'react';

/**
 * Living DNA double-helix — a clean, recognizable 3D double helix behind the landing.
 *
 * Two smooth sugar-phosphate backbones wind around a vertical axis as continuous
 * tubes (thicker and brighter in front, thinner and dimmer behind); regular base-pair
 * rungs step between them like the rungs of a twisted ladder; and shaded spherical
 * atoms sit at each pair. Everything is depth-sorted, so the strands cross over and
 * behind each other as the helix rotates and gently falls — the classic twisted
 * ladder, alive. Theme-aware (vivid on dark, deep saturated on light); honors
 * reduced-motion (one still frame).
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

    // Pre-rendered shaded sphere sprites (bright core → colored body → dark rim → clear).
    const makeSphere = (light: string, body: string, rim: string) => {
      const SS = 48;
      const s = document.createElement('canvas');
      s.width = s.height = SS;
      const c = s.getContext('2d');
      if (c) {
        const g = c.createRadialGradient(SS * 0.38, SS * 0.36, SS * 0.04, SS / 2, SS / 2, SS / 2);
        g.addColorStop(0, 'rgba(255,255,255,0.96)');
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

    const TURN = 300; // px per full turn (elegant, readable twist)
    const STEP = 13; // dense sampling → smooth strand tubes
    const RUNG_EVERY = 3; // a base pair (rung + atoms) every N samples
    const t0 = performance.now();
    const edgeFade = (y: number) => Math.max(0, Math.min(1, Math.min(y, h - y) / (h * 0.14)));

    type Pt = { x: number; y: number; d: number };
    type El =
      | { t: 'seg'; a: Pt; b: Pt; z: number; strand: 0 | 1 }
      | { t: 'rung'; a: Pt; b: Pt; z: number }
      | { t: 'atom'; p: Pt; z: number; strand: 0 | 1 };

    const frame = (now: number) => {
      const time = (now - t0) / 1000;
      ctx.clearRect(0, 0, w, h);
      const dark = isDark();
      const pulse = 0.94 + 0.06 * Math.sin(time * 1.3);
      const cx = w * 0.5;
      const R = Math.max(96, Math.min(190, w * 0.13));
      const fall = (time * 20 + scrollY * 0.1) % STEP;
      const spin = time * 0.4;
      const count = Math.ceil(h / STEP) + 8;

      const A: Pt[] = [];
      const B: Pt[] = [];
      for (let i = -4; i < count; i++) {
        const y = i * STEP - fall + STEP;
        const ang = (y / TURN) * Math.PI * 2 + spin;
        A.push({ x: cx + Math.sin(ang) * R, y, d: (Math.cos(ang) + 1) / 2 });
        B.push({ x: cx + Math.sin(ang + Math.PI) * R, y, d: (Math.cos(ang + Math.PI) + 1) / 2 });
      }

      // Connected geometry: backbone segments (every sample), rungs + atoms (spaced).
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
      // Depth sort → far drawn first, near occludes it (true 3D twist).
      els.sort((p, q) => p.z - q.z);

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (const el of els) {
        if (el.t === 'rung') {
          const y = (el.a.y + el.b.y) / 2;
          const fade = edgeFade(y);
          if (fade <= 0) continue;
          ctx.globalAlpha = (dark ? 0.16 + el.z * 0.26 : 0.18 + el.z * 0.28) * fade * pulse;
          ctx.strokeStyle = dark ? 'rgb(176 190 205)' : 'rgb(20 150 146)';
          ctx.lineWidth = 1 + el.z * 2.2;
          ctx.beginPath();
          ctx.moveTo(el.a.x, el.a.y);
          ctx.lineTo(el.b.x, el.b.y);
          ctx.stroke();
        } else if (el.t === 'seg') {
          const y = (el.a.y + el.b.y) / 2;
          const fade = edgeFade(y);
          if (fade <= 0) continue;
          const teal = el.strand === 0;
          const col = dark ? (teal ? '20 200 196' : '34 211 238') : teal ? '13 148 144' : '14 165 183';
          const lw = 2.4 + el.z * 5.5; // strong depth: fat in front, thin behind
          if (el.z > 0.4) {
            // soft halo for the near strand (cheap glow, no shadowBlur)
            ctx.globalAlpha = (dark ? 0.12 : 0.08) * fade * el.z * pulse;
            ctx.strokeStyle = `rgb(${col})`;
            ctx.lineWidth = lw * 2.4;
            ctx.beginPath();
            ctx.moveTo(el.a.x, el.a.y);
            ctx.lineTo(el.b.x, el.b.y);
            ctx.stroke();
          }
          ctx.globalAlpha = (dark ? 0.4 + el.z * 0.55 : 0.45 + el.z * 0.5) * fade * pulse;
          ctx.strokeStyle = `rgb(${col})`;
          ctx.lineWidth = lw;
          ctx.beginPath();
          ctx.moveTo(el.a.x, el.a.y);
          ctx.lineTo(el.b.x, el.b.y);
          ctx.stroke();
        } else {
          const fade = edgeFade(el.p.y);
          if (fade <= 0) continue;
          const r = 4 + el.z * 9; // atom radius grows toward the viewer
          const alpha = (0.55 + el.z * 0.45) * fade * pulse;
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
