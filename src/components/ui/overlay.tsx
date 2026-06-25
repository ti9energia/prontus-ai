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
  useEscape(open, onClose);
  if (!mounted || !open) return null;

  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }[size];

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-10 w-full overflow-hidden rounded-2xl border border-hairline bg-card shadow-xl animate-scale-in',
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
  useEscape(open, onClose);
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
        role="dialog"
        aria-modal="true"
        className={cn(
          'absolute top-0 h-full w-full max-w-md border-hairline bg-card shadow-xl transition-transform duration-300 ease-spring',
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
