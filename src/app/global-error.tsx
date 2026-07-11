'use client';

import * as React from 'react';
import Link from 'next/link';

/**
 * Root error boundary — only fires if the [locale] layout itself throws
 * (provider setup, font loading, etc.), so [locale]/error.tsx is unreachable.
 * Next.js requires this file to render its own <html>/<body> and forbids
 * relying on anything the crashed layout might have provided (i18n, theme,
 * design-system components) — kept deliberately dependency-free and inlined.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error('[auronis:global-error]', { message: error.message, digest: error.digest, stack: error.stack });
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.25rem',
          padding: '1.5rem',
          textAlign: 'center',
          background: '#090b0f',
          color: '#f4f6f8',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(239,68,68,0.14)',
            color: '#f87171',
            fontSize: 26,
          }}
          aria-hidden
        >
          !
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Algo deu muito errado</h1>
        <p style={{ maxWidth: 360, color: '#9aa4b2', margin: 0 }}>
          O aplicativo encontrou um erro inesperado ao carregar. Tente novamente — se persistir, recarregue a página.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={reset}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: 8,
              border: 'none',
              background: '#14c8c4',
              color: '#06201f',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            Tentar novamente
          </button>
          <Link
            href="/"
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: 8,
              border: '1px solid #2a3038',
              color: '#f4f6f8',
              fontWeight: 600,
              fontSize: '0.9rem',
              textDecoration: 'none',
            }}
          >
            Voltar ao início
          </Link>
        </div>
      </body>
    </html>
  );
}
