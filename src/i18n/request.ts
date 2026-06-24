import { getRequestConfig } from 'next-intl/server';
import type { AbstractIntlMessages } from 'next-intl';
import { routing, type Locale } from './routing';

// Static, per-locale loaders so Next's file tracer bundles every catalog into
// the standalone/Docker output (a templated `messages/${locale}.json` import is
// not statically analyzable and gets dropped from the trace).
const loaders = {
  'pt-BR': () => import('../../messages/pt-BR.json'),
  en: () => import('../../messages/en.json'),
  'zh-CN': () => import('../../messages/zh-CN.json'),
  'fr-FR': () => import('../../messages/fr-FR.json'),
} satisfies Record<Locale, () => Promise<unknown>>;

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as Locale)) {
    locale = routing.defaultLocale;
  }

  const messages = (await loaders[locale as Locale]()).default as unknown as AbstractIntlMessages;

  return {
    locale,
    messages,
    now: new Date(),
  };
});
