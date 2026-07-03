import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { fontVariables, fontCJK } from '../fonts';
import { ThemeProvider, ThemeScript } from '@/components/theme-provider';
import { PWARegister } from '@/components/pwa-register';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import '../globals.css';
import { config } from '@/lib/config';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'meta.landing' });
  return {
    metadataBase: new URL(config.site.url),
    title: { default: t('title'), template: '%s · Auronis Health' },
    description: t('description'),
    applicationName: 'Auronis Health',
    keywords: [
      'escriba clínico de IA',
      'prontuário eletrônico',
      'guia TISS',
      'glosa',
      'documentação médica',
      'IA médica',
      'Auronis Health',
      'Mari',
      'RCM saúde',
      'telemedicina',
    ],
    authors: [{ name: 'Auronis Health' }],
    creator: 'Auronis Health',
    publisher: 'Auronis Health',
    appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Auronis Health' },
    // `appleWebApp` only emits <meta name="apple-mobile-web-app-capable">; modern
    // browsers deprecated that in favour of the standard name, so emit both.
    other: { 'mobile-web-app-capable': 'yes' },
    formatDetection: { telephone: false },
    alternates: {
      canonical: `/${locale}`,
      languages: { 'pt-BR': '/pt-BR', en: '/en', 'zh-CN': '/zh-CN', 'fr-FR': '/fr-FR' },
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      type: 'website',
      siteName: 'Auronis Health',
      url: `/${locale}`,
      locale: locale.replace('-', '_'),
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#090b0f' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!routing.locales.includes(locale as Locale)) notFound();
  unstable_setRequestLocale(locale);
  // Every route gets the full message catalog. A previous per-route filter
  // here (guessing the current path from undocumented request headers) was
  // unreliable and, worse, failed *silently*: /signup, /onboarding,
  // /checkout, /owner and even parts of /app ended up with the wrong
  // catalog and threw MISSING_MESSAGE in production. The catalog is ~50KB
  // uncompressed per locale (compresses well over the wire) — not worth
  // re-introducing that failure mode to save a few KB on marketing pages.
  // See .entrega/DECISOES.md 2026-07-02.
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      dir="ltr"
      suppressHydrationWarning
      // CJK font var only for zh-CN — every other locale skips its 3 weights.
      className={cn(fontVariables, locale === 'zh-CN' && fontCJK.variable)}
    >
      <head>
        <ThemeScript />
        {/* Scroll reveals (.rv) start at opacity:0 and are switched on by JS —
            without JS the landing must still be fully readable. */}
        <noscript>
          <style>{`.rv,.rv-stagger>.rvi{opacity:1 !important;transform:none !important}`}</style>
        </noscript>
      </head>
      <body
        className={cn(
          'min-h-dvh bg-bg font-sans text-ink antialiased',
          locale === 'zh-CN' && '[font-family:var(--font-cjk),var(--font-sans),sans-serif]',
        )}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>{children}</ThemeProvider>
          <Toaster />
          <PWARegister />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
