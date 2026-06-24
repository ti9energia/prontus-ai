'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { ArrowRight, Play, ShieldCheck, Star } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Aurora } from './aurora';
import { HeroDemo } from './hero-demo';
import { Avatar } from '@/components/ui/misc';
import { buttonVariants } from '@/components/ui/button';

const PROOF = [
  { name: 'Helena Vasconcelos', hue: 170 },
  { name: 'Camila Prado', hue: 28 },
  { name: 'Rodrigo Menezes', hue: 210 },
  { name: 'Antônio Ferreira', hue: 320 },
];

export function Hero() {
  const t = useTranslations('landing.hero');
  const tl = useTranslations('landing');

  return (
    <section className="relative overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-24">
      <Aurora />
      <div className="container-page relative">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
          {/* copy */}
          <div className="max-w-xl">
            {/* social proof */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-3"
            >
              <div className="flex -space-x-2.5">
                {PROOF.map((p) => (
                  <Avatar key={p.name} name={p.name} hue={p.hue} size={30} className="ring-2 ring-bg" />
                ))}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-accent-400 text-accent-400" />
                  ))}
                </div>
                <span className="text-2xs text-muted">{tl('logos.title')}</span>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.06 }}
              className="mt-6 font-display text-[2.75rem] font-bold leading-[1.0] tracking-[-0.035em] sm:text-[3.75rem]"
            >
              {t('title')}{' '}
              <span className="relative whitespace-nowrap">
                <span className="text-gradient">{t('titleHighlight')}</span>
                <svg
                  aria-hidden
                  viewBox="0 0 300 12"
                  className="absolute -bottom-1 left-0 h-2.5 w-full text-brand-400/50"
                  preserveAspectRatio="none"
                >
                  <path d="M2 9 C 80 2, 220 2, 298 8" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
                </svg>
              </span>
              .
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.14 }}
              className="mt-6 text-base leading-relaxed text-muted sm:text-lg"
            >
              {t('subtitle')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.22 }}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <Link href="/login" className={buttonVariants({ variant: 'primary', size: 'lg', className: 'group' })}>
                {t('ctaPrimary')}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a href="#how" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
                <Play className="h-4 w-4" />
                {t('ctaSecondary')}
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.36 }}
              className="mt-7 flex items-center gap-2 text-2xs text-subtle"
            >
              <ShieldCheck className="h-4 w-4 text-brand-500" />
              <span>{t('trust')}</span>
            </motion.div>
          </div>

          {/* demo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="relative"
          >
            <HeroDemo />

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="absolute -left-4 top-16 hidden rounded-xl border border-hairline bg-card/90 px-3 py-2 shadow-lg backdrop-blur md:block animate-float"
            >
              <p className="font-display text-lg font-bold text-brand-600">−68%</p>
              <p className="text-2xs text-muted">glosa</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85, duration: 0.6 }}
              className="absolute -right-3 bottom-20 hidden rounded-xl border border-hairline bg-card/90 px-3 py-2 shadow-lg backdrop-blur md:block animate-float"
              style={{ animationDelay: '-3s' }}
            >
              <p className="font-display text-lg font-bold text-accent-500">+2h</p>
              <p className="text-2xs text-muted">/ dia</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
