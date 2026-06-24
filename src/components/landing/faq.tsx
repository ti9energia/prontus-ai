'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { Reveal } from './reveal';
import { cn } from '@/lib/utils';

export function FAQ() {
  const t = useTranslations('landing.faq');
  const keys = ['q1', 'q2', 'q3', 'q4', 'q5'];
  const [open, setOpen] = React.useState<string | null>('q1');

  return (
    <section className="py-16 sm:py-24">
      <div className="container-page">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <Reveal>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-600/10 px-3 py-1 text-2xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">
                {t('eyebrow')}
              </span>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">{t('title')}</h2>
            </Reveal>
          </div>

          <div className="mt-10 divide-y divide-hairline rounded-2xl border border-hairline bg-card">
            {keys.map((k) => {
              const isOpen = open === k;
              return (
                <div key={k}>
                  <button
                    onClick={() => setOpen(isOpen ? null : k)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="font-display text-base font-medium">
                      {t(`items.${k}.q` as 'items.q1.q')}
                    </span>
                    <Plus
                      className={cn(
                        'h-5 w-5 shrink-0 text-muted transition-transform duration-300',
                        isOpen && 'rotate-45 text-brand-600',
                      )}
                    />
                  </button>
                  <div
                    className={cn(
                      'grid overflow-hidden transition-all duration-300 ease-spring',
                      isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                    )}
                  >
                    <div className="min-h-0">
                      <p className="px-5 pb-5 text-sm leading-relaxed text-muted">
                        {t(`items.${k}.a` as 'items.q1.a')}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
