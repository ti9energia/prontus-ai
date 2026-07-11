import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';

export const metadata: Metadata = { title: 'Bem-vindo' };

export default async function OnboardingPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;

  const {
    locale
  } = params;

  setRequestLocale(locale);
  return <OnboardingWizard />;
}
