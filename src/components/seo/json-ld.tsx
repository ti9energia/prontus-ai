import { getTranslations } from 'next-intl/server';
import { config } from '@/lib/config';

const SITE = config.site.url;

/**
 * Structured data (schema.org) for SEO + AEO/GEO. Organization, the product as a
 * SoftwareApplication, the WebSite, and the FAQ (pulled from the i18n catalog so
 * answer engines can cite real Q&A). Rendered as a server component on the landing.
 */
export async function JsonLd({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'landing' });
  const tm = await getTranslations({ locale, namespace: 'meta.landing' });

  const org = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Auronis Health',
    url: SITE,
    logo: `${SITE}/brand/icon-512.png`,
    description: tm('description'),
    slogan: 'Menos documentação. Mais medicina.',
  };

  const software = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Auronis Health',
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Web',
    description: tm('description'),
    offers: { '@type': 'Offer', category: 'subscription' },
    inLanguage: ['pt-BR', 'en', 'zh-CN', 'fr-FR'],
  };

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Auronis Health',
    url: SITE,
    inLanguage: locale,
  };

  const faqKeys = ['q1', 'q2', 'q3', 'q4', 'q5'] as const;
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqKeys.map((k) => ({
      '@type': 'Question',
      name: t(`faq.items.${k}.q` as 'faq.items.q1.q'),
      acceptedAnswer: { '@type': 'Answer', text: t(`faq.items.${k}.a` as 'faq.items.q1.a') },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify([org, software, website, faq]) }}
    />
  );
}
