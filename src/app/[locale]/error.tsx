'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, Home, RotateCw } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { LogoMark } from '@/components/brand/logo';
import { buttonVariants } from '@/components/ui/button';

/**
 * Segment error boundary for every [locale] route (landing, login, app shell,
 * owner shell). The workspace has its own per-tab boundary (ScreenErrorBoundary)
 * so a crashing tab never reaches this — this one catches everything above that:
 * the page shell itself, providers, server-component render failures.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('common');
  const tn = useTranslations('notFound');

  React.useEffect(() => {
    // Last-resort client-side trace — mirrors the structured server logging in
    // instrumentation.ts. Replace with a real collector (Sentry et al.) later.
    console.error('[auronis:route-error]', { message: error.message, digest: error.digest, stack: error.stack });
  }, [error]);

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div className="bg-mesh absolute inset-0 -z-10" />
      <LogoMark size={48} />
      <div className="mt-8 grid h-14 w-14 place-items-center rounded-2xl bg-danger/12 text-danger">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h1 className="mt-5 font-display text-2xl font-bold tracking-tight">{t('states.error')}</h1>
      <p className="mt-2 max-w-md text-muted">{t('states.errorDescription')}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button onClick={reset} className={buttonVariants({ size: 'lg' })}>
          <RotateCw className="h-4 w-4" /> {t('actions.retry')}
        </button>
        <Link href="/" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
          <Home className="h-4 w-4" /> {tn('back')}
        </Link>
      </div>
    </main>
  );
}
