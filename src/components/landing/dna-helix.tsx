'use client';

import * as React from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';

/**
 * Ambient DNA double-helix behind the whole landing page.
 * - It MOVES: each base pair twists around Y (GPU-only CSS transform) → live helix.
 * - It FALLS: the whole field flows downward forever. Two identical 100vh tiles are
 *   stacked and translated `y: 0 → -100vh` on a linear loop; the twist delay repeats
 *   per tile, so the helix phase matches at the seam and the loop is invisible.
 * Faint + edge-masked so the copy on top stays perfectly legible. Honors reduced-motion.
 */
const RUNGS = 18; // base pairs per 100vh tile
const TWIST_STEP = 0.42; // s of delay between rungs → ~1 helix turn per tile

export function DnaHelix() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  // Brighten a touch as the page scrolls, so the strands read as "connecting".
  const opacity = useTransform(scrollYProgress, [0, 0.12, 0.85, 1], [0.22, 0.55, 0.55, 0.2]);

  const rungs = React.useMemo(
    () =>
      Array.from({ length: RUNGS * 2 }, (_, i) => ({
        topVh: (i / RUNGS) * 100, // 0 → 200vh across the two tiles
        delay: (-(i % RUNGS) * TWIST_STEP).toFixed(2), // repeats per tile → seamless seam
      })),
    [],
  );

  return (
    <motion.div
      aria-hidden
      style={{
        opacity: reduce ? 0.22 : opacity,
        WebkitMaskImage: 'linear-gradient(to bottom, transparent, #000 12%, #000 88%, transparent)',
        maskImage: 'linear-gradient(to bottom, transparent, #000 12%, #000 88%, transparent)',
      }}
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div
        className="dna absolute left-1/2 top-0 h-full -translate-x-1/2"
        style={{ ['--dna-w' as string]: '188px' }}
      >
        <motion.div
          className="absolute inset-x-0 top-0 h-[200vh]"
          style={{ transformStyle: 'preserve-3d' }}
          animate={reduce ? undefined : { y: ['0vh', '-100vh'] }}
          transition={reduce ? undefined : { duration: 22, ease: 'linear', repeat: Infinity }}
        >
          {rungs.map((r, i) => (
            <div
              key={i}
              className="dna-rung"
              style={{ top: `${r.topVh}vh`, animationDelay: `${r.delay}s` }}
            >
              <span className="dna-node dna-node-a" />
              <span className="dna-bar" />
              <span className="dna-node dna-node-b" />
            </div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
