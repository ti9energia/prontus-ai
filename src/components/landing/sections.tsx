'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowRight,
  AudioLines,
  BarChart3,
  CalendarClock,
  ClipboardCheck,
  FileText,
  Globe,
  KeyRound,
  Lock,
  MessageCircle,
  Mic,
  ReceiptText,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserCheck,
  Quote,
  Star,
  type LucideIcon,
} from 'lucide-react';
import { Reveal, RevealItem, RevealStagger } from './reveal';
import { Link } from '@/i18n/routing';
import { Logo } from '@/components/brand/logo';
import { buttonVariants } from '@/components/ui/button';
import { useCountUp, useInView } from '@/lib/hooks';
import { cn } from '@/lib/utils';

/* ---------------- Section header ---------------- */
function SectionHead({
  eyebrow,
  title,
  subtitle,
  center = true,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}) {
  return (
    <div className={cn('max-w-2xl', center && 'mx-auto text-center')}>
      <Reveal>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-600/10 px-3 py-1 text-2xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">
          {eyebrow}
        </span>
      </Reveal>
      <Reveal delay={0.05}>
        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      </Reveal>
      {subtitle && (
        <Reveal delay={0.1}>
          <p className="mt-3 text-base text-muted sm:text-lg">{subtitle}</p>
        </Reveal>
      )}
    </div>
  );
}

/* ---------------- Shared card ----------------
   One card primitive for Features / ForWhom / Security with deliberate,
   subtle differentiation so the three sections don't read as triplets:
   - feature  → square brand icon tile + hover glow/top hairline accent
   - role     → circular avatar-like icon (a person/role) on a quiet surface
   - security → compact horizontal row, icon wrapped in a brand ring */
function FeatureCard({
  icon: Icon,
  title,
  desc,
  variant = 'feature',
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  variant?: 'feature' | 'role' | 'security';
}) {
  if (variant === 'security') {
    return (
      <div className="flex h-full gap-4 rounded-2xl border border-hairline bg-card/80 p-5 backdrop-blur-sm transition-colors duration-300 hover:border-brand-500/30">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-600/[0.06] text-brand-600 ring-1 ring-inset ring-brand-500/35">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-display text-sm font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-muted">{desc}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="group relative h-full overflow-hidden rounded-2xl border border-hairline bg-card p-6 shadow-xs transition-all duration-300 ease-spring hover:-translate-y-1 hover:shadow-lg">
      {variant === 'feature' && (
        <>
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-500/[0.06] opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
        </>
      )}
      <div className="relative">
        <div
          className={cn(
            'grid h-11 w-11 place-items-center text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white',
            variant === 'feature'
              ? 'rounded-xl bg-brand-600/[0.1]'
              : 'rounded-full border border-hairline bg-surface',
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <h3
          className={cn(
            'mt-4 font-display font-semibold tracking-tight',
            variant === 'feature' ? 'text-lg' : 'text-base',
          )}
        >
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">{desc}</p>
      </div>
    </div>
  );
}

/* ---------------- Standards & compliance strip ----------------
   Honest credibility (real standards) instead of fabricated client logos. */
export function LogoCloud() {
  const t = useTranslations('landing.logos');
  const standards = [
    { label: 'LGPD', icon: ShieldCheck },
    { label: 'GDPR', icon: ShieldCheck },
    { label: 'PIPL', icon: ShieldCheck },
    { label: 'TISS · ANS', icon: FileText },
    { label: 'AES-256', icon: Lock },
    { label: 'Human-in-the-loop', icon: UserCheck },
    { label: 'pt · en · zh · fr', icon: Globe },
  ];
  return (
    <section className="border-y border-hairline bg-surface/40 py-10">
      <div className="container-page">
        {/* fade-only reveal — quieter than the sliding sections around it */}
        <Reveal fade>
          <p className="text-center text-2xs font-medium uppercase tracking-widest text-muted">{t('title')}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2.5">
            {standards.map(({ label, icon: Icon }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-card/60 px-3 py-1.5 text-xs font-medium text-muted"
              >
                <Icon className="h-3.5 w-3.5 text-brand-500" />
                {label}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- Stats ---------------- */
function StatItem({
  value,
  suffix,
  prefix,
  label,
  active,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  active: boolean;
}) {
  const n = useCountUp(value, active);
  return (
    <div className="text-center">
      <p className="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
        {prefix}
        <span className="tnum">{Math.round(n)}</span>
        <span className="text-gradient">{suffix}</span>
      </p>
      <p className="mt-2 text-sm text-muted">{label}</p>
    </div>
  );
}

export function Stats() {
  const t = useTranslations('landing.stats');
  const { ref, inView } = useInView<HTMLDivElement>();
  const items = [
    { value: 42, suffix: 'h', label: t('timeSaved') },
    { value: 68, suffix: '%', prefix: '−', label: t('glossDrop') },
    { value: 12, suffix: 's', label: t('noteTime') },
    { value: 4, suffix: '', label: t('languages') },
  ];
  return (
    <section className="py-16 sm:py-24" ref={ref}>
      <div className="container-page">
        {/* fade-only reveal — the count-up already provides the motion here */}
        <Reveal fade>
          <div className="relative overflow-hidden rounded-3xl border border-hairline bg-card/60 px-6 py-12 shadow-xs backdrop-blur-sm sm:px-10">
            {/* soft brand glow accent */}
            <div
              aria-hidden
              className="absolute -top-1/3 left-1/2 h-64 w-[42rem] max-w-full -translate-x-1/2 rounded-full bg-brand-500/[0.08] blur-3xl"
            />
            <div className="relative grid grid-cols-2 gap-y-10 sm:gap-8 lg:grid-cols-4">
              {items.map((it, i) => (
                <div key={i} className={cn('lg:px-2', i > 0 && 'lg:border-l lg:border-hairline')}>
                  <StatItem {...it} active={inView} />
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- Features (bento) ---------------- */
export function Features() {
  const t = useTranslations('landing.features');
  const items = [
    { key: 'live', icon: Mic, span: 'sm:col-span-2 sm:row-span-1' },
    { key: 'note', icon: FileText, span: '' },
    { key: 'tiss', icon: ClipboardCheck, span: '' },
    { key: 'gloss', icon: ShieldCheck, span: '' },
    { key: 'copilot', icon: Sparkles, span: 'sm:col-span-2' },
    { key: 'whatsapp', icon: MessageCircle, span: '' },
  ] as const;

  return (
    <section id="features" className="scroll-mt-24 py-16 sm:py-24">
      <div className="container-page">
        {/* left-anchored head — varies the rhythm vs the centered sections */}
        <SectionHead eyebrow={t('eyebrow')} title={t('title')} subtitle={t('subtitle')} center={false} />
        <RevealStagger className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {items.map(({ key, icon: Icon, span }) => (
            <RevealItem key={key} className={span}>
              <FeatureCard
                icon={Icon}
                title={t(`items.${key}.title` as 'items.live.title')}
                desc={t(`items.${key}.desc` as 'items.live.desc')}
              />
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}

/* ---------------- How it works ---------------- */
export function How() {
  const t = useTranslations('landing.how');
  const steps = [
    { key: 'record', icon: Mic },
    { key: 'structure', icon: AudioLines },
    { key: 'review', icon: ClipboardCheck },
    { key: 'submit', icon: FileText },
  ] as const;

  return (
    <section id="how" className="scroll-mt-24 border-y border-hairline bg-surface/40 py-16 sm:py-24">
      <div className="container-page">
        <SectionHead eyebrow={t('eyebrow')} title={t('title')} />
        <div className="relative mt-14">
          <div className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-brand-500/30 to-transparent lg:block" />
          <RevealStagger className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ key, icon: Icon }, i) => (
              <RevealItem key={key}>
                <div className="relative text-center">
                  <div className="relative z-10 mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-hairline bg-card shadow-md">
                    <Icon className="h-6 w-6 text-brand-600" />
                    <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-brand-600 font-mono text-2xs font-bold text-white">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-base font-semibold">
                    {t(`steps.${key}.title` as 'steps.record.title')}
                  </h3>
                  <p className="mx-auto mt-1.5 max-w-[15rem] text-sm text-muted">
                    {t(`steps.${key}.desc` as 'steps.record.desc')}
                  </p>
                </div>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Who it's for (the whole clinic team) ----------------
   Maps the product to the real roles a clinic runs on (ties to the RBAC model):
   physician · front desk · billing · management — each with a concrete payoff. */
export function ForWhom() {
  const t = useTranslations('landing.forWhom');
  const roles = [
    { icon: Stethoscope, key: 'medico' as const },
    { icon: CalendarClock, key: 'recepcao' as const },
    { icon: ReceiptText, key: 'faturamento' as const },
    { icon: BarChart3, key: 'gestao' as const },
  ];
  return (
    <section className="py-16 sm:py-24">
      <div className="container-page">
        <SectionHead eyebrow={t('eyebrow')} title={t('title')} subtitle={t('subtitle')} />
        <RevealStagger className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {roles.map(({ icon: Icon, key }) => (
            <RevealItem key={key}>
              <FeatureCard
                variant="role"
                icon={Icon}
                title={t(`roles.${key}.role` as 'roles.medico.role')}
                desc={t(`roles.${key}.desc` as 'roles.medico.desc')}
              />
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}

/* ---------------- Security ---------------- */
export function Security() {
  const t = useTranslations('landing.security');
  const items = [
    { key: 'lgpd', icon: Lock },
    { key: 'crypto', icon: KeyRound },
    { key: 'audit', icon: ScrollText },
    { key: 'hitl', icon: UserCheck },
  ] as const;
  return (
    <section id="security" className="scroll-mt-24 py-16 sm:py-24">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-3xl border border-hairline bg-surface/50 p-8 sm:p-12">
          <div aria-hidden className="absolute inset-0 bg-grid opacity-[0.35] mask-b" />
          <div aria-hidden className="absolute -right-24 -top-10 h-72 w-72 rounded-full bg-brand-500/[0.07] blur-3xl" />
          <div className="relative grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <SectionHead eyebrow={t('eyebrow')} title={t('title')} subtitle={t('subtitle')} center={false} />
            </div>
            <RevealStagger className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {items.map(({ key, icon: Icon }) => (
                <RevealItem key={key}>
                  <FeatureCard
                    variant="security"
                    icon={Icon}
                    title={t(`items.${key}.title` as 'items.lgpd.title')}
                    desc={t(`items.${key}.desc` as 'items.lgpd.desc')}
                  />
                </RevealItem>
              ))}
            </RevealStagger>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Testimonials ---------------- */
function TestimonialCard({
  quote,
  name,
  role,
  starsLabel,
}: {
  quote: string;
  name: string;
  role: string;
  starsLabel: string;
}) {
  return (
    <figure className="flex h-full flex-col rounded-2xl border border-hairline bg-card p-6 shadow-xs">
      <Quote className="h-6 w-6 text-brand-500/40" aria-hidden />
      <div className="mt-2 flex gap-0.5" role="img" aria-label={starsLabel}>
        {Array.from({ length: 5 }).map((_, s) => (
          <Star key={s} className="h-3.5 w-3.5 fill-accent-400 text-accent-400" aria-hidden />
        ))}
      </div>
      <blockquote className="mt-3 flex-1 font-display text-lg leading-snug tracking-tight">
        &ldquo;{quote}&rdquo;
      </blockquote>
      <figcaption className="mt-5">
        <p className="text-sm font-semibold">{name}</p>
        <p className="text-2xs text-muted">{role}</p>
      </figcaption>
    </figure>
  );
}

export function Testimonials() {
  const t = useTranslations('landing.testimonials');
  const cards = [
    { quote: t('items.0.quote'), name: t('items.0.name'), role: t('items.0.role') },
    { quote: t('items.1.quote'), name: t('items.1.name'), role: t('items.1.role') },
    { quote: t('items.2.quote'), name: t('items.2.name'), role: t('items.2.role') },
  ];
  return (
    <section id="customers" className="scroll-mt-24 border-y border-hairline bg-surface/40 py-16 sm:py-24">
      <div className="container-page">
        <SectionHead eyebrow={t('eyebrow')} title={t('title')} />
        <RevealStagger className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          {cards.map((c, i) => (
            <RevealItem key={i}>
              <TestimonialCard {...c} starsLabel={t('stars')} />
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}

/* ---------------- Final CTA ---------------- */
export function FinalCTA() {
  const t = useTranslations('landing.cta');
  return (
    <section className="py-16 sm:py-24">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-3xl border border-hairline bg-brand-900 px-6 py-16 text-center shadow-xl sm:px-12">
          <div className="absolute inset-0 bg-aurora opacity-90" />
          <div className="noise absolute inset-0" />
          <div className="relative">
            <Reveal>
              <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {t('title')}
              </h2>
            </Reveal>
            <Reveal delay={0.06}>
              <p className="mx-auto mt-3 max-w-xl text-brand-50/80">{t('subtitle')}</p>
            </Reveal>
            <Reveal delay={0.12}>
              <Link
                href="/login"
                className={buttonVariants({
                  size: 'lg',
                  className: 'mt-8 bg-white text-brand-700 hover:bg-white hover:opacity-90 hover:shadow-xl',
                })}
              >
                {t('button')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Footer ---------------- */
export function Footer() {
  const t = useTranslations('landing.footer');
  const tc = useTranslations('common');
  // Every footer link points at a real destination — section anchors on the
  // landing (routed via '/' so they also work from the legal pages) or the
  // legal/contact routes. No placeholders in production.
  const cols: { title: string; links: { label: string; href: string }[] }[] = [
    {
      title: t('cols.product'),
      links: [
        { label: t('links.features'), href: '/#features' },
        { label: t('links.pricing'), href: '/#pricing' },
        { label: t('links.security'), href: '/#security' },
      ],
    },
    {
      title: t('cols.company'),
      links: [{ label: t('links.contact'), href: '/contact' }],
    },
    {
      title: t('cols.legal'),
      links: [
        { label: t('links.privacy'), href: '/privacy' },
        { label: t('links.terms'), href: '/terms' },
        { label: t('links.lgpd'), href: '/lgpd' },
      ],
    },
  ];
  return (
    <footer className="border-t border-hairline py-12">
      <div className="container-page">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          <div className="col-span-2">
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-muted">{tc('tagline')}</p>
            <p className="mt-1.5 max-w-xs text-2xs text-muted">{t('madeWith')}</p>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <p className="text-2xs font-semibold uppercase tracking-wide text-muted">{c.title}</p>
              <ul className="mt-3 space-y-2">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-muted transition-colors hover:text-ink">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-hairline pt-6 text-2xs text-muted sm:flex-row">
          <p>© {new Date().getFullYear()} Auronis Health — {t('rights')}</p>
          <p className="font-mono">pt-BR · en · zh-CN · fr-FR</p>
        </div>
      </div>
    </footer>
  );
}
