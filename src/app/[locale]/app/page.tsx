import type { Metadata } from 'next';
import { unstable_setRequestLocale } from 'next-intl/server';
import { SessionProvider } from '@/lib/auth/client';
import { Workspace } from '@/components/workspace/workspace';

export const metadata: Metadata = { title: 'Workspace' };

export default function AppPage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);
  return (
    <SessionProvider>
      <Workspace />
    </SessionProvider>
  );
}
