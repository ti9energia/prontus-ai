'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MARI_ASSETS, mariAlt } from '@/lib/mari';
import { MariFace } from './mari';

/**
 * MariAssistant — the one component that renders Mari's mascot identity
 * everywhere. Picks the square avatar or the full character by `variant`, shows a
 * status signal (listening / thinking / attention…) and, optionally, a message
 * bubble. Motion is Tailwind-only and auto-stilled by the global
 * prefers-reduced-motion rule in globals.css. Falls back to the vector
 * `MariFace` if an asset ever fails to load.
 */
export type MariVariant =
  | 'avatar'
  | 'full'
  | 'floating'
  | 'dock'
  | 'chat'
  | 'owner'
  | 'clinical'
  | 'compact';

export type MariStatus =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'attention'
  | 'warning'
  | 'success';

/** Default px per variant (override with `size`). */
const SIZE: Record<MariVariant, number> = {
  full: 280,
  clinical: 132,
  owner: 96,
  floating: 78,
  avatar: 72,
  dock: 64,
  chat: 44,
  compact: 36,
};

/** Status → signal-dot color (also carries a non-color cue for alerts, below). */
const SIGNAL: Record<MariStatus, string> = {
  idle: 'bg-brand-500',
  listening: 'bg-accent-400',
  thinking: 'bg-brand-400',
  speaking: 'bg-brand-500',
  attention: 'bg-warning',
  warning: 'bg-danger',
  success: 'bg-success',
};

/** Status → aura glow tint behind the portrait. */
const AURA: Record<MariStatus, string> = {
  idle: 'bg-brand-500/20',
  listening: 'bg-accent-400/25',
  thinking: 'bg-brand-500/25',
  speaking: 'bg-brand-500/30',
  attention: 'bg-warning/25',
  warning: 'bg-danger/25',
  success: 'bg-success/20',
};

export function MariAssistant({
  variant = 'avatar',
  status = 'idle',
  message,
  size,
  className,
  imageClassName,
  priority = false,
  animate = true,
}: {
  variant?: MariVariant;
  status?: MariStatus;
  message?: React.ReactNode;
  size?: number;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  /** Set false to render a static portrait (e.g. tiny inline avatars). */
  animate?: boolean;
}) {
  const locale = useLocale();
  const [broken, setBroken] = React.useState(false);
  const isFull = variant === 'full';
  const px = size ?? SIZE[variant];
  const alt = mariAlt(locale);

  const listening = status === 'listening';
  const thinking = status === 'thinking';
  const alerting = status === 'attention' || status === 'warning';

  const image = broken ? (
    <MariFace size={px} rim={!isFull} title={alt} className={cn(isFull && 'rounded-2xl', imageClassName)} />
  ) : isFull ? (
    // eslint-disable-next-line @next/next/no-img-element -- transparent PNG asset; next/image adds no value here
    <img
      src={MARI_ASSETS.full}
      alt={alt}
      width={px}
      height={Math.round(px * (1402 / 1122))}
      draggable={false}
      loading={priority ? 'eager' : 'lazy'}
      onError={() => setBroken(true)}
      className={cn('h-auto w-full object-contain drop-shadow-[0_18px_36px_rgba(20,200,196,0.22)]', imageClassName)}
    />
  ) : (
    <div
      className={cn(
        'relative h-full w-full overflow-hidden rounded-full bg-gradient-to-b from-brand-500/12 to-elevated/50 ring-1 ring-brand-300/25',
        imageClassName,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- transparent PNG asset; next/image adds no value here */}
      <img
        src={MARI_ASSETS.avatar}
        alt={alt}
        width={px}
        height={px}
        draggable={false}
        loading={priority ? 'eager' : 'lazy'}
        onError={() => setBroken(true)}
        className="h-full w-full object-cover"
      />
    </div>
  );

  return (
    <div className={cn('flex items-center gap-4', isFull && 'flex-col text-center sm:flex-row sm:text-left', className)}>
      <div
        className={cn('relative shrink-0', !isFull && animate && 'animate-float', !isFull && thinking && animate && 'animate-mari-thinking')}
        style={{ width: px, height: isFull ? undefined : px }}
        data-status={status}
      >
        {/* aura glow — decorative */}
        {!isFull && (
          <span
            aria-hidden
            className={cn('absolute inset-[6%] -z-10 rounded-full blur-xl', AURA[status], animate && 'animate-mari-aura')}
          />
        )}

        {image}

        {/* speaking ripple */}
        {status === 'speaking' && !isFull && animate && (
          <span aria-hidden className="absolute inset-[4%] rounded-full border border-brand-400/40 animate-ping" />
        )}

        {/* status signal dot — decorative; alerts also carry the icon + text below */}
        {!isFull && (
          <span
            aria-hidden
            className={cn(
              'absolute bottom-[6%] right-[6%] h-[18%] max-h-3.5 w-[18%] max-w-3.5 rounded-full ring-2 ring-card',
              SIGNAL[status],
              animate && (listening ? 'animate-mari-listening' : 'animate-mari-pulse'),
            )}
          />
        )}
      </div>

      {message != null && message !== '' && (
        <div
          role={alerting ? 'status' : undefined}
          className={cn(
            'max-w-sm rounded-2xl border border-hairline bg-elevated/90 px-4 py-3 text-sm leading-relaxed text-ink shadow-lg backdrop-blur',
            status === 'warning' && 'border-danger/45',
            status === 'attention' && 'border-warning/45',
          )}
        >
          {alerting && (
            <span className="mr-1.5 inline-flex items-center gap-1 align-middle font-medium">
              <AlertTriangle
                className={cn('h-4 w-4', status === 'warning' ? 'text-danger' : 'text-warning')}
                aria-hidden
              />
            </span>
          )}
          {message}
        </div>
      )}
    </div>
  );
}
