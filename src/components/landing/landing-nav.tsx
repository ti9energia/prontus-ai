'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, Menu, X } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Logo } from '@/components/brand/logo';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeToggle } from '@/components/theme-provider';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function LandingNav() {
  const t = useTranslations('landing.nav');
  const tc = useTranslations('common.actions');
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState('');

  const links = React.useMemo(
    () => [
      { href: '#features', label: t('product') },
      { href: '#how', label: t('howItWorks') },
      { href: '#security', label: t('security') },
      { href: '#pricing', label: t('pricing') },
      { href: '#customers', label: t('customers') },
    ],
    [t],
  );

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Scroll-spy — highlight the section currently centered in the viewport.
  React.useEffect(() => {
    const sections = links
      .map((l) => document.getElementById(l.href.slice(1)))
      .filter((el): el is HTMLElement => !!el);
    if (!sections.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (top) setActive(`#${top.target.id}`);
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: [0, 0.5, 1] },
    );
    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, [links]);

  // Close the mobile sheet on Escape.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className={cn('container-page transition-all duration-300', scrolled ? 'pt-2.5' : 'pt-4')}>
        <div
          className={cn(
            'flex items-center justify-between gap-4 rounded-2xl px-3 transition-all duration-300',
            scrolled
              ? 'glass border border-hairline py-1.5 shadow-lg shadow-ink/[0.05]'
              : 'border border-transparent py-2.5',
          )}
        >
          <Link href="/" className="flex shrink-0 items-center pl-1" aria-label="Aureon Health">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-0.5 md:flex">
            {links.map((l) => {
              const isActive = active === l.href;
              return (
                <a
                  key={l.href}
                  href={l.href}
                  aria-current={isActive ? 'true' : undefined}
                  className={cn(
                    'relative rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'text-ink' : 'text-muted hover:text-ink',
                  )}
                >
                  {isActive && <span className="absolute inset-0 -z-10 rounded-lg bg-ink/[0.05]" />}
                  {l.label}
                </a>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-1.5 sm:flex">
              <ThemeToggle compact />
              <LanguageSwitcher />
            </div>
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'hidden sm:inline-flex')}
            >
              {tc('signIn')}
            </Link>
            <Link
              href="/login"
              className={buttonVariants({ variant: 'primary', size: 'sm', className: 'hidden shadow-sm sm:inline-flex' })}
            >
              {tc('tryFree')}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              onClick={() => setOpen((o) => !o)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-line text-ink md:hidden"
              aria-label={tc('openMenu')}
              aria-expanded={open}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="mt-2 md:hidden">
            <div className="flex flex-col gap-1 rounded-2xl border border-hairline bg-card p-2 shadow-lg animate-scale-in">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-ink/[0.05]"
                >
                  {l.label}
                </a>
              ))}
              <div className="my-1 h-px bg-hairline" />
              <div className="flex items-center justify-between px-2 py-1">
                <ThemeToggle compact />
                <LanguageSwitcher />
              </div>
              <Link href="/login" className={buttonVariants({ variant: 'outline', size: 'sm', className: 'mt-1' })}>
                {tc('signIn')}
              </Link>
              <Link href="/login" className={buttonVariants({ variant: 'primary', size: 'sm' })}>
                {tc('tryFree')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
