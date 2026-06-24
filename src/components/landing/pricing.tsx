'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Check, Sparkles } from 'lucide-react';
import { Reveal } from './reveal';
import { Link } from '@/i18n/routing';
import { SegmentedControl } from '@/components/ui/misc';
import { buttonVariants } from '@/components/ui/button';
import { formatCurrency, cn } from '@/lib/utils';

const PLANS = [
  { id: 'starter', price: 99, features: ['live', 'note', 'copilot'], cta: 'ctaStart', variant: 'outline' as const },
  { id: 'pro', price: 199, popular: true, features: ['live', 'note', 'tiss', 'gloss', 'copilot', 'whatsapp'], cta: 'ctaStart', variant: 'primary' as const },
  { id: 'scale', price: 349, features: ['live', 'note', 'tiss', 'gloss', 'copilot', 'whatsapp'], cta: 'ctaContact', variant: 'secondary' as const },
];

export function Pricing() {
  const t = useTranslations('landing.pricing');
  const tf = useTranslations('landing.features.items');
  const locale = useLocale();
  const [cycle, setCycle] = React.useState<'monthly' | 'yearly'>('monthly');

  return (
    <section id="pricing" className="scroll-mt-24 py-16 sm:py-24">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-600/10 px-3 py-1 text-2xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">
              {t('eyebrow')}
            </span>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">{t('title')}</h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-3 text-base text-muted sm:text-lg">{t('subtitle')}</p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-6 flex items-center justify-center gap-3">
              <SegmentedControl
                value={cycle}
                onChange={setCycle}
                options={[
                  { value: 'monthly', label: t('billingMonthly') },
                  { value: 'yearly', label: t('billingYearly') },
                ]}
              />
              <span className="rounded-full bg-accent-400/12 px-2 py-0.5 text-2xs font-semibold text-accent-600">
                {t('yearlyHint')}
              </span>
            </div>
          </Reveal>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-5 lg:grid-cols-3">
          {PLANS.map((plan, i) => {
            const monthly = cycle === 'yearly' ? Math.round((plan.price * 10) / 12) : plan.price;
            return (
              <Reveal key={plan.id} delay={i * 0.07}>
                <div
                  className={cn(
                    'relative flex h-full flex-col rounded-2xl border bg-card p-6 shadow-xs transition-all duration-300',
                    plan.popular
                      ? 'border-brand-500/40 shadow-glow lg:-translate-y-3 lg:scale-[1.02]'
                      : 'border-hairline hover:-translate-y-1 hover:shadow-md',
                  )}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-brand-600 px-3 py-1 text-2xs font-semibold text-white shadow-md">
                      <Sparkles className="h-3 w-3" /> {t('popular')}
                    </span>
                  )}
                  <h3 className="font-display text-lg font-bold capitalize">{plan.id}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="font-display text-4xl font-bold tracking-tight">
                      {formatCurrency(monthly, locale, 'BRL')}
                    </span>
                    <span className="text-sm text-muted">{t('perMonth')}</span>
                  </div>

                  <ul className="mt-6 flex-1 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                        <span className="text-ink/90">{tf(`${f}.title` as 'live.title')}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/login"
                    className={buttonVariants({ variant: plan.variant, size: 'lg', className: 'mt-7 w-full' })}
                  >
                    {t(plan.cta as 'ctaStart')}
                  </Link>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
