import type { Metadata, Viewport } from 'next';
import type { AbstractIntlMessages } from 'next-intl';
import { headers } from 'next/headers';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { fontVariables } from '../fonts';
import { ThemeProvider, ThemeScript } from '@/components/theme-provider';
import { PWARegister } from '@/components/pwa-register';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import '../globals.css';

// Namespaces needed by landing-page client components only.
const LANDING_NS = new Set(['landing', 'common', 'nav', 'pricing', 'faq', 'meta']);

// Return a filtered subset of messages when on a landing route (no /app or /login).
function pickMessages(messages: AbstractIntlMessages, isLanding: boolean): AbstractIntlMessages {
  if (!isLanding) return messages;
  return Object.fromEntries(
    Object.entries(messages).filter(([ns]) => LANDING_NS.has(ns)),
  ) as AbstractIntlMessages;
}

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
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://auronishealth.com'),
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
  const allMessages = await getMessages();
  const url = headers().get('x-invoke-path') ?? headers().get('next-url') ?? '';
  const isLanding = !url.includes('/app') && !url.includes('/login');
  const messages = pickMessages(allMessages as AbstractIntlMessages, isLanding);

  return (
    <html lang={locale} dir="ltr" suppressHydrationWarning className={fontVariables}>
      <head>
        <ThemeScript />
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
        </NextIntlClientProvider>
        <PWARegister />
      </body>
    </html>
  );
}
