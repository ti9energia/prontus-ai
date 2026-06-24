import type { Metadata } from 'next';
import { unstable_setRequestLocale } from 'next-intl/server';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = { title: 'Entrar' };

export default function LoginPage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);
  return <LoginForm />;
}
