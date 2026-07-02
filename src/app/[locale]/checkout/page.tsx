import type { Metadata } from 'next';
import { unstable_setRequestLocale } from 'next-intl/server';
import { CheckoutFlow } from '@/components/checkout/checkout-flow';

export const metadata: Metadata = { title: 'Checkout' };

export default function CheckoutPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { plan?: string; cycle?: string };
}) {
  unstable_setRequestLocale(locale);
  return <CheckoutFlow initialPlan={searchParams.plan} initialCycle={searchParams.cycle} />;
}
