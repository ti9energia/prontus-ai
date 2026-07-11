import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { SessionProvider } from '@/lib/auth/client';
import { Workspace } from '@/components/workspace/workspace';

export const metadata: Metadata = { title: 'Workspace' };

export default async function AppPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;

  const {
    locale
  } = params;

  setRequestLocale(locale);
  return (
    <SessionProvider>
      <Workspace />
    </SessionProvider>
  );
}
