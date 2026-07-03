import type { Metadata } from 'next';
import { Suspense } from 'react';
import { unstable_setRequestLocale } from 'next-intl/server';
import { SignupForm } from '@/components/auth/signup-form';
import { LoadingScreen } from '@/components/brand/loading';

export const metadata: Metadata = { title: 'Criar conta' };

export default function SignupPage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);
  // SignupForm reads ?next= via useSearchParams(), which requires a Suspense
  // boundary for static shell generation (mirrors login/page.tsx).
  return (
    <Suspense fallback={<LoadingScreen />}>
      <SignupForm />
    </Suspense>
  );
}
