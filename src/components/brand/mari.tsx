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

        {/* hair — back */}
        <path d="M22 45c0-18 12-30 26-30s26 12 26 30c0 9-2 17-5 24H27c-3-7-5-15-5-24Z" fill={`url(#${u('hair')})`} />

        {/* neck + shoulder shadow */}
        <path d="M40 60h16v11c0 4-3.6 7-8 7s-8-3-8-7V60Z" fill={`url(#${u('skin')})`} />
        <path d="M40 64c2.6 3 5.2 4.3 8 4.3s5.4-1.3 8-4.3v-3H40v3Z" fill="#e6b193" opacity="0.55" />

        {/* white coat */}
        <path d="M16 96c0-13 9-20 24-23l8 9 8-9c15 3 24 10 24 23H16Z" fill={`url(#${u('coat')})`} />
        <path d="M40 73 48 96 37 96 32 80Z" fill="#dde4ea" />
        <path d="M56 73 48 96 59 96 64 80Z" fill="#dde4ea" />
        {/* teal scrubs V */}
        <path d="M40 73 48 90 56 73 48 69Z" fill="#0d9488" />

        {/* stethoscope */}
        <path d="M41 70c-8 3-12 9-12 18" stroke="#0d9488" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M55 70c8 3 12 9 12 18" stroke="#0d9488" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="67" cy="89" r="4.6" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.4" />
        <circle cx="67" cy="89" r="1.7" fill="#94a3b8" />

        {/* ears + face */}
        <circle cx="31.5" cy="47" r="3.4" fill={`url(#${u('skin')})`} />
        <circle cx="64.5" cy="47" r="3.4" fill={`url(#${u('skin')})`} />
        <ellipse cx="48" cy="46" rx="17" ry="19.5" fill={`url(#${u('skin')})`} />

        {/* hair — front fringe + side sweeps */}
        <path
          d="M29 48C28 27 37 15 48 15s20 12 19 33c-2-7-5-13-10-13-3 0-5-5-9-5s-6 5-9 5c-5 0-8 6-10 13Z"
          fill={`url(#${u('hair')})`}
        />
        <path d="M29 45c-2 9-1 18 2 26l5-1c-3-8-4-16-3-25Z" fill={`url(#${u('hair')})`} />
        <path d="M67 45c2 9 1 18-2 26l-5-1c3-8 4-16 3-25Z" fill={`url(#${u('hair')})`} />

        {/* brows, eyes, nose, smile, cheeks */}
        <path d="M39 41q4-2.4 8 0" stroke="#c0852e" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <path d="M49 41q4-2.4 8 0" stroke="#c0852e" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <ellipse cx="42" cy="46.5" rx="2.4" ry="2.9" fill="#473a33" />
        <ellipse cx="54" cy="46.5" rx="2.4" ry="2.9" fill="#473a33" />
        <circle cx="42.9" cy="45.4" r="0.85" fill="#fff" />
        <circle cx="54.9" cy="45.4" r="0.85" fill="#fff" />
        <path d="M48 49v3.4" stroke="#e0a282" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        <path d="M43 55.5q5 4 10 0" stroke="#c96f5e" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <circle cx="38" cy="53" r="2.5" fill="#f7a8a0" opacity="0.4" />
        <circle cx="58" cy="53" r="2.5" fill="#f7a8a0" opacity="0.4" />
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
