import type { Metadata } from 'next';
import { Suspense } from 'react';
import { unstable_setRequestLocale } from 'next-intl/server';
import { LoginForm } from '@/components/auth/login-form';
import { LoadingScreen } from '@/components/brand/loading';

export const metadata: Metadata = { title: 'Entrar' };

export default function LoginPage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);
  // LoginForm reads ?next= via useSearchParams(), which requires a Suspense
  // boundary for static shell generation.
  return (
    <Suspense fallback={<LoadingScreen />}>
      <LoginForm />
    </Suspense>
  );
}
