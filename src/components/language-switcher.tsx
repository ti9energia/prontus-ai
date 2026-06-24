'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { Check, Globe } from 'lucide-react';
import { usePathname, useRouter } from '@/i18n/routing';
import { locales, localeMeta, type Locale } from '@/i18n/routing';
import { cn } from '@/lib/utils';

export function LanguageSwitcher({ align = 'end', compact }: { align?: 'start' | 'end'; compact?: boolean }) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const [, startTransition] = React.useTransition();

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const switchTo = (l: Locale) => {
    setOpen(false);
    startTransition(() => router.replace(pathname, { locale: l }));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'inline-flex items-center gap-2 rounded-md border border-line bg-surface px-2.5 text-sm text-muted transition-colors hover:text-ink',
          compact ? 'h-8' : 'h-9',
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Globe className="h-4 w-4" />
        <span className="font-medium">{localeMeta[locale].short}</span>
      </button>
      {open && (
        <div
          className={cn(
            'absolute z-50 mt-2 w-44 overflow-hidden rounded-xl border border-hairline bg-card p-1 shadow-lg animate-scale-in',
            align === 'end' ? 'right-0' : 'left-0',
          )}
          role="listbox"
        >
          {locales.map((l) => (
            <button
              key={l}
              onClick={() => switchTo(l)}
              className={cn(
                'flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-ink/[0.05]',
                l === locale && 'bg-brand-600/[0.08]',
              )}
              role="option"
              aria-selected={l === locale}
            >
              <span className="flex items-center gap-2.5">
                <span className="text-base leading-none">{localeMeta[l].flag}</span>
                <span className={cn(l === locale && 'font-medium text-brand-700 dark:text-brand-300')}>
                  {localeMeta[l].label}
                </span>
              </span>
              {l === locale && <Check className="h-4 w-4 text-brand-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
