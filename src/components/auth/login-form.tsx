'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight, Mail, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import { Link, useRouter } from '@/i18n/routing';
import { signIn, isAuthed } from '@/lib/auth';
import { Aurora } from '@/components/landing/aurora';
import { Logo, LogoMark } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { Input, Field } from '@/components/ui/input';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeToggle } from '@/components/theme-provider';

export function LoginForm() {
  const t = useTranslations('auth');
  const tc = useTranslations('common.actions');
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (isAuthed()) router.replace('/app');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enter = (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    signIn();
    setTimeout(() => router.push('/app'), 350);
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* brand panel */}
      <div className="relative hidden overflow-hidden bg-brand-900 lg:block">
        <Aurora />
        <div className="noise absolute inset-0" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link href="/" className="inline-flex items-center gap-2.5 text-white">
            <LogoMark size={34} />
            <span className="font-display text-lg font-bold">
              Prontus<span className="text-brand-200">.ai</span>
            </span>
          </Link>

          <div className="max-w-md">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> {t('signInSubtitle')}
            </div>
            <blockquote className="font-display text-3xl font-semibold leading-tight tracking-tight text-white">
              “Saio do consultório com o prontuário e a guia prontos. Recuperei minhas noites.”
            </blockquote>
            <div className="mt-5 flex items-center gap-3 text-white/80">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-white/15 font-semibold text-white">HV</div>
              <div>
                <p className="text-sm font-medium text-white">Dra. Helena Vasconcelos</p>
                <p className="text-xs text-white/60">Clínica Aurora</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-white/60">
            <ShieldCheck className="h-4 w-4" /> LGPD · GDPR · PIPL · Human-in-the-loop
          </div>
        </div>
      </div>

      {/* form panel */}
      <div className="relative flex flex-col">
        <div className="flex items-center justify-between p-5">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> Prontus.ai
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <LanguageSwitcher />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-16">
          <div className="w-full max-w-sm">
            <div className="lg:hidden">
              <Logo size={34} />
            </div>
            <h1 className="mt-6 font-display text-3xl font-bold tracking-tight">{t('signInTitle')}</h1>
            <p className="mt-2 text-sm text-muted">{t('signInSubtitle')}</p>

            <form onSubmit={enter} className="mt-8 space-y-4">
              <Field label={t('email')}>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
                  <Input type="email" defaultValue="helena@clinicaaurora.com.br" className="pl-9" placeholder="you@clinic.com" />
                </div>
              </Field>
              <Field label={t('password')}>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
                  <Input type="password" defaultValue="prontus-demo" className="pl-9" placeholder="••••••••" />
                </div>
              </Field>

              <Button type="submit" size="lg" loading={loading} className="w-full" rightIcon={<ArrowRight className="h-4 w-4" />}>
                {tc('signIn')}
              </Button>
            </form>

            <div className="my-6 flex items-center gap-3 text-2xs text-subtle">
              <div className="h-px flex-1 bg-hairline" />
              <span>{t('demoNote')}</span>
              <div className="h-px flex-1 bg-hairline" />
            </div>

            <Button variant="outline" size="lg" className="w-full" leftIcon={<Sparkles className="h-4 w-4" />} onClick={() => enter()}>
              {t('enterDemo')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
