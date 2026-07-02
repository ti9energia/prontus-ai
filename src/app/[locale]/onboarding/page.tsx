import type { Metadata } from 'next';
import { unstable_setRequestLocale } from 'next-intl/server';
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';

export const metadata: Metadata = { title: 'Bem-vindo' };

export default function OnboardingPage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);
  return <OnboardingWizard />;
}
