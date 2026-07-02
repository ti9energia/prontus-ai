'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { AlertCircle, ArrowLeft, ArrowRight, Building2, Eye, EyeOff, Lock, Mail, ShieldCheck, User } from 'lucide-react';
import { Link, useRouter } from '@/i18n/routing';
import { useSession } from '@/lib/auth/client';
import { Aurora } from '@/components/landing/aurora';
import { Logo, LogoMark } from '@/components/brand/logo';
import { MariFace } from '@/components/brand/mari';
import { Button } from '@/components/ui/button';
import { Input, Field } from '@/components/ui/input';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeSwitcher } from '@/components/theme-provider';

interface FieldErrors {
  orgName?: boolean;
  name?: boolean;
  email?: boolean;
  password?: boolean;
}

export function SignupForm() {
  const t = useTranslations('auth');
  const tc = useTranslations('common.actions');
  const locale = useLocale();
  const L = (pt: string, en: string, zh: string, fr: string) =>
    locale === 'en' ? en : locale === 'zh-CN' ? zh : locale === 'fr-FR' ? fr : pt;

  const router = useRouter();
  const { loading: sessionLoading, authed, role } = useSession();
  const [orgName, setOrgName] = React.useState('');
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPw, setShowPw] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [emailTaken, setEmailTaken] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});

  // Already signed in? No point showing the signup form — bounce to the app
  // (mirrors login-form.tsx's own redirect-when-authed behavior).
  React.useEffect(() => {
    if (!sessionLoading && authed) router.replace(role === 'owner' ? '/owner' : '/app');
  }, [sessionLoading, authed, role, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailTaken(false);
    setFieldErrors({});
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgName, name, email, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setLoading(false);
        if (res.status === 409) {
          setEmailTaken(true);
          return;
        }
        if (res.status === 429) {
          setError(
            L(
              'Muitas tentativas. Aguarde alguns minutos.',
              'Too many attempts. Wait a few minutes.',
              '尝试过于频繁，请稍后再试。',
              'Trop de tentatives. Réessayez dans quelques minutes.',
            ),
          );
          return;
        }
        if (res.status === 400 && data?.fieldErrors) {
          const fe = data.fieldErrors as Record<string, unknown>;
          setFieldErrors({
            orgName: !!fe.orgName,
            name: !!fe.name,
            email: !!fe.email,
            password: !!fe.password,
          });
          setError(
            L(
              'Verifique os campos destacados abaixo.',
              'Check the highlighted fields below.',
              '请检查下方标出的字段。',
              'Vérifiez les champs mis en évidence ci-dessous.',
            ),
          );
          return;
        }
        setError(
          L(
            'Não foi possível criar a conta. Tente novamente.',
            'Could not create your account. Try again.',
            '无法创建账户，请重试。',
            'Impossible de créer le compte. Réessayez.',
          ),
        );
        return;
      }

      void data;
      router.push('/onboarding');
    } catch {
      setError(
        L(
          'Não foi possível criar a conta. Tente novamente.',
          'Could not create your account. Try again.',
          '无法创建账户，请重试。',
          'Impossible de créer le compte. Réessayez.',
        ),
      );
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* brand panel — Mari */}
      <div className="relative hidden overflow-hidden bg-brand-900 lg:block">
        <Aurora />
        <div className="noise absolute inset-0" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5 text-white">
              <LogoMark size={34} />
              <span className="font-display text-lg font-bold">
                Auronis<span className="text-brand-200"> Health</span>
              </span>
            </Link>
            <p className="mt-3 text-sm text-white/70">
              {L(
                'Inteligência clínica em cada consulta.',
                'Clinical intelligence in every visit.',
                '每一次问诊，都有临床智能。',
                'L’intelligence clinique à chaque consultation.',
              )}
            </p>
          </div>

          <div className="max-w-md">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
              {t('signUpSubtitle')}
            </div>
            <blockquote className="font-display text-3xl font-semibold leading-tight tracking-tight text-white">
              “{L(
                'Em 10 minutos criei a conta da clínica e já estava gravando minha primeira consulta com a Mari.',
                'In 10 minutes I set up the clinic account and was already recording my first visit with Mari.',
                '十分钟内完成诊所注册，紧接着就用 Mari 录制了第一次问诊。',
                'En 10 minutes, j’ai créé le compte de la clinique et j’enregistrais déjà ma première consultation avec Mari.',
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
            <ArrowLeft className="h-4 w-4" /> Auronis Health
          </Link>
          <div className="flex items-center gap-2">
            <ThemeSwitcher compact />
            <LanguageSwitcher />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-16">
          <div className="w-full max-w-sm">
            <div className="lg:hidden">
              <Logo size={34} />
            </div>
            <h1 className="mt-6 font-display text-3xl font-bold tracking-tight">{t('signUpTitle')}</h1>
            <p className="mt-2 text-sm text-muted">{t('signUpSubtitle')}</p>

            {error && (
              <div
                role="alert"
                className="mt-6 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/[0.06] px-3 py-2.5 text-sm text-danger"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {emailTaken && (
              <div
                role="alert"
                className="mt-6 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/[0.06] px-3 py-2.5 text-sm text-warning"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {L(
                    'Este e-mail já tem uma conta. ',
                    'This email already has an account. ',
                    '该邮箱已注册。',
                    'Cet e-mail possède déjà un compte. ',
                  )}
                  <Link href="/login" className="font-medium underline underline-offset-2">
                    {L('Entrar', 'Sign in', '去登录', 'Se connecter')}
                  </Link>
                </span>
              </div>
            )}

            <form onSubmit={submit} className="mt-6 space-y-4">
              <Field
                label={t('orgName')}
                error={fieldErrors.orgName ? L('Nome muito curto', 'Name too short', '名称过短', 'Nom trop court') : undefined}
              >
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
                  <Input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="pl-9"
                    placeholder={L('Clínica Aurora', 'Aurora Clinic', '极光诊所', 'Clinique Aurora')}
                    required
                    minLength={2}
                  />
                </div>
              </Field>

              <Field
                label={t('yourName')}
                error={fieldErrors.name ? L('Nome muito curto', 'Name too short', '名称过短', 'Nom trop court') : undefined}
              >
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-9"
                    placeholder={L('Dra. Camila Rocha', 'Dr. Camila Rocha', 'Camila Rocha 医生', 'Dr. Camila Rocha')}
                    required
                    minLength={2}
                  />
                </div>
              </Field>

              <Field
                label={t('email')}
                error={fieldErrors.email ? L('E-mail inválido', 'Invalid email', '邮箱无效', 'E-mail invalide') : undefined}
              >
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

              <Field
                label={t('password')}
                error={
                  fieldErrors.password
                    ? L('Mínimo de 10 caracteres', 'At least 10 characters', '至少 10 个字符', 'Au moins 10 caractères')
                    : undefined
                }
                hint={
                  !fieldErrors.password
                    ? L('Mínimo de 10 caracteres', 'At least 10 characters', '至少 10 个字符', 'Au moins 10 caractères')
                    : undefined
                }
              >
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
                  <Input
                    type={showPw ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10"
                    placeholder="••••••••••"
                    required
                    minLength={10}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-subtle transition-colors hover:bg-ink/[0.06] hover:text-ink"
                    aria-label={
                      showPw
                        ? L('Ocultar senha', 'Hide password', '隐藏密码', 'Masquer le mot de passe')
                        : L('Mostrar senha', 'Show password', '显示密码', 'Afficher le mot de passe')
                    }
                    aria-pressed={showPw}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>

              <Button
                type="submit"
                size="lg"
                loading={loading}
                className="w-full"
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                {L('Criar conta grátis', 'Create free account', '免费创建账户', 'Créer un compte gratuit')}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted">
              {L('Já tem conta?', 'Already have an account?', '已有账户？', 'Vous avez déjà un compte ?')}{' '}
              <Link href="/login" className="font-medium text-ink underline-offset-2 hover:underline">
                {tc('signIn')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
