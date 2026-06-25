'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useToasts, dismissToast, type ToastTone } from '@/lib/toast';
import { cn } from '@/lib/utils';

const TONE: Record<ToastTone, { icon: typeof Info; cls: string }> = {
  success: { icon: CheckCircle2, cls: 'text-success' },
  error: { icon: AlertCircle, cls: 'text-danger' },
  info: { icon: Info, cls: 'text-brand-500' },
};

export function Toaster() {
  const toasts = useToasts();
  const tt = useTranslations('common');
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[200] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6">
      {toasts.map((t) => {
        const { icon: Icon, cls } = TONE[t.tone];
        return (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-hairline bg-card p-3.5 shadow-lg animate-fade-up"
          >
            <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', cls)} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-snug">{t.title}</p>
              {t.description && <p className="mt-0.5 text-xs text-muted">{t.description}</p>}
            </div>
            <button
              onClick={() => dismissToast(t.id)}
              className="-mr-1 -mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md text-subtle transition-colors hover:bg-ink/[0.06] hover:text-ink"
              aria-label={tt('actions.close')}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>,
    document.body,
  );
}
