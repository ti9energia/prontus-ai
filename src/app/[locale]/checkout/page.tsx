import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { CheckoutFlow } from '@/components/checkout/checkout-flow';

export const metadata: Metadata = { title: 'Checkout' };

export default async function CheckoutPage(
  props: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ plan?: string; cycle?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;

  const {
    locale
  } = params;

  setRequestLocale(locale);
  return <CheckoutFlow initialPlan={searchParams.plan} initialCycle={searchParams.cycle} />;
}
