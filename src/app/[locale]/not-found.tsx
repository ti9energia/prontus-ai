'use client';

import { useTranslations } from 'next-intl';
import { Home } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { LogoMark } from '@/components/brand/logo';
import { buttonVariants } from '@/components/ui/button';

export default function NotFound() {
  const t = useTranslations('notFound');

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div className="bg-mesh absolute inset-0 -z-10" />
      <LogoMark size={48} />
      <p className="mt-8 font-display text-7xl font-bold tracking-tight text-gradient">404</p>
      <h1 className="mt-3 font-display text-2xl font-bold tracking-tight">{t('title')}</h1>
      <p className="mt-2 max-w-md text-muted">{t('description')}</p>
      <Link href="/" className={buttonVariants({ size: 'lg', className: 'mt-8' })}>
        <Home className="h-4 w-4" /> {t('back')}
      </Link>
    </main>
  );
}
