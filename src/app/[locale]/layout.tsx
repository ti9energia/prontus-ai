import type { Metadata, Viewport } from 'next';
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
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://aureonhealth.com'),
    title: { default: t('title'), template: '%s · Aureon Health' },
    description: t('description'),
    applicationName: 'Aureon Health',
    appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Aureon Health' },
    formatDetection: { telephone: false },
    icons: {
      icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
      apple: [{ url: '/icon.svg' }],
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      type: 'website',
      siteName: 'Aureon Health',
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafaf9' },
    { media: '(prefers-color-scheme: dark)', color: '#070b13' },
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
  const messages = await getMessages();

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
