'use client';

import * as React from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';

interface State {
  hasError: boolean;
  error?: Error;
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
        <div className="grid h-full place-items-center p-8">
          <div className="max-w-sm text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-danger/12 text-danger">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <p className="mt-4 font-display text-base font-semibold">Algo deu errado nesta aba</p>
            <p className="mt-1 text-sm text-muted">{this.state.error?.message ?? 'Erro inesperado.'}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="mt-4 inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-medium hover:bg-ink/[0.05]"
            >
              <RotateCw className="h-4 w-4" /> Recarregar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
