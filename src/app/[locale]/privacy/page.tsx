import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LegalShell, LegalSection } from '@/components/landing/legal-shell';

const SECTIONS = ['scope', 'data', 'use', 'sharing', 'security', 'retention', 'rights', 'cookies'] as const;

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;

  const {
    locale
  } = params;

  const t = await getTranslations({ locale, namespace: 'legal.privacy' });
  return { title: t('title'), description: t('intro') };
}

export default async function PrivacyPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;

  const {
    locale
  } = params;

  setRequestLocale(locale);
  const t = await getTranslations('legal.privacy');
  const tl = await getTranslations('legal');
  return (
    <LegalShell back={tl('backHome')} title={t('title')} updated={tl('updated')} intro={t('intro')}>
      {SECTIONS.map((s) => (
        <LegalSection key={s} heading={t(`sections.${s}.h`)} body={t(`sections.${s}.p`)} />
      ))}
    </LegalShell>
  );
}
