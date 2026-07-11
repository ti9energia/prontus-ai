import type { Metadata } from 'next';
import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { LoginForm } from '@/components/auth/login-form';
import { LoadingScreen } from '@/components/brand/loading';

export const metadata: Metadata = { title: 'Entrar' };

export default async function LoginPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;

  const {
    locale
  } = params;

  setRequestLocale(locale);
  // LoginForm reads ?next= via useSearchParams(), which requires a Suspense
  // boundary for static shell generation.
  return (
    <Suspense fallback={<LoadingScreen />}>
      <LoginForm />
    </Suspense>
  );
}
