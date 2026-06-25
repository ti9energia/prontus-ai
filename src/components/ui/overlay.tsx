'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

function useMounted() {
  const [m, setM] = React.useState(false);
  React.useEffect(() => setM(true), []);
  return m;
}

function useEscape(open: boolean, onClose: () => void) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);
}

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Keep keyboard focus inside the dialog while open; restore it to the trigger on close. */
function useFocusTrap(open: boolean, ref: React.RefObject<HTMLElement>) {
  React.useEffect(() => {
    if (!open) return;
    const root = ref.current;
    if (!root) return;
    const restore = document.activeElement as HTMLElement | null;
    const list = () =>
      Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
    (list()[0] ?? root).focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const f = list();
      if (!f.length) {
        e.preventDefault();
        root.focus();
        return;
      }
      const first = f[0];
      const last = f[f.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === root)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    root.addEventListener('keydown', onKey);
    return () => {
      root.removeEventListener('keydown', onKey);
      restore?.focus?.();
    };
  }, [open, ref]);
}

export function Modal({
  open,
  onClose,
  children,
  title,
  description,
  size = 'md',
  className,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const mounted = useMounted();
  const t = useTranslations('common');
  const dialogRef = React.useRef<HTMLDivElement>(null);
  useEscape(open, onClose);
  useFocusTrap(open, dialogRef);
  if (!mounted || !open) return null;

  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }[size];

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-10 w-full overflow-hidden rounded-2xl border border-hairline bg-card shadow-xl animate-scale-in focus:outline-none',
          widths,
          className,
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 border-b border-hairline p-5">
            <div>
              {title && <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2>}
              {description && <p className="mt-1 text-sm text-muted">{description}</p>}
            </div>
            <button
              onClick={onClose}
              aria-label={t('actions.close')}
              className="-mr-1 -mt-1 grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-ink/[0.06] hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function Sheet({
  open,
  onClose,
  children,
  side = 'right',
  className,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  side?: 'right' | 'left';
  className?: string;
}) {
  const mounted = useMounted();
  const dialogRef = React.useRef<HTMLDivElement>(null);
  useEscape(open, onClose);
  useFocusTrap(open, dialogRef);
  if (!mounted) return null;

  return createPortal(
    <div className={cn('fixed inset-0 z-[100]', !open && 'pointer-events-none')}>
      <div
        className={cn(
          'absolute inset-0 bg-ink/40 backdrop-blur-sm transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        className={cn(
          'absolute top-0 h-full w-full max-w-md border-hairline bg-card shadow-xl transition-transform duration-300 ease-spring focus:outline-none',
          side === 'right' ? 'right-0 border-l' : 'left-0 border-r',
          open ? 'translate-x-0' : side === 'right' ? 'translate-x-full' : '-translate-x-full',
          className,
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
