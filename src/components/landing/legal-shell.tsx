import { ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Logo } from '@/components/brand/logo';
import { Footer } from './sections';

/**
 * Shared shell for legal/institutional pages (privacy, terms, LGPD, contact):
 * a simple top bar back to the landing, a readable single-column article, and
 * the standard footer. Server component — pages pass already-translated text.
 */
export function LegalShell({
  back,
  title,
  updated,
  intro,
  children,
}: {
  /** Label for the "back to home" link. */
  back: string;
  title: string;
  /** Localized "last updated" line (omit on the contact page). */
  updated?: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="border-b border-hairline">
        <div className="container-page flex items-center justify-between py-4">
          <Link href="/" aria-label="Auronis Health">
            <Logo />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {back}
          </Link>
        </div>
      </header>

      <main className="flex-1 py-12 sm:py-16">
        <div className="container-page">
          <article className="mx-auto max-w-3xl">
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
            {updated && <p className="mt-2 text-xs text-muted">{updated}</p>}
            {intro && <p className="mt-5 text-base leading-relaxed text-muted">{intro}</p>}
            <div className="mt-10 space-y-8">{children}</div>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export function LegalSection({ heading, body }: { heading: string; body: string }) {
  return (
    <section>
      <h2 className="font-display text-lg font-semibold tracking-tight">{heading}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
    </section>
  );
}
