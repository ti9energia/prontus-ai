'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, Menu, X } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Logo } from '@/components/brand/logo';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeToggle } from '@/components/theme-provider';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function LandingNav() {
  const t = useTranslations('landing.nav');
  const tc = useTranslations('common.actions');
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { href: '#features', label: t('product') },
    { href: '#how', label: t('howItWorks') },
    { href: '#security', label: t('security') },
    { href: '#pricing', label: t('pricing') },
    { href: '#customers', label: t('customers') },
  ];

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled ? 'border-b border-hairline glass py-2.5' : 'border-b border-transparent py-4',
      )}
    >
      <div className="container-page flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center" aria-label="Prontus.ai">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <ThemeToggle compact />
            <LanguageSwitcher />
          </div>
          <Link href="/login" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'hidden sm:inline-flex')}>
            {tc('signIn')}
          </Link>
          <Link href="/login" className={buttonVariants({ variant: 'primary', size: 'sm', className: 'hidden sm:inline-flex' })}>
            {tc('tryFree')}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            onClick={() => setOpen((o) => !o)}
            className="grid h-9 w-9 place-items-center rounded-md border border-line text-ink md:hidden"
            aria-label={tc('openMenu')}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="container-page mt-2 md:hidden">
          <div className="flex flex-col gap-1 rounded-xl border border-hairline bg-card p-2 shadow-lg animate-scale-in">
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
    </header>
  );
}
