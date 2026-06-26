'use client';

import { useTranslations } from 'next-intl';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, Play, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Aurora } from './aurora';
import { HeroDemo } from './hero-demo';
import { buttonVariants } from '@/components/ui/button';

export function Hero() {
  const t = useTranslations('landing.hero');
  const tb = useTranslations('brand');

  // Pointer-driven 3D tilt on the product preview (disabled for reduced motion).
  const reduce = useReducedMotion();
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [7, -7]), { stiffness: 150, damping: 20 });
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-9, 9]), { stiffness: 150, damping: 20 });
  const onTilt = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const resetTilt = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <section className="relative overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-24">
      <Aurora />
      <div className="container-page relative">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
          {/* copy */}
          <div className="max-w-xl">
            {/* category eyebrow — clear context in 3s, no fake proof */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2 rounded-full border border-hairline bg-surface/60 px-3 py-1 text-2xs font-medium text-muted backdrop-blur"
            >
              <Sparkles className="h-3.5 w-3.5 text-brand-500" />
              {tb('promiseShort')}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.06 }}
              className="mt-6 font-display text-[2.7rem] font-bold leading-[1.04] tracking-[-0.035em] sm:text-[3.9rem]"
            >
              {t('title')}
              <span className="mt-1 block text-gradient">{t('titleHighlight')}</span>
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

          {/* demo — pointer-driven 3D tilt for depth */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            onMouseMove={onTilt}
            onMouseLeave={resetTilt}
            style={{ perspective: 1200 }}
            className="relative"
          >
            <motion.div style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }} className="relative">
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
          </motion.div>
        </div>
      </div>
    </section>
  );
}
