'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, RotateCw } from 'lucide-react';

interface State {
  hasError: boolean;
  error?: Error;
}

/** Localized fallback UI. Lives in a function component so it can use next-intl;
 *  the i18n provider sits above every screen, so it's available even when a tab
 *  crashes. Reuses existing common.* keys (no new catalog entries needed). */
function ErrorFallback({ message, onReset }: { message?: string; onReset: () => void }) {
  const t = useTranslations('common');
  return (
    <div className="grid h-full place-items-center p-8">
      <div className="max-w-sm text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-danger/12 text-danger">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <p className="mt-4 font-display text-base font-semibold">{t('states.error')}</p>
        <p className="mt-1 text-sm text-muted">{message || t('states.errorDescription')}</p>
        <button
          onClick={onReset}
          className="mt-4 inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-medium hover:bg-ink/[0.05]"
        >
          <RotateCw className="h-4 w-4" /> {t('actions.retry')}
        </button>
      </div>
    </div>
  );
}

export class ScreenErrorBoundary extends React.Component<
  { children: React.ReactNode; resetKey?: string },
  State
> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidUpdate(prev: { resetKey?: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: undefined });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          message={this.state.error?.message}
          onReset={() => this.setState({ hasError: false, error: undefined })}
        />
      );
    }
    return this.props.children;
  }
}
