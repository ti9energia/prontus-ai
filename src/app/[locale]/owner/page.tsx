import type { Metadata } from 'next';
import { unstable_setRequestLocale } from 'next-intl/server';
import { OwnerPanel } from '@/components/owner/owner-panel';

export const metadata: Metadata = { title: 'Painel do Dono' };

export default function OwnerPage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);
  return <OwnerPanel />;
}
