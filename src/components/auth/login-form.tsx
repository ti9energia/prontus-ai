'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { AlertCircle, ArrowLeft, ArrowRight, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { Link, useRouter } from '@/i18n/routing';
import { useSession } from '@/lib/auth';
import { Aurora } from '@/components/landing/aurora';
import { Logo, LogoMark } from '@/components/brand/logo';
import { MariFace } from '@/components/brand/mari';
import { Button } from '@/components/ui/button';
import { Input, Field } from '@/components/ui/input';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeToggle } from '@/components/theme-provider';

export function LoginForm() {
  const t = useTranslations('auth');
  const tc = useTranslations('common.actions');
  const locale = useLocale();
  const L = (pt: string, en: string, zh: string, fr: string) =>
    locale === 'en' ? en : locale === 'zh-CN' ? zh : locale === 'fr-FR' ? fr : pt;

  const router = useRouter();
  const { loading: sessionLoading, authed, role } = useSession();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!sessionLoading && authed) router.replace(role === 'owner' ? '/owner' : '/app');
  }, [sessionLoading, authed, role, router]);

  const post = async (body: Record<string, unknown>) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          res.status === 429
            ? L(
                'Muitas tentativas. Aguarde alguns minutos.',
                'Too many attempts. Wait a few minutes.',
                '尝试过于频繁，请稍后再试。',
                'Trop de tentatives. Réessayez dans quelques minutes.',
              )
            : L(
                'E-mail ou senha inválidos.',
                'Invalid email or password.',
                '邮箱或密码无效。',
                'E-mail ou mot de passe invalide.',
              ),
        );
        setLoading(false);
        return;
      }
      router.push(data.role === 'owner' ? '/owner' : '/app');
    } catch {
      setError(
        L(
          'Não foi possível entrar. Tente novamente.',
          'Could not sign in. Try again.',
          '无法登录，请重试。',
          'Connexion impossible. Réessayez.',
        ),
      );
      setLoading(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post({ email, password });
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* brand panel — Mari */}
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
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> {t('signInSubtitle')}
            </div>
            <blockquote className="font-display text-3xl font-semibold leading-tight tracking-tight text-white">
              “{L(
                'Saio do consultório com o prontuário e a guia prontos. Recuperei minhas noites.',
                'I leave the office with the record and claim already done. I got my evenings back.',
                '看完诊病历和单据就已就绪，我把晚上的时间找回来了。',
                'Je sors du cabinet avec le dossier et la feuille déjà prêts. J’ai retrouvé mes soirées.',
              )}”
            </blockquote>
            <div className="mt-6 flex items-center gap-3">
              <MariFace size={48} />
              <div>
                <p className="text-sm font-semibold text-white">Mari</p>
                <p className="text-xs text-white/60">
                  {L('Sua copilota clínica de IA', 'Your clinical AI copilot', '您的临床 AI 副驾', 'Votre copilote clinique IA')}
                </p>
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

            {error && (
              <div
                role="alert"
                className="mt-6 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/[0.06] px-3 py-2.5 text-sm text-danger"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={submit} className="mt-6 space-y-4">
              <Field label={t('email')}>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
                  <Input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    placeholder="you@clinic.com"
                    required
                  />
                </div>
              </Field>
              <Field label={t('password')}>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
                  <Input
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </Field>

              <Button
                type="submit"
                size="lg"
                loading={loading}
                className="w-full"
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                {tc('signIn')}
              </Button>
            </form>

            <div className="my-6 flex items-center gap-3 text-2xs text-subtle">
              <div className="h-px flex-1 bg-hairline" />
              <span>{t('demoNote')}</span>
              <div className="h-px flex-1 bg-hairline" />
            </div>

            <Button
              variant="outline"
              size="lg"
              className="w-full"
              loading={loading}
              leftIcon={<Sparkles className="h-4 w-4" />}
              onClick={() => post({ demo: true })}
            >
              {t('enterDemo')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
