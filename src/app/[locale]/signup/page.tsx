import type { Metadata } from 'next';
import { unstable_setRequestLocale } from 'next-intl/server';
import { SignupForm } from '@/components/auth/signup-form';

export const metadata: Metadata = { title: 'Criar conta' };

export default function SignupPage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);
  return <SignupForm />;
}
