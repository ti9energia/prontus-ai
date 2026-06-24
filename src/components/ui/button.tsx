'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant =
  | 'primary'
  | 'accent'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'subtle'
  | 'danger';
type Size = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

export const buttonVariants = ({
  variant = 'primary',
  size = 'md',
  className,
}: { variant?: Variant; size?: Size; className?: string } = {}) =>
  cn(
    'relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium',
    'transition-all duration-200 ease-spring select-none',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:scale-[0.98]',
    {
      primary:
        'bg-brand-600 text-white shadow-sm hover:bg-brand-700 hover:shadow-glow',
      accent:
        'bg-accent-400 text-white shadow-sm hover:bg-accent-500 hover:shadow-glow-accent',
      secondary:
        'bg-ink text-bg hover:opacity-90 shadow-sm',
      outline:
        'border border-line bg-surface text-ink hover:bg-elevated hover:border-subtle/40',
      ghost: 'text-ink/80 hover:text-ink hover:bg-ink/[0.05]',
      subtle: 'bg-ink/[0.05] text-ink hover:bg-ink/[0.08]',
      danger: 'bg-danger text-white hover:bg-danger/90 shadow-sm',
    }[variant],
    {
      sm: 'h-8 px-3 text-[0.8125rem]',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-[0.95rem]',
      icon: 'h-10 w-10',
      'icon-sm': 'h-8 w-8',
    }[size],
    className,
  );

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant, size, className, children, loading, leftIcon, rightIcon, disabled, ...props },
    ref,
  ) => (
    <button
      ref={ref}
      className={buttonVariants({ variant, size, className })}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  ),
);
Button.displayName = 'Button';
