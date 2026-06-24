import type { Metadata } from 'next';
import { unstable_setRequestLocale } from 'next-intl/server';
import { Workspace } from '@/components/workspace/workspace';

export const metadata: Metadata = { title: 'Workspace' };

export default function AppPage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);
  return <Workspace />;
}
