'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, FileText, Sparkles, Stethoscope } from 'lucide-react';
import { AudioWave } from '@/components/visual/audio-wave';
import { Avatar } from '@/components/ui/misc';
import { clock } from '@/lib/utils';

type Line = { who: 'doctor' | 'patient'; text: string };

const SCRIPT: Record<string, { lines: Line[]; note: Record<string, string> }> = {
  'pt-BR': {
    lines: [
      { who: 'patient', text: 'Doutora, estou com dor de cabeça quase toda manhã.' },
      { who: 'doctor', text: 'Há quanto tempo? Sente tontura junto?' },
      { who: 'patient', text: 'Umas duas semanas. E um pouco de tontura, sim.' },
      { who: 'doctor', text: 'Sua pressão tem subido. Vou ajustar sua medicação.' },
    ],
    note: {
      queixa: 'Cefaleia matinal recorrente há 2 semanas com tontura.',
      hma: 'Cefaleia pulsátil, PA domiciliar elevada (150/95).',
      conduta: 'Ajuste de losartana, ECG e retorno em 30 dias.',
    },
  },
  en: {
    lines: [
      { who: 'patient', text: 'Doctor, I get headaches almost every morning.' },
      { who: 'doctor', text: 'For how long? Any dizziness with it?' },
      { who: 'patient', text: 'About two weeks. And a bit of dizziness, yes.' },
      { who: 'doctor', text: 'Your blood pressure is up. Let’s adjust your meds.' },
    ],
    note: {
      queixa: 'Recurrent morning headache for 2 weeks with dizziness.',
      hma: 'Pulsatile headache, elevated home BP (150/95).',
      conduta: 'Adjust losartan, order ECG, follow-up in 30 days.',
    },
  },
  'zh-CN': {
    lines: [
      { who: 'patient', text: '医生，我几乎每天早上都头痛。' },
      { who: 'doctor', text: '持续多久了？会伴有头晕吗？' },
      { who: 'patient', text: '大约两周了，是的，有点头晕。' },
      { who: 'doctor', text: '你的血压升高了，我来调整一下用药。' },
    ],
    note: {
      queixa: '晨起反复头痛两周，伴头晕。',
      hma: '搏动性头痛，家庭血压偏高（150/95）。',
      conduta: '调整氯沙坦，开心电图，30天后复诊。',
    },
  },
  'fr-FR': {
    lines: [
      { who: 'patient', text: 'Docteur, j’ai mal à la tête presque chaque matin.' },
      { who: 'doctor', text: 'Depuis combien de temps ? Des vertiges aussi ?' },
      { who: 'patient', text: 'Environ deux semaines. Et un peu de vertiges, oui.' },
      { who: 'doctor', text: 'Votre tension monte. Ajustons votre traitement.' },
    ],
    note: {
      queixa: 'Céphalées matinales récurrentes depuis 2 semaines.',
      hma: 'Céphalée pulsatile, tension élevée à domicile (150/95).',
      conduta: 'Ajuster le losartan, ECG, contrôle dans 30 jours.',
    },
  },
};

export function HeroDemo() {
  const locale = useLocale();
  const t = useTranslations('encounter');
  const tl = useTranslations('landing.hero');
  const data = SCRIPT[locale] ?? SCRIPT['pt-BR'];

  const [seconds, setSeconds] = React.useState(0);
  const [visible, setVisible] = React.useState(0);
  const [noteStep, setNoteStep] = React.useState(0);
  const [guide, setGuide] = React.useState(false);

  React.useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    let mounted = true;
    const run = async () => {
      while (mounted) {
        setVisible(0);
        setNoteStep(0);
        setGuide(false);
        for (let i = 1; i <= data.lines.length; i++) {
          await wait(1300);
          if (!mounted) return;
          setVisible(i);
          if (i >= 2) setNoteStep((n) => Math.min(3, n + 1));
        }
        await wait(900);
        if (!mounted) return;
        setNoteStep(3);
        await wait(900);
        if (!mounted) return;
        setGuide(true);
        await wait(3600);
      }
    };
    run();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  const noteKeys = ['queixa', 'hma', 'conduta'] as const;

  return (
    <div className="relative w-full select-none">
      {/* glow */}
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-brand-500/10 blur-3xl" />
      <div className="overflow-hidden rounded-2xl border border-hairline bg-card shadow-xl">
        {/* window chrome */}
        <div className="flex items-center gap-2 border-b border-hairline bg-surface/60 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          <div className="ml-2 truncate font-mono text-2xs text-subtle">aureonhealth.com/app/encounter</div>
        </div>

        {/* header */}
        <div className="flex items-center justify-between gap-3 px-4 pt-4">
          <div className="flex items-center gap-2.5">
            <Avatar name="Marina Albuquerque" hue={28} size={36} />
            <div>
              <p className="text-sm font-semibold leading-tight">Marina Albuquerque</p>
              <p className="text-2xs text-muted">{t('with', { name: 'Dra. Helena' })}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-accent-400/10 px-2.5 py-1">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-400 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-500" />
            </span>
            <span className="font-mono text-2xs font-semibold tracking-wide text-accent-600">
              {tl('liveBadge')}
            </span>
            <span className="tnum font-mono text-2xs text-muted">{clock(seconds)}</span>
          </div>
        </div>

        {/* wave */}
        <div className="px-4 pt-3">
          <AudioWave bars={56} height={40} />
        </div>

        {/* body: transcript + note */}
        <div className="grid grid-cols-1 gap-px bg-hairline sm:grid-cols-2">
          <div className="bg-card p-4">
            <p className="mb-2 flex items-center gap-1.5 text-2xs font-medium uppercase tracking-wide text-subtle">
              <Stethoscope className="h-3.5 w-3.5" /> {t('transcript')}
            </p>
            <div className="flex min-h-[150px] flex-col gap-2">
              <AnimatePresence>
                {data.lines.slice(0, visible).map((line, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className={line.who === 'doctor' ? 'self-end text-right' : 'self-start'}
                  >
                    <span className="text-2xs font-medium text-subtle">
                      {line.who === 'doctor' ? t('speakerDoctor') : t('speakerPatient')}
                    </span>
                    <p
                      className={
                        'mt-0.5 max-w-[92%] rounded-2xl px-3 py-1.5 text-[0.8rem] leading-snug ' +
                        (line.who === 'doctor'
                          ? 'bg-brand-600 text-white'
                          : 'bg-ink/[0.06] text-ink')
                      }
                    >
                      {line.text}
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
              {visible < data.lines.length && (
                <span className="inline-flex items-center gap-1 text-2xs text-subtle">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" />
                  {t('capturing')}
                </span>
              )}
            </div>
          </div>

          <div className="bg-card p-4">
            <p className="mb-2 flex items-center gap-1.5 text-2xs font-medium uppercase tracking-wide text-subtle">
              <Sparkles className="h-3.5 w-3.5 text-brand-500" /> {t('note')}
            </p>
            <div className="flex flex-col gap-2.5">
              {noteKeys.map((k, i) => (
                <div key={k}>
                  <p className="text-2xs font-semibold text-brand-700 dark:text-brand-300">
                    {t(`sections.${k}` as 'sections.queixa')}
                  </p>
                  <div className="mt-1 min-h-[1.25rem]">
                    {noteStep > i ? (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[0.78rem] leading-snug text-ink/90"
                      >
                        {data.note[k]}
                      </motion.p>
                    ) : (
                      <div className="space-y-1">
                        <div className="skeleton h-2 w-full" />
                        <div className="skeleton h-2 w-2/3" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* footer / guide generated */}
        <div className="flex items-center justify-between gap-2 border-t border-hairline bg-surface/60 px-4 py-3">
          <span className="text-2xs text-muted">{tl('noteBuilding')}</span>
          <AnimatePresence>
            {guide && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="inline-flex items-center gap-1.5 rounded-full bg-success/12 px-2.5 py-1 text-2xs font-semibold text-success-fg dark:text-success"
              >
                <Check className="h-3.5 w-3.5" />
                <FileText className="h-3.5 w-3.5" />
                TISS
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
