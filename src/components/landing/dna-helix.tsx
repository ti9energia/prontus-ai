'use client';

import * as React from 'react';

/**
 * Living DNA double-helix — a realistic, multi-colour B-DNA that spins on its own and
 * travels as you scroll, like you're moving down the molecule. Two antiparallel sugar-
 * phosphate backbones wind as glowing tubes (cyan + violet); between them the base pairs
 * are colour-coded like a real molecular render — emerald / amber / rose / sky for the
 * four "bases" — and foreshorten correctly as the ladder turns edge-on. Atoms sit at each
 * rung end, a faint field of motes drifts behind for depth, and everything is depth-sorted
 * so the strands cross in front of and behind one another as the column rotates.
 *
 * Motion: a CONTINUOUS global index (`gi`) makes the rungs slide smoothly forever (no
 * per-loop jump/flicker). Idle = a slow spin + drift; SCROLL drives extra rotation AND
 * vertical travel, so scrolling reads as gliding along the helix. Additive bloom in dark,
 * sober ink in light. A soft pointer parallax tilts it toward the cursor. Honors
 * reduced-motion, and it lives behind the hero only (occluded below — see page.tsx).
 */
export function DnaHelix() {
  const ref = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let w = 0;
    let h = 0;
    let raf = 0;
    let scrollY = window.scrollY;
    const isDark = () => document.documentElement.classList.contains('dark');

    /* ---- sprite cache: shaded atom bead + soft additive halo ---- */
    const makeBead = (light: string, body: string, rim: string) => {
      const SS = 56;
      const s = document.createElement('canvas');
      s.width = s.height = SS;
      const c = s.getContext('2d');
      if (c) {
        const g = c.createRadialGradient(SS * 0.37, SS * 0.34, SS * 0.03, SS / 2, SS / 2, SS / 2);
        g.addColorStop(0, 'rgba(255,255,255,0.95)');
        g.addColorStop(0.3, light);
        g.addColorStop(0.7, body);
        g.addColorStop(0.95, rim);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = g;
        c.beginPath();
        c.arc(SS / 2, SS / 2, SS / 2, 0, Math.PI * 2);
        c.fill();
      }
      return s;
    };
    const makeHalo = (rgb: string) => {
      const SS = 72;
      const s = document.createElement('canvas');
      s.width = s.height = SS;
      const c = s.getContext('2d');
      if (c) {
        const g = c.createRadialGradient(SS / 2, SS / 2, 0, SS / 2, SS / 2, SS / 2);
        g.addColorStop(0, `rgba(${rgb},0.85)`);
        g.addColorStop(0.35, `rgba(${rgb},0.34)`);
        g.addColorStop(1, `rgba(${rgb},0)`);
        c.fillStyle = g;
        c.beginPath();
        c.arc(SS / 2, SS / 2, SS / 2, 0, Math.PI * 2);
        c.fill();
      }
      return s;
    };

    // Strand A = cyan, strand B = violet (the two antiparallel backbones).
    const beadCyan = makeBead('rgba(200,245,255,0.95)', 'rgba(56,210,245,0.92)', 'rgba(10,110,135,0.85)');
    const beadViolet = makeBead('rgba(226,216,255,0.95)', 'rgba(162,132,250,0.92)', 'rgba(70,50,140,0.85)');
    const haloCyan = makeHalo('120 230 250');
    const haloViolet = makeHalo('180 160 255');

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

    /* ---- soft pointer parallax (eased toward the cursor) ---- */
    let tx = 0;
    let ty = 0; // target, normalized [-1,1]
    let px = 0;
    let py = 0; // current, eased
    const onPointer = (e: PointerEvent) => {
      tx = (e.clientX / w) * 2 - 1;
      ty = (e.clientY / h) * 2 - 1;
    };
    if (finePointer && !reduce) window.addEventListener('pointermove', onPointer, { passive: true });

    // Pause the rAF loop while the tab is hidden — saves CPU + battery.
    const onVisibility = () => {
      if (!document.hidden && raf === 0 && !reduce) {
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    /* ---- ambient depth motes ---- */
    type Mote = { x: number; y: number; z: number; r: number; spd: number; hue: 0 | 1 };
    const MOTES = reduce ? 0 : 28;
    const motes: Mote[] = Array.from({ length: MOTES }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      z: Math.random(),
      r: 0.6 + Math.random() * 1.8,
      spd: 4 + Math.random() * 12,
      hue: (i % 2) as 0 | 1,
    }));

    const TURN = 340; // px per full turn (~9-10 base pairs/turn, like real B-DNA)
    const STEP = 12; // sampling step (smaller = smoother tube)
    const RUNG_EVERY = 3; // a base pair (rung + atoms) every N samples
    const OPACITY = 0.5; // vivid — it's occluded below the hero, so it never fights copy
    const SPEED = 18; // idle px/s downward flow
    const SCROLL_FLOW = 0.55; // how far the helix travels per px scrolled
    const SCROLL_SPIN = 0.0016; // how much the helix rotates per px scrolled
    const t0 = performance.now();
    const edgeFade = (y: number) => Math.max(0, Math.min(1, Math.min(y, h - y) / (h * 0.16)));

    // backbone colours: bright in dark (additive bloom), deep in light (sober ink)
    const strandA = (dark: boolean) => (dark ? '90 218 248' : '14 165 183'); // cyan
    const strandB = (dark: boolean) => (dark ? '167 140 252' : '109 76 200'); // violet
    // base-pair palette — the four "bases", colour-coded like a molecular viewer
    const RUNG_DARK = ['52 211 153', '251 191 36', '251 113 133', '56 189 248']; // emerald amber rose sky
    const RUNG_LIGHT = ['5 150 105', '180 83 9', '190 24 60', '2 132 199'];
    const rungCol = (gi: number, dark: boolean) =>
      (dark ? RUNG_DARK : RUNG_LIGHT)[(((gi % 4) + 4) % 4)];
    const moteCol = (hue: 0 | 1, dark: boolean) =>
      hue === 0 ? strandA(dark) : strandB(dark);

    type Pt = { x: number; y: number; d: number };
    type El =
      | { t: 'seg'; a: Pt; b: Pt; z: number; strand: 0 | 1 }
      | { t: 'rung'; a: Pt; b: Pt; z: number; col: string }
      | { t: 'atom'; p: Pt; z: number; strand: 0 | 1 };

    const frame = (now: number) => {
      const time = (now - t0) / 1000;
      ctx.clearRect(0, 0, w, h);
      const dark = isDark();
      const glow: GlobalCompositeOperation = dark ? 'lighter' : 'source-over';

      // ease pointer parallax
      px += (tx - px) * 0.045;
      py += (ty - py) * 0.045;
      const cx = w * 0.6 + px * 18; // biased off the copy column; drifts toward the cursor
      const yTilt = py * 12;
      const R = Math.max(120, Math.min(236, w * 0.145));
      // SCROLL drives travel + spin → scrolling reads as gliding along the molecule.
      const flow = time * SPEED + scrollY * SCROLL_FLOW;
      const spin = time * 0.4 + scrollY * SCROLL_SPIN + px * 0.2;

      /* ---- ambient motes (behind the helix, additive) ---- */
      if (MOTES) {
        ctx.globalCompositeOperation = glow;
        for (const m of motes) {
          m.y += (m.spd * (0.2 + m.z)) / 1000;
          if (m.y > 1.05) {
            m.y = -0.05;
            m.x = Math.random();
          }
          const x = m.x * w + px * (6 + m.z * 22);
          const y = m.y * h + yTilt * 0.5;
          const fade = edgeFade(y);
          if (fade <= 0) continue;
          ctx.globalAlpha = (0.05 + m.z * 0.16) * fade * OPACITY;
          ctx.beginPath();
          ctx.arc(x, y, m.r * (0.6 + m.z), 0, Math.PI * 2);
          ctx.fillStyle = `rgb(${moteCol(m.hue, dark)})`;
          ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
      }

      // Sample both strands by CONTINUOUS global index so geometry slides smoothly.
      const giStart = Math.floor((-flow) / STEP) - 2;
      const giEnd = Math.ceil((h - flow) / STEP) + 2;
      const rows: { gi: number; a: Pt; b: Pt }[] = [];
      for (let gi = giStart; gi <= giEnd; gi++) {
        const worldY = gi * STEP;
        const y = worldY + flow + yTilt * Math.sin((worldY / h) * Math.PI);
        const ang = (worldY / TURN) * Math.PI * 2 + spin;
        rows.push({
          gi,
          a: { x: cx + Math.sin(ang) * R, y, d: (Math.cos(ang) + 1) / 2 },
          b: { x: cx + Math.sin(ang + Math.PI) * R, y, d: (Math.cos(ang + Math.PI) + 1) / 2 },
        });
      }

      const els: El[] = [];
      for (let k = 0; k < rows.length - 1; k++) {
        const p = rows[k];
        const n = rows[k + 1];
        els.push({ t: 'seg', a: p.a, b: n.a, z: (p.a.d + n.a.d) / 2, strand: 0 });
        els.push({ t: 'seg', a: p.b, b: n.b, z: (p.b.d + n.b.d) / 2, strand: 1 });
        if (((p.gi % RUNG_EVERY) + RUNG_EVERY) % RUNG_EVERY === 0) {
          els.push({ t: 'rung', a: p.a, b: p.b, z: (p.a.d + p.b.d) / 2, col: rungCol(p.gi, dark) });
          els.push({ t: 'atom', p: p.a, z: p.a.d, strand: 0 });
          els.push({ t: 'atom', p: p.b, z: p.b.d, strand: 1 });
        }
      }
      els.sort((p, q) => p.z - q.z); // far → near

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (const el of els) {
        if (el.t === 'rung') {
          const fade = edgeFade(el.a.y);
          if (fade <= 0) continue;
          const near = el.z;
          // additive bloom on the front-most base pairs
          if (near > 0.5) {
            ctx.globalCompositeOperation = glow;
            ctx.globalAlpha = (near - 0.5) * 0.55 * fade * OPACITY;
            ctx.lineWidth = 4 + near * 5;
            ctx.strokeStyle = `rgb(${el.col})`;
            ctx.beginPath();
            ctx.moveTo(el.a.x, el.a.y);
            ctx.lineTo(el.b.x, el.b.y);
            ctx.stroke();
            ctx.globalCompositeOperation = 'source-over';
          }
          // crisp coloured bond
          ctx.lineWidth = 1.3 + near * 2.6;
          ctx.globalAlpha = (dark ? 0.2 + near * 0.34 : 0.22 + near * 0.3) * fade * OPACITY;
          ctx.strokeStyle = `rgb(${el.col})`;
          ctx.beginPath();
          ctx.moveTo(el.a.x, el.a.y);
          ctx.lineTo(el.b.x, el.b.y);
          ctx.stroke();
        } else if (el.t === 'seg') {
          const fade = edgeFade((el.a.y + el.b.y) / 2);
          if (fade <= 0) continue;
          const near = el.z;
          const col = el.strand === 0 ? strandA(dark) : strandB(dark);
          // outer glow tube (additive bloom in dark)
          ctx.globalCompositeOperation = glow;
          ctx.globalAlpha = (dark ? 0.1 + near * 0.46 : 0.05 + near * 0.12) * fade * OPACITY;
          ctx.strokeStyle = `rgb(${col})`;
          ctx.lineWidth = (3 + near * 9) * (dark ? 1 : 0.9);
          ctx.beginPath();
          ctx.moveTo(el.a.x, el.a.y);
          ctx.lineTo(el.b.x, el.b.y);
          ctx.stroke();
          // crisp body
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = (dark ? 0.32 + near * 0.42 : 0.4 + near * 0.4) * fade * OPACITY;
          ctx.lineWidth = 1.4 + near * 3.4;
          ctx.beginPath();
          ctx.moveTo(el.a.x, el.a.y);
          ctx.lineTo(el.b.x, el.b.y);
          ctx.stroke();
          // hot near-white core on the strands closest to the camera
          if (near > 0.62) {
            ctx.globalCompositeOperation = glow;
            ctx.globalAlpha = (near - 0.62) * (dark ? 1.4 : 0.6) * fade * OPACITY;
            ctx.strokeStyle = dark ? 'rgb(238 252 255)' : `rgb(${col})`;
            ctx.lineWidth = 0.8 + near * 1.4;
            ctx.beginPath();
            ctx.moveTo(el.a.x, el.a.y);
            ctx.lineTo(el.b.x, el.b.y);
            ctx.stroke();
            ctx.globalCompositeOperation = 'source-over';
          }
        } else {
          const fade = edgeFade(el.p.y);
          if (fade <= 0) continue;
          const near = el.z;
          const r = 3.4 + near * 7;
          // additive halo glow
          ctx.globalCompositeOperation = glow;
          ctx.globalAlpha = (dark ? 0.16 + near * 0.48 : 0.07 + near * 0.16) * fade * OPACITY;
          const halo = el.strand === 1 ? haloViolet : haloCyan;
          const hr = r * 3;
          ctx.drawImage(halo, el.p.x - hr, el.p.y - hr, hr * 2, hr * 2);
          // shaded atom bead
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = (0.46 + near * 0.42) * fade * OPACITY;
          const bead = el.strand === 1 ? beadViolet : beadCyan;
          ctx.drawImage(bead, el.p.x - r, el.p.y - r, r * 2, r * 2);
        }
      }

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;

      if (!reduce && !document.hidden) raf = requestAnimationFrame(frame);
    };

    if (reduce) frame(t0 + 1200);
    else raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 -z-10" />;
}
