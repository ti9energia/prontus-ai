'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, FileText, Sparkles, Stethoscope } from 'lucide-react';
import { AudioWave } from '@/components/visual/audio-wave';
import { Avatar } from '@/components/ui/misc';
import { clock } from '@/lib/utils';

type Line = { who: 'doctor' | 'patient'; text: string; unlock: 0 | 1 | 2 | 3 };

const SCRIPT: Record<string, { lines: Line[]; note: Record<string, string> }> = {
  'pt-BR': {
    lines: [
      { who: 'patient', text: 'Doutora, estou com dor de cabeça quase toda manhã.', unlock: 0 },
      { who: 'doctor', text: 'Há quanto tempo? Sente tontura? Mediu a pressão em casa?', unlock: 0 },
      { who: 'patient', text: 'Há duas semanas, com tontura. A pressão deu perto de 150 por 95.', unlock: 2 },
      { who: 'doctor', text: 'Vou ajustar a losartana, pedir um ECG e rever você em 30 dias.', unlock: 3 },
    ],
    note: {
      queixa: 'Cefaleia matinal há 2 semanas, associada a tontura.',
      hma: 'Refere PA domiciliar em torno de 150/95 mmHg.',
      conduta: 'Ajuste de losartana, ECG e retorno em 30 dias.',
    },
  },
  en: {
    lines: [
      { who: 'patient', text: 'Doctor, I get headaches almost every morning.', unlock: 0 },
      { who: 'doctor', text: 'For how long? Any dizziness? Did you check your pressure at home?', unlock: 0 },
      { who: 'patient', text: 'For two weeks, with dizziness. It was around 150 over 95.', unlock: 2 },
      { who: 'doctor', text: 'I’ll adjust losartan, order an ECG and review you in 30 days.', unlock: 3 },
    ],
    note: {
      queixa: 'Morning headache for 2 weeks, associated with dizziness.',
      hma: 'Reports home BP around 150/95 mmHg.',
      conduta: 'Adjust losartan, order ECG, follow-up in 30 days.',
    },
  },
  'zh-CN': {
    lines: [
      { who: 'patient', text: '医生，我几乎每天早上都头痛。', unlock: 0 },
      { who: 'doctor', text: '持续多久了？会头晕吗？在家量过血压吗？', unlock: 0 },
      { who: 'patient', text: '两周了，会头晕。血压大约是 150/95。', unlock: 2 },
      { who: 'doctor', text: '我会调整氯沙坦，安排心电图，30 天后复诊。', unlock: 3 },
    ],
    note: {
      queixa: '晨起头痛两周，伴头晕。',
      hma: '自述家庭血压约为 150/95 mmHg。',
      conduta: '调整氯沙坦，开心电图，30天后复诊。',
    },
  },
  'fr-FR': {
    lines: [
      { who: 'patient', text: 'Docteur, j’ai mal à la tête presque chaque matin.', unlock: 0 },
      { who: 'doctor', text: 'Depuis quand ? Des vertiges ? Avez-vous mesuré votre tension ?', unlock: 0 },
      { who: 'patient', text: 'Depuis deux semaines, avec vertiges. Environ 150 sur 95.', unlock: 2 },
      { who: 'doctor', text: 'J’ajuste le losartan, prescris un ECG et vous revois dans 30 jours.', unlock: 3 },
    ],
    note: {
      queixa: 'Céphalées matinales depuis 2 semaines, avec vertiges.',
      hma: 'Rapporte une tension à domicile autour de 150/95 mmHg.',
      conduta: 'Ajuster le losartan, ECG, contrôle dans 30 jours.',
    },
  },
};

export function HeroDemo() {
  const locale = useLocale();
  const t = useTranslations('encounter');
  const tl = useTranslations('landing.hero');
  const data = SCRIPT[locale] ?? SCRIPT['pt-BR'];

  // Reduced motion → render the finished state statically: no loop, no timers, no ping.
  const reduce = useReducedMotion();

  const [seconds, setSeconds] = React.useState(0);
  const [visible, setVisible] = React.useState(0);
  const [noteStep, setNoteStep] = React.useState(0);
  const [guide, setGuide] = React.useState(false);

  React.useEffect(() => {
    if (reduce) {
      setSeconds(92); // plausible static consult clock (1:32)
      return;
    }
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [reduce]);

  React.useEffect(() => {
    if (reduce) {
      setVisible(data.lines.length);
      setNoteStep(3);
      setGuide(true);
      return;
    }
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
          // A field unlocks only after its supporting sentence is visible.
          // This prevents the demo from inventing or anticipating clinical data.
          setNoteStep(data.lines[i - 1].unlock);
        }
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
  }, [locale, reduce]);

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
          <div className="ml-2 truncate font-mono text-2xs text-subtle">auronishealth.com/app/encounter</div>
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
              {!reduce && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-400 opacity-70" />
              )}
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
                        'mt-0.5 max-w-[92%] rounded-2xl px-3 py-1.5 text-xs+ leading-snug ' +
                        (line.who === 'doctor'
                          ? 'bg-brand-700 text-white'
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
                        className="text-xs+ leading-snug text-ink/90"
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
