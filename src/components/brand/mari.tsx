'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { MARI_ASSETS, mariAlt } from '@/lib/mari';

export type MariState = 'idle' | 'listening' | 'thinking' | 'speaking';

/**
 * Mari — the Auronis Health medical AI persona.
 *
 * A compact medical-record character derived from the Auronis arch and ECG.
 * This SVG is the resilient, code-native version of the campaign mascot.
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
        <radialGradient id={u('bg')} cx="50%" cy="38%" r="72%">
          <stop offset="0%" stopColor="#173A3D" />
          <stop offset="72%" stopColor="#111820" />
          <stop offset="100%" stopColor="#080C11" />
        </radialGradient>
        <linearGradient id={u('silver')} x1="18" y1="12" x2="78" y2="86">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="32%" stopColor="#DCE2E8" />
          <stop offset="64%" stopColor="#89939F" />
          <stop offset="100%" stopColor="#F1F4F7" />
        </linearGradient>
        <linearGradient id={u('shell')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#313943" />
          <stop offset="100%" stopColor="#11161D" />
        </linearGradient>
        <radialGradient id={u('iris')} cx="38%" cy="30%" r="72%">
          <stop offset="0%" stopColor="#8EF8F1" />
          <stop offset="52%" stopColor="#14C8C4" />
          <stop offset="100%" stopColor="#007B79" />
        </radialGradient>
        <filter id={u('glow')} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.8" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <clipPath id={u('clip')}><circle cx="48" cy="48" r="48" /></clipPath>
      </defs>

      <g clipPath={`url(#${u('clip')})`}>
        <rect width="96" height="96" fill={`url(#${u('bg')})`} />
        <rect x="20" y="10" width="56" height="82" rx="17" fill={`url(#${u('silver')})`} />
        <rect x="25" y="15" width="46" height="72" rx="13" fill={`url(#${u('shell')})`} stroke="#0B1016" strokeWidth="1.5" />
        <rect x="36" y="8" width="24" height="12" rx="4" fill={`url(#${u('silver')})`} stroke="#7E8994" />
        <rect x="42" y="13" width="12" height="2.5" rx="1.25" fill="#5BF0EA" filter={`url(#${u('glow')})`} />

        {/* exactly two expressive eyes */}
        <ellipse cx="38" cy="42" rx="8" ry="9" fill="#F8FAFC" stroke="#6E7883" strokeWidth="1.2" />
        <ellipse cx="58" cy="42" rx="8" ry="9" fill="#F8FAFC" stroke="#6E7883" strokeWidth="1.2" />
        <circle cx="39" cy="43" r="5.1" fill={`url(#${u('iris')})`} />
        <circle cx="57" cy="43" r="5.1" fill={`url(#${u('iris')})`} />
        <circle cx="39.5" cy="43.5" r="2.6" fill="#071014" />
        <circle cx="56.5" cy="43.5" r="2.6" fill="#071014" />
        <circle cx="37.5" cy="40.5" r="1.5" fill="#FFFFFF" />
        <circle cx="54.5" cy="40.5" r="1.5" fill="#FFFFFF" />

        <path d="M41 55q7 6 14 0" fill="none" stroke="#61F4EC" strokeWidth="2" strokeLinecap="round" />
        <path d="M30 71h10l3-8 6 17 5-12 4 3h8" fill="none" stroke="#32E3DD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${u('glow')})`} />
      </g>

      {rim && <circle cx="48" cy="48" r="47" fill="none" stroke="#74F5EF" strokeOpacity="0.38" strokeWidth="1.5" />}
    </svg>
  );
}

/** Campaign mascot portrait with the code-native MariFace as a graceful fallback. */
export function MariPortrait({
  size = 96,
  rim = true,
  className,
  title,
}: {
  size?: number;
  rim?: boolean;
  className?: string;
  title?: string;
}) {
  const locale = useLocale();
  const alt = title ?? mariAlt(locale);
  const [imageAvailable, setImageAvailable] = React.useState(true);
  if (!imageAvailable) return <MariFace size={size} rim={rim} className={className} title={alt} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={MARI_ASSETS.avatar}
      alt={alt}
      width={size}
      height={size}
      draggable={false}
      onError={() => setImageAvailable(false)}
      className={cn('rounded-full bg-elevated object-cover', rim && 'ring-2 ring-brand-300/40', className)}
      style={{ width: size, height: size }}
    />
  );
}

/** Convenience alias — Mari's mascot portrait. */
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
