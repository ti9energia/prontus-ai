import type { Metadata } from 'next';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { Mail, MessageCircle, ShieldCheck, type LucideIcon } from 'lucide-react';
import { LegalShell } from '@/components/landing/legal-shell';

const CHANNELS: { key: 'sales' | 'support' | 'privacy'; icon: LucideIcon; email: string }[] = [
  { key: 'sales', icon: Mail, email: 'vendas@auronishealth.com' },
  { key: 'support', icon: MessageCircle, email: 'suporte@auronishealth.com' },
  { key: 'privacy', icon: ShieldCheck, email: 'privacidade@auronishealth.com' },
];

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'legal.contact' });
  return { title: t('title'), description: t('intro') };
}

export default async function ContactPage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('legal.contact');
  const tl = await getTranslations('legal');
  return (
    <LegalShell back={tl('backHome')} title={t('title')} intro={t('intro')}>
      <div className="grid gap-4 sm:grid-cols-3">
        {CHANNELS.map(({ key, icon: Icon, email }) => (
          <div
            key={key}
            className="flex h-full flex-col rounded-2xl border border-hairline bg-card p-5 shadow-xs"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600/[0.1] text-brand-600">
              <Icon className="h-5 w-5" aria-hidden />
            </div>
            <h2 className="mt-3 font-display text-base font-semibold tracking-tight">
              {t(`channels.${key}.h`)}
            </h2>
            <p className="mt-1 flex-1 text-sm leading-relaxed text-muted">{t(`channels.${key}.p`)}</p>
            <a
              href={`mailto:${email}`}
              className="mt-4 text-sm font-medium text-brand-600 transition-colors hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300"
            >
              {email}
            </a>
          </div>
        ))}
      </div>
      <p className="text-sm leading-relaxed text-muted">{t('sla')}</p>
    </LegalShell>
  );
}
