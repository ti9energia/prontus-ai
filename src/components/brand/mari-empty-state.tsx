'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { MariAssistant, type MariStatus } from './mari-assistant';

/**
 * MariEmptyState — an empty state narrated by Mari. Unlike the generic
 * `EmptyState` (server-friendly, in `ui/feedback`), this one is a client
 * component so Mari's face and voice can localize through `useLocale` inside
 * `<MariAssistant/>`.
 *
 * Reserve it for the clinical / copilot surfaces where Mari's presence adds
 * meaning (today, patients, documents, exams, billing, agent). Neutral admin
 * tables keep the plain `EmptyState` so her presence stays intentional, not
 * noise. Narration text is centralized in `mariEmptyLines()` (`lib/mari/design`).
 * Motion is Tailwind-only and auto-stilled by the global reduced-motion rule.
 */
export function MariEmptyState({
  narration,
  status = 'idle',
  title,
  description,
  action,
  size = 68,
  className,
}: {
  /** Mari's first-person line for this blank surface — the soul of the state. */
  narration: React.ReactNode;
  /** Tints Mari's aura/signal: `idle` for neutral blanks, `success` when the emptiness is good news (all done). */
  status?: MariStatus;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-line/80 px-6 py-14 text-center',
        className,
      )}
    >
      <MariAssistant variant="avatar" status={status} size={size} />

      {narration != null && narration !== '' && (
        <p className="mt-4 max-w-sm text-pretty rounded-2xl border border-hairline bg-elevated/70 px-4 py-2.5 text-sm leading-relaxed text-ink/90 shadow-xs backdrop-blur">
          {narration}
        </p>
      )}

      <p className="mt-4 font-display text-base font-semibold">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
