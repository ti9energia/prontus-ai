import * as React from 'react';
import { cn } from '@/lib/utils';

type Tone =
  | 'brand'
  | 'accent'
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'outline';

const tones: Record<Tone, string> = {
  brand: 'bg-brand-600/10 text-brand-700 dark:text-brand-300 ring-brand-600/20',
  accent: 'bg-accent-400/12 text-accent-600 dark:text-accent-300 ring-accent-400/20',
  neutral: 'bg-ink/[0.06] text-muted ring-ink/[0.06]',
  success: 'bg-success/12 text-success-fg dark:text-success ring-success/20',
  warning: 'bg-warning/12 text-warning-fg dark:text-warning ring-warning/20',
  danger: 'bg-danger/12 text-danger-fg dark:text-danger ring-danger/20',
  info: 'bg-info/12 text-info-fg dark:text-info ring-info/20',
  outline: 'bg-transparent text-muted ring-line',
};

export function Badge({
  tone = 'neutral',
  className,
  dot,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone; dot?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-2xs font-medium ring-1 ring-inset',
        tones[tone],
        className,
      )}
      {...props}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  );
}
