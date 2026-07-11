import type { Metadata } from 'next';
import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { SignupForm } from '@/components/auth/signup-form';
import { LoadingScreen } from '@/components/brand/loading';

export const metadata: Metadata = { title: 'Criar conta' };

export default async function SignupPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;

  const {
    locale
  } = params;

  setRequestLocale(locale);
  // SignupForm reads ?next= via useSearchParams(), which requires a Suspense
  // boundary for static shell generation (mirrors login/page.tsx).
  return (
    <Suspense fallback={<LoadingScreen />}>
      <SignupForm />
    </Suspense>
  );
}
