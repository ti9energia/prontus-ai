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
import { config } from '@/lib/config';

// Namespaces needed by landing-page client components only.
// 'pwa' is included even here because PWARegister's update prompt mounts
// globally (every route) — the SW can surface an update on any page.
// 'encounter' is included because the hero's animated demo (HeroDemo) reuses
// the real clinical encounter screen's strings (Transcrição/Médico/Paciente/
// section titles) instead of duplicating them.
// 'notFound' is included because not-found.tsx AND error.tsx (the segment
// error boundary for every [locale] route, including landing) both read
// notFound.back for their "back home" link — without it, error.tsx itself
// throws MISSING_MESSAGE while rendering its own fallback UI, which is what
// turned HeroDemo's original 'encounter' bug into unrecoverable render
// churn instead of a clean fallback (see .entrega/DECISOES.md 2026-07-02).
const LANDING_NS = new Set(['landing', 'common', 'nav', 'pricing', 'faq', 'meta', 'pwa', 'encounter', 'notFound']);

// Product/app surfaces need the FULL message set, not the filtered landing
// subset. IMPORTANT: every route added outside the pure marketing pages
// (/, /contact, /privacy, /terms, /lgpd) must be listed here — otherwise it
// silently gets LANDING_NS-only messages and throws MISSING_MESSAGE for any
// namespace it needs. Real bug found via Playwright E2E in FASE 7: /signup,
// /onboarding, /checkout and /owner were missing here, so those 4 entire
// page flows were broken in production (see .entrega/DECISOES.md 2026-07-02).
const PRODUCT_PATHS = ['/app', '/login', '/signup', '/onboarding', '/checkout', '/owner'];

// Return a filtered subset of messages when on a landing route (no product surface).
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
  const isLanding = !PRODUCT_PATHS.some((p) => url.includes(p));
  const messages = pickMessages(allMessages as AbstractIntlMessages, isLanding);

  return (
    <html lang={locale} dir="ltr" suppressHydrationWarning className={fontVariables}>
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
