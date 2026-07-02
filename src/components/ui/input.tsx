'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const fieldBase =
  'w-full rounded-md border border-line bg-surface px-3 text-sm text-ink placeholder:text-subtle/80 transition-shadow duration-200 focus:border-brand-500/60 focus:outline-none focus:ring-4 focus:ring-brand-500/15 disabled:opacity-60';

/**
 * Field → control association without wrapping controls in a <label>.
 * Field publishes a generated id here; Input/Textarea/Select adopt it as their
 * default id so the label's htmlFor resolves — even when the control sits
 * inside wrapper divs (icons, password toggles, etc.).
 */
const FieldIdContext = React.createContext<string | undefined>(undefined);

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, id, ...props }, ref) => {
    const fieldId = React.useContext(FieldIdContext);
    return <input ref={ref} id={id ?? fieldId} className={cn(fieldBase, 'h-10', className)} {...props} />;
  },
);
Input.displayName = 'Input';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, id, ...props }, ref) => {
  const fieldId = React.useContext(FieldIdContext);
  return (
    <textarea
      ref={ref}
      id={id ?? fieldId}
      className={cn(fieldBase, 'min-h-[88px] py-2.5 leading-relaxed', className)}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, id, children, ...props }, ref) => {
  const fieldId = React.useContext(FieldIdContext);
  return (
    <select
      ref={ref}
      id={id ?? fieldId}
      className={cn(
        fieldBase,
        'h-10 cursor-pointer appearance-none bg-[length:16px] bg-[right_0.7rem_center] bg-no-repeat pr-9',
        "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2390a0b0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' viewBox='0 0 24 24'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});
Select.displayName = 'Select';

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('text-[0.8125rem] font-medium text-ink/90', className)}
      {...props}
    />
  );
}

export function Field({
  label,
  hint,
  error,
  className,
  children,
}: {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  const help = error ?? hint;
  const helpEl = help ? (
    <p className={cn('text-xs', error ? 'text-danger-fg dark:text-danger' : 'text-muted')}>{help}</p>
  ) : null;
  // Associate label ↔ control via htmlFor/id (through FieldIdContext) instead of
  // wrapping children in a <label> — nesting interactive controls (e.g. the
  // password-visibility toggle) inside a label is invalid and breaks a11y.
  const fieldId = React.useId();
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label ? (
        <label htmlFor={fieldId} className="text-xs+ font-medium text-ink/90">
          {label}
        </label>
      ) : null}
      <FieldIdContext.Provider value={label ? fieldId : undefined}>{children}</FieldIdContext.Provider>
      {helpEl}
    </div>
  );
}
