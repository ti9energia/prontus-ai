import type { Metadata } from 'next';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { LegalShell, LegalSection } from '@/components/landing/legal-shell';

const SECTIONS = ['commitment', 'roles', 'bases', 'sensitive', 'rights', 'incidents', 'transfer', 'dpo'] as const;

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'legal.lgpd' });
  return { title: t('title'), description: t('intro') };
}

export default async function LgpdPage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('legal.lgpd');
  const tl = await getTranslations('legal');
  return (
    <LegalShell back={tl('backHome')} title={t('title')} updated={tl('updated')} intro={t('intro')}>
      {SECTIONS.map((s) => (
        <LegalSection key={s} heading={t(`sections.${s}.h`)} body={t(`sections.${s}.p`)} />
      ))}
    </LegalShell>
  );
}
