'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { CalendarCheck, Clock } from 'lucide-react';
import { Reveal } from './reveal';
import { Link } from '@/i18n/routing';
import { useCountUp, useInView } from '@/lib/hooks';

/* ── Pure calculation (exported for unit tests) ── */
export interface RoiInputs {
  doctors: number;
  consultsPerDay: number;
  ticketAvg: number;
  glossRate: number;
}

export interface RoiResults {
  billingGross: number;
  glossMonthly: number;
  recovery: number;
  timeSaved: number;
  plan: 'Starter' | 'Pro' | 'Scale';
  planPrice: number;
  daysToBreakEven: number;
}

export function calcRoi(i: RoiInputs): RoiResults {
  const billingGross = i.doctors * i.consultsPerDay * 22 * i.ticketAvg;
  const glossMonthly = billingGross * (i.glossRate / 100);
  const recovery = Math.round(glossMonthly * 0.7);
  const timeSaved = Math.round(i.doctors * 1.8 * 22);
  const plan: 'Starter' | 'Pro' | 'Scale' =
    i.doctors <= 2 ? 'Starter' : i.doctors <= 5 ? 'Pro' : 'Scale';
  const planPrice = i.doctors <= 2 ? 97 : i.doctors <= 5 ? 197 : 397;
  const daysToBreakEven = recovery > 0 ? Math.ceil(planPrice / (recovery / 22)) : 0;
  return { billingGross, glossMonthly, recovery, timeSaved, plan, planPrice, daysToBreakEven };
}

/* ── Slider sub-component ── */
interface SliderProps {
  id: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  value: number;
  prefix?: string;
  onChange: (v: number) => void;
}

function CalcSlider({ id, label, unit, min, max, step, value, prefix = '', onChange }: SliderProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm text-muted">
          {label}
        </label>
        <span className="font-mono text-sm font-semibold tabular-nums">
          {prefix}
          {value.toLocaleString('pt-BR')}
          &nbsp;
          <span className="text-xs font-normal text-subtle">{unit}</span>
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-hairline [accent-color:rgb(var(--ring))]"
      />
      <div aria-hidden className="flex justify-between text-2xs text-subtle">
        <span>
          {prefix}
          {min}
        </span>
        <span>
          {prefix}
          {max}
        </span>
      </div>
    </div>
  );
}

/* ── Main section ── */
export function ROICalculator() {
  const t = useTranslations('landing.roi');
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.15 });

  const [inputs, setInputs] = React.useState<RoiInputs>({
    doctors: 3,
    consultsPerDay: 12,
    ticketAvg: 250,
    glossRate: 18,
  });

  const results = calcRoi(inputs);

  const animRecovery = useCountUp(results.recovery, inView, 800);
  const animTime = useCountUp(results.timeSaved, inView, 700);
  const animDays = useCountUp(results.daysToBreakEven, inView, 600);

  const brl = (n: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(Math.round(n));

  const set = (key: keyof RoiInputs) => (v: number) =>
    setInputs((prev) => ({ ...prev, [key]: v }));

  return (
    <section
      ref={ref}
      id="roi"
      className="scroll-mt-24 border-y border-hairline bg-surface/40 py-16 sm:py-24"
    >
      <div className="container-page">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          {/* Left — prose */}
          <Reveal>
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
                {t('eyebrow')}
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                {t('title')}
              </h2>
              <p className="mt-4 leading-relaxed text-muted">{t('subtitle')}</p>
              <details className="mt-5">
                <summary className="cursor-pointer select-none text-xs text-subtle transition-colors hover:text-muted">
                  {t('methodologyToggle')}
                </summary>
                <p className="mt-2 text-xs leading-relaxed text-subtle">{t('methodology')}</p>
              </details>
              <Link
                href="/login"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-600/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                {t('cta.label')}
              </Link>
              <p className="mt-2 text-xs text-subtle">{t('cta.sub')}</p>
            </div>
          </Reveal>

          {/* Right — calculator card */}
          <Reveal delay={0.1}>
            <div className="card-base p-6 shadow-lg">
              <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-muted">
                {t('cardTitle')}
              </p>
              <div className="space-y-5">
                <CalcSlider
                  id="roi-doctors"
                  label={t('inputs.doctors.label')}
                  unit={t('inputs.doctors.unit')}
                  min={1}
                  max={20}
                  step={1}
                  value={inputs.doctors}
                  onChange={set('doctors')}
                />
                <CalcSlider
                  id="roi-consults"
                  label={t('inputs.consults.label')}
                  unit={t('inputs.consults.unit')}
                  min={5}
                  max={30}
                  step={1}
                  value={inputs.consultsPerDay}
                  onChange={set('consultsPerDay')}
                />
                <CalcSlider
                  id="roi-ticket"
                  label={t('inputs.ticket.label')}
                  unit={t('inputs.ticket.unit')}
                  min={80}
                  max={600}
                  step={10}
                  value={inputs.ticketAvg}
                  prefix="R$ "
                  onChange={set('ticketAvg')}
                />
                <CalcSlider
                  id="roi-gloss"
                  label={t('inputs.gloss.label')}
                  unit={t('inputs.gloss.unit')}
                  min={5}
                  max={30}
                  step={1}
                  value={inputs.glossRate}
                  onChange={set('glossRate')}
                />
              </div>

              <div
                aria-hidden
                className="my-6 h-px bg-gradient-to-r from-transparent via-brand-500/20 to-transparent"
              />

              {/* Results */}
              <div aria-live="polite" aria-atomic="true" className="grid grid-cols-2 gap-3">
                {/* Primary stat — recovery */}
                <div className="col-span-2 rounded-xl bg-brand-600/[0.08] p-4 text-center">
                  <p className="text-xs text-muted">{t('results.recovery.label')}</p>
                  <p className="mt-1 font-display text-3xl font-bold text-gradient tabular-nums">
                    {brl(animRecovery)}
                  </p>
                  <p className="mt-0.5 text-2xs text-subtle">{t('results.recovery.note')}</p>
                </div>

                {/* Time saved */}
                <div className="rounded-xl bg-surface p-4 text-center">
                  <Clock className="mx-auto h-4 w-4 text-brand-500/60" aria-hidden />
                  <p className="mt-1 font-display text-2xl font-bold tabular-nums">
                    {Math.round(animTime)}
                    <span className="ml-0.5 text-sm font-normal text-muted">
                      {t('results.time.unit')}
                    </span>
                  </p>
                  <p className="mt-0.5 text-2xs text-subtle">{t('results.time.label')}</p>
                </div>

                {/* Days to break even */}
                <div className="rounded-xl bg-surface p-4 text-center">
                  <CalendarCheck className="mx-auto h-4 w-4 text-brand-500/60" aria-hidden />
                  <p className="mt-1 font-display text-2xl font-bold tabular-nums">
                    {Math.round(animDays)}
                    <span className="ml-0.5 text-sm font-normal text-muted">
                      {t('results.roi.unit')}
                    </span>
                  </p>
                  <p className="mt-0.5 text-2xs text-subtle">{t('results.roi.label')}</p>
                  <p className="mt-1 text-2xs font-medium text-brand-600">
                    {t('plan', { plan: results.plan, price: results.planPrice })}
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
