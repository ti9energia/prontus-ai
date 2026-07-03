'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  AlertCircle,
  ArrowRight,
  Bot,
  Check,
  FileCheck2,
  Mic,
  Plus,
  Sparkles,
  Stethoscope,
  User as UserIcon,
  Users,
  X,
} from 'lucide-react';
import { useRouter } from '@/i18n/routing';
import { LogoMark } from '@/components/brand/logo';
import { MariPortrait } from '@/components/brand/mari';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, Input, Select } from '@/components/ui/input';
import { Progress, Spinner } from '@/components/ui/feedback';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeSwitcher } from '@/components/theme-provider';
import { cn } from '@/lib/utils';

type StepKey = 'profile' | 'specialty' | 'team' | 'tour';
const STEPS: StepKey[] = ['profile', 'specialty', 'team', 'tour'];
const SPECIALTIES = ['clinica', 'cardio', 'pediatria', 'ortopedia', 'dermato', 'gineco'] as const;
const STEP_ICON: Record<StepKey, React.ComponentType<{ className?: string }>> = {
  profile: UserIcon,
  specialty: Stethoscope,
  team: Users,
  tour: Sparkles,
};

interface OnboardingProgress {
  completedSteps: StepKey[];
  currentStep: StepKey | null;
  data: { specialtyKey?: string; clinicSize?: string; invitedEmails?: string[] };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function OnboardingWizard() {
  const router = useRouter();
  const t = useTranslations('onboarding');
  const tc = useTranslations('common.actions');
  const tSpec = useTranslations('templates');
  const locale = useLocale();
  const L = (pt: string, en: string, zh: string, fr: string) =>
    locale === 'en' ? en : locale === 'zh-CN' ? zh : locale === 'fr-FR' ? fr : pt;

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState<OnboardingProgress | null>(null);

  const [clinicSize, setClinicSize] = React.useState('2-5');
  const [specialtyKey, setSpecialtyKey] = React.useState<string>('clinica');
  const [emails, setEmails] = React.useState<string[]>([]);
  const [emailDraft, setEmailDraft] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/onboarding');
        if (res.status === 401) {
          router.replace('/login');
          return;
        }
        if (!res.ok) throw new Error('fetch failed');
        const data: OnboardingProgress = await res.json();
        if (cancelled) return;
        if (!data.currentStep) {
          router.replace('/app');
          return;
        }
        setProgress(data);
        if (data.data.clinicSize) setClinicSize(data.data.clinicSize);
        if (data.data.specialtyKey) setSpecialtyKey(data.data.specialtyKey);
        if (data.data.invitedEmails) setEmails(data.data.invitedEmails);
      } catch {
        if (!cancelled) setError(t('error'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, t]);

  const advance = async (step: StepKey, data?: Record<string, unknown>) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step, data }),
      });
      if (!res.ok) throw new Error('save failed');
      const next: OnboardingProgress = await res.json();
      if (!next.currentStep) {
        router.push('/app');
        return;
      }
      setProgress(next);
    } catch {
      setError(t('error'));
    } finally {
      setSaving(false);
    }
  };

  const addEmail = () => {
    const email = emailDraft.trim().toLowerCase();
    if (!EMAIL_RE.test(email) || emails.includes(email)) return;
    setEmails((list) => [...list, email]);
    setEmailDraft('');
  };
  const removeEmail = (email: string) => setEmails((list) => list.filter((e) => e !== email));

  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }
  if (!progress) return null; // already redirected

  const stepIndex = STEPS.indexOf(progress.currentStep!);
  const percent = (progress.completedSteps.length / STEPS.length) * 100;

  return (
    <div className="min-h-dvh bg-bg">
      <header className="flex items-center justify-between p-5">
        <div className="inline-flex items-center gap-2.5">
          <LogoMark size={30} />
          <span className="font-display text-base font-bold">
            Auronis<span className="text-brand-600"> Health</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeSwitcher compact />
          <LanguageSwitcher />
        </div>
      </header>

      <main className="mx-auto flex max-w-lg flex-col px-6 pb-20 pt-4">
        {/* stepper */}
        <div className="mb-8">
          <Progress value={percent} className="mb-4" />
          <div className="grid grid-cols-4 gap-2">
            {STEPS.map((s, i) => {
              const Icon = STEP_ICON[s];
              const done = progress.completedSteps.includes(s);
              const current = s === progress.currentStep;
              return (
                <div key={s} className="flex flex-col items-center gap-1.5">
                  <div
                    className={cn(
                      'grid h-9 w-9 place-items-center rounded-full border transition-colors',
                      done
                        ? 'border-brand-600 bg-brand-600 text-white'
                        : current
                          ? 'border-brand-500 text-brand-600'
                          : 'border-line text-subtle',
                    )}
                    aria-current={current ? 'step' : undefined}
                  >
                    {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className="hidden text-2xs text-muted sm:block">{i + 1}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-center text-2xs text-muted">{t('stepOf', { n: stepIndex + 1 })}</p>
        </div>

        {error && (
          <div role="alert" className="mb-4 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/[0.06] px-3 py-2.5 text-sm text-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{error}</span>
          </div>
        )}

        <Card className="p-6">
          {progress.currentStep === 'profile' && (
            <div>
              <h1 className="font-display text-xl font-bold tracking-tight">{t('profile.title')}</h1>
              <p className="mt-1.5 text-sm text-muted">{t('profile.subtitle')}</p>
              <Field label={t('profile.sizeLabel')} className="mt-6">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: '1', label: t('profile.size1') },
                    { value: '2-5', label: t('profile.size2to5') },
                    { value: '6-20', label: t('profile.size6to20') },
                    { value: '20+', label: t('profile.size20plus') },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setClinicSize(opt.value)}
                      className={cn(
                        'rounded-lg border px-3 py-2.5 text-left text-sm transition-colors',
                        clinicSize === opt.value
                          ? 'border-brand-500/50 bg-brand-600/10 font-medium text-brand-700 dark:text-brand-300'
                          : 'border-line text-muted hover:bg-ink/[0.04]',
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </Field>
              <Button
                className="mt-6 w-full"
                size="lg"
                loading={saving}
                rightIcon={<ArrowRight className="h-4 w-4" />}
                onClick={() => advance('profile', { clinicSize })}
              >
                {tc('continue')}
              </Button>
            </div>
          )}

          {progress.currentStep === 'specialty' && (
            <div>
              <h1 className="font-display text-xl font-bold tracking-tight">{t('specialty.title')}</h1>
              <p className="mt-1.5 text-sm text-muted">{t('specialty.subtitle')}</p>
              <Field label={tSpec('specialty')} className="mt-6">
                <Select value={specialtyKey} onChange={(e) => setSpecialtyKey(e.target.value)}>
                  {SPECIALTIES.map((k) => (
                    <option key={k} value={k}>
                      {tSpec(`specialties.${k}`)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Button
                className="mt-6 w-full"
                size="lg"
                loading={saving}
                rightIcon={<ArrowRight className="h-4 w-4" />}
                onClick={() => advance('specialty', { specialtyKey })}
              >
                {tc('continue')}
              </Button>
            </div>
          )}

          {progress.currentStep === 'team' && (
            <div>
              <h1 className="font-display text-xl font-bold tracking-tight">{t('team.title')}</h1>
              <p className="mt-1.5 text-sm text-muted">{t('team.subtitle')}</p>

              <div className="mt-6 flex gap-2">
                <Input
                  type="email"
                  value={emailDraft}
                  onChange={(e) => setEmailDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addEmail();
                    }
                  }}
                  placeholder={t('team.emailPlaceholder')}
                  aria-label={t('team.emailPlaceholder')}
                />
                <Button type="button" variant="outline" leftIcon={<Plus className="h-4 w-4" />} onClick={addEmail}>
                  {t('team.add')}
                </Button>
              </div>

              {emails.length > 0 && (
                <ul className="mt-4 space-y-1.5">
                  {emails.map((email) => (
                    <li
                      key={email}
                      className="flex items-center justify-between rounded-lg border border-hairline bg-surface/50 px-3 py-2 text-sm"
                    >
                      <span className="truncate">{email}</span>
                      <button
                        type="button"
                        onClick={() => removeEmail(email)}
                        aria-label={`${tc('delete')} ${email}`}
                        className="grid h-6 w-6 shrink-0 place-items-center rounded text-subtle hover:bg-danger/10 hover:text-danger"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <p className="mt-4 text-2xs text-muted">
                {emails.length > 0 ? t('team.invited', { count: emails.length }) : null} {t('team.note')}
              </p>

              <div className="mt-6 flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  loading={saving}
                  onClick={() => advance('team', { invitedEmails: emails })}
                >
                  {t('skip')}
                </Button>
                <Button
                  className="flex-1"
                  loading={saving}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                  onClick={() => advance('team', { invitedEmails: emails })}
                >
                  {tc('continue')}
                </Button>
              </div>
            </div>
          )}

          {progress.currentStep === 'tour' && (
            <div>
              <h1 className="font-display text-xl font-bold tracking-tight">{t('tour.title')}</h1>
              <p className="mt-1.5 text-sm text-muted">{t('tour.subtitle')}</p>

              <div className="mt-6 space-y-3">
                {[
                  { icon: Mic, mari: false, title: t('tour.f1Title'), desc: t('tour.f1Desc') },
                  { icon: FileCheck2, mari: false, title: t('tour.f2Title'), desc: t('tour.f2Desc') },
                  { icon: Bot, mari: true, title: t('tour.f3Title'), desc: t('tour.f3Desc') },
                ].map((f, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border border-hairline bg-surface/50 p-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-brand-600/10 text-brand-600">
                      {f.mari ? <MariPortrait size={30} rim={false} /> : <f.icon className="h-4.5 w-4.5" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{f.title}</p>
                      <p className="text-xs text-muted">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                className="mt-6 w-full"
                size="lg"
                loading={saving}
                rightIcon={<ArrowRight className="h-4 w-4" />}
                onClick={() => advance('tour')}
              >
                {t('tour.cta')}
              </Button>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
