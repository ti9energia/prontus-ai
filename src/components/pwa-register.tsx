'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { RotateCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Registers the service worker and — the actual "update flow" the PWA gate
 * asks for — detects when a NEW version has installed and is sitting in
 * `waiting`, then lets the person choose to activate it instead of the SW
 * silently taking over (which would yank the UI mid-task) or the app being
 * stuck on stale cache forever (no prompt at all).
 */
export function PWARegister() {
  const t = useTranslations('pwa');
  const [waitingWorker, setWaitingWorker] = React.useState<ServiceWorker | null>(null);
  const [dismissed, setDismissed] = React.useState(false);
  const reloadedRef = React.useRef(false);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    // Only register in production builds to avoid caching the dev server.
    if (process.env.NODE_ENV !== 'production') return;

    const onLoad = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');

        // A worker already waiting from a previous visit (e.g. tab reopened
        // after an update installed while the app was closed).
        if (registration.waiting && navigator.serviceWorker.controller) {
          setWaitingWorker(registration.waiting);
        }

        registration.addEventListener('updatefound', () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            if (installing.state !== 'installed') return;
            if (!navigator.serviceWorker.controller) {
              // First-ever install for this visitor — nothing to disrupt, no prompt needed.
              return;
            }
            // A real update: an old SW was already controlling this page.
            setWaitingWorker(installing);
          });
        });
      } catch {
        // Registration failing must never break the app.
      }
    };

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloadedRef.current) return;
      reloadedRef.current = true;
      window.location.reload();
    });

    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  const applyUpdate = () => {
    waitingWorker?.postMessage('SKIP_WAITING');
  };

  if (!waitingWorker || dismissed) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-4 z-[90] mx-auto flex max-w-sm items-center gap-3 rounded-xl border border-hairline bg-card p-3.5 shadow-xl animate-fade-up sm:inset-x-auto sm:right-4"
    >
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-600/10 text-brand-600">
        <RotateCw className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{t('updateTitle')}</p>
        <p className="text-xs text-muted">{t('updateDescription')}</p>
      </div>
      <Button size="sm" onClick={applyUpdate}>
        {t('updateAction')}
      </Button>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label={t('updateDismiss')}
        className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-subtle hover:bg-ink/[0.06] hover:text-ink"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
