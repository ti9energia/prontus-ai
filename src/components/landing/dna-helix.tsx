'use client';

import * as React from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';

/**
 * Ambient DNA double-helix that sits behind the whole landing page. It rotates
 * continuously (CSS, pure-transform) and "comes alive" on scroll — the field
 * brightens and drifts as the page moves, so the strands read as connecting.
 * Kept faint + masked so copy stays perfectly legible on top.
 */
const RUNGS = 28;

export function DnaHelix() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.12, 0.85, 1], [0.18, 0.5, 0.5, 0.16]);
  const y = useTransform(scrollYProgress, [0, 1], ['-5%', '9%']);

  const rungs = React.useMemo(() => Array.from({ length: RUNGS }, (_, i) => i), []);

  return (
    <motion.div
      aria-hidden
      style={{
        opacity: reduce ? 0.26 : opacity,
        WebkitMaskImage: 'linear-gradient(to bottom, transparent, #000 14%, #000 86%, transparent)',
        maskImage: 'linear-gradient(to bottom, transparent, #000 14%, #000 86%, transparent)',
      }}
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <motion.div style={{ y: reduce ? 0 : y }} className="absolute inset-0 grid place-items-center">
        <div className="dna h-[124vh]" style={{ ['--dna-w' as string]: '176px' }}>
          {rungs.map((i) => (
            <div
              key={i}
              className="dna-rung"
              style={{ top: `${(i / (RUNGS - 1)) * 100}%`, animationDelay: `${(-i * 0.26).toFixed(2)}s` }}
            >
              <span className="dna-node dna-node-a" />
              <span className="dna-bar" />
              <span className="dna-node dna-node-b" />
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
