'use client';

import { useLocale } from 'next-intl';
import { Home } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { LogoMark } from '@/components/brand/logo';
import { buttonVariants } from '@/components/ui/button';

export default function NotFound() {
  const locale = useLocale();
  const L = (pt: string, en: string, zh: string, fr: string) =>
    locale === 'en' ? en : locale === 'zh-CN' ? zh : locale === 'fr-FR' ? fr : pt;

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div className="bg-mesh absolute inset-0 -z-10" />
      <LogoMark size={48} />
      <p className="mt-8 font-display text-7xl font-bold tracking-tight text-gradient">404</p>
      <h1 className="mt-3 font-display text-2xl font-bold tracking-tight">
        {L('Página não encontrada', 'Page not found', '页面未找到', 'Page introuvable')}
      </h1>
      <p className="mt-2 max-w-md text-muted">
        {L(
          'O endereço que você procurou não existe ou foi movido.',
          "The page you're looking for doesn't exist or was moved.",
          '您访问的页面不存在或已被移动。',
          "La page que vous cherchez n'existe pas ou a été déplacée.",
        )}
      </p>
      <Link href="/" className={buttonVariants({ size: 'lg', className: 'mt-8' })}>
        <Home className="h-4 w-4" /> {L('Voltar ao início', 'Back home', '返回首页', "Retour à l'accueil")}
      </Link>
    </main>
  );
}
