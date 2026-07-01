import type { Metadata } from 'next';
import { unstable_setRequestLocale } from 'next-intl/server';
import { SessionProvider } from '@/lib/auth/client';
import { OwnerPanel } from '@/components/owner/owner-panel';

export const metadata: Metadata = { title: 'Painel do Dono' };

export default function OwnerPage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);
  return (
    <SessionProvider>
      <OwnerPanel />
    </SessionProvider>
  );
}
