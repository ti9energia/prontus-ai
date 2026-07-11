import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { SessionProvider } from '@/lib/auth/client';
import { OwnerPanel } from '@/components/owner/owner-panel';

export const metadata: Metadata = { title: 'Painel do Dono' };

export default async function OwnerPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;

  const {
    locale
  } = params;

  setRequestLocale(locale);
  return (
    <SessionProvider>
      <OwnerPanel />
    </SessionProvider>
  );
}
