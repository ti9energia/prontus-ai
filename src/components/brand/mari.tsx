'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type MariState = 'idle' | 'listening' | 'thinking' | 'speaking';

/**
 * Mari — the Prontus.ai medical AI persona.
 *
 * A blonde physician in a white coat with a teal stethoscope, drawn as clean
 * vector art: themeable, crisp at any size, no raster, no "generic AI image"
 * look. Gradient ids are namespaced per-instance (useId) so multiple avatars
 * can coexist on one page.
 *
 * - <MariFace/>     a circular portrait chip (chat, headers, menus)
 * - <MariPresence/> the face wrapped in a "Jarvis" aura for voice/meeting modes
 */
export function MariFace({
  size = 96,
  className,
  rim = true,
  title = 'Mari',
}: {
  size?: number;
  className?: string;
  rim?: boolean;
  title?: string;
}) {
  const id = React.useId().replace(/[:]/g, '');
  const u = (n: string) => `${n}-${id}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      role="img"
      aria-label={title}
      className={cn('shrink-0', className)}
    >
      <defs>
        <radialGradient id={u('bg')} cx="50%" cy="34%" r="78%">
          <stop offset="0%" stopColor="#ccfbf1" />
          <stop offset="100%" stopColor="#8fe0d3" />
        </radialGradient>
        <linearGradient id={u('hair')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f7d575" />
          <stop offset="100%" stopColor="#dfa636" />
        </linearGradient>
        <linearGradient id={u('skin')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fcddc8" />
          <stop offset="100%" stopColor="#f2c4a8" />
        </linearGradient>
        <linearGradient id={u('coat')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e9eef2" />
        </linearGradient>
        <clipPath id={u('clip')}>
          <circle cx="48" cy="48" r="48" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${u('clip')})`}>
        <rect width="96" height="96" fill={`url(#${u('bg')})`} />

        {/* hair — back layer */}
        <path d="M21 47c0-18 12-31 27-31s27 13 27 31c0 11-2 20-6 28H27c-4-8-6-17-6-28Z" fill={`url(#${u('hair')})`} />

        {/* neck + chin shadow */}
        <path d="M41 58h14v12c0 4-3 7-7 7s-7-3-7-7V58Z" fill={`url(#${u('skin')})`} />
        <path d="M41 63c2.4 3 4.6 4.3 7 4.3s4.6-1.3 7-4.3v-5H41v5Z" fill="#e7b394" opacity="0.5" />

        {/* white coat + lapels */}
        <path d="M15 96c0-13 9-21 25-24l8 10 8-10c16 3 25 11 25 24H15Z" fill={`url(#${u('coat')})`} />
        <path d="M40 72 34 96h6.5l6-18-6.5-6Z" fill="#dde4ea" />
        <path d="M56 72 62 96h-6.5l-6-18 6.5-6Z" fill="#dde4ea" />
        {/* teal scrubs V */}
        <path d="M41 72 48 88 55 72 48 68Z" fill="#0d9488" />

        {/* stethoscope draped around the neck */}
        <path d="M43 66c-9 2-15 9-15 19" stroke="#0f766e" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <path d="M53 66c9 2 15 9 15 19" stroke="#0f766e" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <circle cx="68" cy="86" r="4.8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.4" />
        <circle cx="68" cy="86" r="2" fill="#b6c0cc" />

        {/* ears + face */}
        <circle cx="32" cy="46" r="3.3" fill={`url(#${u('skin')})`} />
        <circle cx="64" cy="46" r="3.3" fill={`url(#${u('skin')})`} />
        <path d="M31.5 43c0-11 7-18 16.5-18s16.5 7 16.5 18c0 8-3 14.5-7.5 18-2.5 2-5.6 3-9 3s-6.5-1-9-3C34.5 57.5 31.5 51 31.5 43Z" fill={`url(#${u('skin')})`} />

        {/* hair — front side-swept fringe + framing strands + sheen */}
        <path d="M30 46C29 28 37 16 48 16C60 16 67 27 66 46C64 39 60 34 55 34C51 34 50 30 46 31C42.5 32 41 36 38 36C34 36 31 40 30 46Z" fill={`url(#${u('hair')})`} />
        <path d="M30 44c-1.5 8-1 17 1.6 25l4.2-1.2c-2.6-8-3.4-16-2.4-24Z" fill={`url(#${u('hair')})`} />
        <path d="M66 44c1.5 8 1 17-1.6 25l-4.2-1.2c2.6-8 3.4-16 2.4-24Z" fill={`url(#${u('hair')})`} />
        <path d="M36 27q12-8 24 0" stroke="#fbe7ad" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />

        {/* brows */}
        <path d="M38.5 40.8q4-2.6 7.5-.4" stroke="#bb8430" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M50 40.4q3.5-2.2 7.5.4" stroke="#bb8430" strokeWidth="1.5" fill="none" strokeLinecap="round" />

        {/* eyes — lash line + iris + highlight */}
        <path d="M38.5 45.6q3.5-3 7 0" stroke="#4a3b33" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M50.5 45.6q3.5-3 7 0" stroke="#4a3b33" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <circle cx="42" cy="47.2" r="2.2" fill="#5b3b2a" />
        <circle cx="54" cy="47.2" r="2.2" fill="#5b3b2a" />
        <circle cx="42.8" cy="46.4" r="0.8" fill="#fff" />
        <circle cx="54.8" cy="46.4" r="0.8" fill="#fff" />

        {/* nose + warm smile */}
        <path d="M47.6 48.8q1 2 .3 3.3" stroke="#e3a684" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        <path d="M43 55.6q5 4.4 10 0" stroke="#c4685a" strokeWidth="1.9" fill="none" strokeLinecap="round" />

        {/* blush */}
        <ellipse cx="37.5" cy="52.6" rx="2.5" ry="1.7" fill="#f59a93" opacity="0.38" />
        <ellipse cx="58.5" cy="52.6" rx="2.5" ry="1.7" fill="#f59a93" opacity="0.38" />
      </g>

      {rim && <circle cx="48" cy="48" r="47" fill="none" stroke="#ffffff" strokeOpacity="0.65" strokeWidth="2" />}
    </svg>
  );
}

/** Convenience alias. */
export const MariAvatar = MariFace;

/**
 * "Jarvis" presence — the face inside an animated aura of rotating rings, a
 * soft glow, speaking pulses and a listening equalizer. State drives intensity.
 * All motion is CSS-based, so it is automatically stilled by the global
 * prefers-reduced-motion rule in globals.css.
 */
export function MariPresence({
  size = 200,
  state = 'idle',
  className,
}: {
  size?: number;
  state?: MariState;
  className?: string;
}) {
  const active = state === 'listening' || state === 'speaking';
  return (
    <div
      className={cn('relative grid place-items-center', className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* glow */}
      <div
        className={cn(
          'absolute inset-[6%] rounded-full bg-brand-500/20 blur-2xl transition-opacity duration-500',
          active ? 'animate-pulse opacity-100' : state === 'thinking' ? 'opacity-80' : 'opacity-55',
        )}
      />

      {/* rotating dashed ring */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full animate-spin-slow text-brand-500/55" aria-hidden>
        <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="0.9" strokeDasharray="3 7" strokeLinecap="round" />
      </svg>
      {/* counter-rotating thin ring */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-[7%] h-[86%] w-[86%] animate-spin-slow text-brand-400/45 [animation-direction:reverse] [animation-duration:15s]"
        aria-hidden
      >
        <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="0.7" strokeDasharray="1 6" />
      </svg>

      {/* speaking pulse rings */}
      {state === 'speaking' && (
        <>
          <span className="absolute inset-[12%] rounded-full border border-brand-400/45 animate-ping" />
          <span className="absolute inset-[12%] rounded-full border border-accent-400/35 animate-ping [animation-delay:0.6s]" />
        </>
      )}

      {/* face */}
      <MariFace size={size * 0.6} rim className="relative z-10 drop-shadow-[0_10px_28px_rgba(13,148,136,0.28)]" />

      {/* listening / speaking equalizer */}
      {active && (
        <div className="absolute bottom-[7%] z-20 flex items-end gap-[3px]">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="w-[3px] origin-bottom rounded-full bg-brand-500 animate-eq"
              style={{ height: 16, animationDelay: `${i * 0.12}s` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
