import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />;
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-4 w-4 animate-spin text-muted', className)} />;
}

export function Progress({ value, className, tone = 'brand' }: { value: number; className?: string; tone?: 'brand' | 'accent' | 'success' | 'warning' | 'danger' }) {
  const bar = {
    brand: 'bg-brand-500',
    accent: 'bg-accent-400',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
  }[tone];
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-ink/[0.07]', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-700 ease-spring', bar)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-line/80 px-6 py-14 text-center',
        className,
      )}
    >
      {icon && (
        <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-600/[0.08] text-brand-600">
          {icon}
        </div>
      )}
      <p className="font-display text-base font-semibold">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
