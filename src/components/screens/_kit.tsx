'use client';

import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Scroll container + comfortable padding for every screen. */
export function ScreenContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="h-full overflow-y-auto overflow-x-hidden">
      <div className={cn('mx-auto w-full max-w-6xl px-5 py-6 sm:px-8 sm:py-8 step-anim', className)}>
        {children}
      </div>
    </div>
  );
}

export function ScreenHeader({
  icon: Icon,
  title,
  subtitle,
  actions,
  className,
}: {
  icon?: LucideIcon;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between', className)}>
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-600/10 text-brand-600">
            <Icon className="h-5 w-5" />
          </span>
        )}
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function SectionTitle({
  children,
  action,
  className,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-3 flex items-center justify-between', className)}>
      <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-subtle">{children}</h2>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = 'brand',
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: LucideIcon;
  tone?: 'brand' | 'accent' | 'success' | 'warning' | 'danger' | 'neutral';
  className?: string;
}) {
  const toneCls = {
    brand: 'text-brand-600 bg-brand-600/10',
    accent: 'text-accent-500 bg-accent-400/12',
    success: 'text-success-fg dark:text-success bg-success/12',
    warning: 'text-warning-fg dark:text-warning bg-warning/12',
    danger: 'text-danger-fg dark:text-danger bg-danger/12',
    neutral: 'text-muted bg-ink/[0.06]',
  }[tone];
  return (
    <div className={cn('rounded-xl border border-hairline bg-card p-4 shadow-xs', className)}>
      <div className="flex items-center justify-between">
        <p className="text-2xs font-medium uppercase tracking-wide text-subtle">{label}</p>
        {Icon && (
          <span className={cn('grid h-7 w-7 place-items-center rounded-lg', toneCls)}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className="mt-2 font-display text-2xl font-bold tracking-tight tnum">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  );
}

export function ScreenSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-8 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="skeleton h-10 w-10 rounded-xl" />
        <div className="space-y-2">
          <div className="skeleton h-5 w-48" />
          <div className="skeleton h-3 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-24 rounded-xl" />
        ))}
      </div>
      <div className="skeleton mt-6 h-64 rounded-xl" />
    </div>
  );
}

/* Minimal table primitives shared by data screens. */
export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-hairline bg-card shadow-xs">
      <table className={cn('w-full text-sm', className)}>{children}</table>
    </div>
  );
}
export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        'whitespace-nowrap border-b border-hairline px-4 py-3 text-left text-2xs font-semibold uppercase tracking-wide text-subtle',
        className,
      )}
    >
      {children}
    </th>
  );
}
export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn('border-b border-hairline/60 px-4 py-3 align-middle', className)}>{children}</td>;
}
