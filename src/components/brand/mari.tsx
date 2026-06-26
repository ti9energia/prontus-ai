'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type MariState = 'idle' | 'listening' | 'thinking' | 'speaking';

/**
 * Mari — the Auronis Health medical AI persona.
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
          <stop offset="0%" stopColor="#caa472" />
          <stop offset="100%" stopColor="#8c6a42" />
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
        <path d="M41 72 48 88 55 72 48 68Z" fill="#14c8c4" />

        {/* stethoscope draped around the neck */}
        <path d="M43 66c-9 2-15 9-15 19" stroke="#00a8a2" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <path d="M53 66c9 2 15 9 15 19" stroke="#00a8a2" strokeWidth="2.6" fill="none" strokeLinecap="round" />
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

        {/* nose */}
        <path d="M47.6 48.8q1 2 .3 3.3" stroke="#e3a684" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        {/* full soft-pink lips + gentle smile */}
        <path d="M43.4 54.8q4.6 1.5 9.2 0q-1.7 3.8-4.6 3.8q-2.9 0-4.6-3.8Z" fill="#e88f98" opacity="0.6" />
        <path d="M43.4 54.8q4.6 1.5 9.2 0" stroke="#cf6f7b" strokeWidth="1.1" fill="none" strokeLinecap="round" />

        {/* blush */}
        <ellipse cx="37.5" cy="52.6" rx="2.5" ry="1.7" fill="#f59a93" opacity="0.38" />
        <ellipse cx="58.5" cy="52.6" rx="2.5" ry="1.7" fill="#f59a93" opacity="0.38" />
      </g>

      {rim && <circle cx="48" cy="48" r="47" fill="none" stroke="#ffffff" strokeOpacity="0.65" strokeWidth="2" />}
    </svg>
  );
}

/** Mari's portrait core: the user's 3D render (`/brand/mari.png`) when present,
 *  else the vector MariFace. Drop a square PNG at `public/brand/mari.png` and Mari's
 *  real face appears everywhere automatically — no code change needed. */
export function MariPortrait({
  size = 96,
  rim = true,
  className,
  title = 'Mari',
}: {
  size?: number;
  rim?: boolean;
  className?: string;
  title?: string;
}) {
  const [photo, setPhoto] = React.useState(true);
  if (!photo) return <MariFace size={size} rim={rim} className={className} title={title} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/mari.png"
      alt={title}
      width={size}
      height={size}
      draggable={false}
      onError={() => setPhoto(false)}
      className={cn('rounded-full object-cover', rim && 'ring-2 ring-brand-300/40', className)}
      style={{ width: size, height: size }}
    />
  );
}

/** Convenience alias — Mari's portrait (uses the photo when available). */
export const MariAvatar = MariPortrait;

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
  const intense = state === 'thinking' || active;
  return (
    <div
      className={cn('relative grid place-items-center', className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* deep layered glow */}
      <div
        className={cn(
          'absolute inset-[3%] rounded-full bg-brand-500/25 blur-[42px] transition-opacity duration-700',
          active ? 'animate-pulse opacity-100' : intense ? 'opacity-80' : 'opacity-55',
        )}
      />
      <div className="absolute inset-[16%] rounded-full bg-accent-400/15 blur-2xl animate-glow-pulse" />

      {/* outer orbital ring + particles */}
      <svg
        viewBox="0 0 100 100"
        className={cn('absolute inset-0 h-full w-full text-brand-400/65 animate-spin-slow', active && '[animation-duration:6s]')}
        aria-hidden
      >
        <circle cx="50" cy="50" r="47.5" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="0.4 5.6" strokeLinecap="round" />
        {[0, 72, 144, 216, 288].map((deg) => {
          const a = (deg * Math.PI) / 180;
          return <circle key={deg} cx={50 + 47.5 * Math.cos(a)} cy={50 + 47.5 * Math.sin(a)} r="1.1" fill="currentColor" />;
        })}
      </svg>
      {/* counter-rotating inner ring */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-[7%] h-[86%] w-[86%] text-accent-400/45 animate-spin-slow [animation-direction:reverse] [animation-duration:18s]"
        aria-hidden
      >
        <circle cx="50" cy="50" r="47" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 8" />
      </svg>

      {/* speaking waves */}
      {state === 'speaking' && (
        <>
          <span className="absolute inset-[15%] rounded-full border border-brand-400/45 animate-ping" />
          <span className="absolute inset-[15%] rounded-full border border-accent-400/35 animate-ping [animation-delay:0.7s]" />
        </>
      )}

      {/* portrait core (the user's render when present, else the vector face) */}
      <div className={cn('relative z-10 grid place-items-center', state === 'idle' && 'animate-float')}>
        <MariPortrait size={Math.round(size * 0.62)} rim className="drop-shadow-[0_14px_42px_-8px_rgba(20,200,196,0.5)]" />
      </div>

      {/* listening / speaking equalizer */}
      {active && (
        <div className="absolute bottom-[6%] z-20 flex items-end gap-[3px]">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="w-[3px] origin-bottom rounded-full bg-brand-400 animate-eq"
              style={{ height: 18, animationDelay: `${i * 0.11}s` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
