import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const locales = ['pt-BR', 'en', 'zh-CN', 'fr-FR'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'pt-BR';

export const localeMeta: Record<Locale, { label: string; flag: string; short: string }> = {
  'pt-BR': { label: 'Português', flag: '🇧🇷', short: 'PT' },
  en: { label: 'English', flag: '🇺🇸', short: 'EN' },
  'zh-CN': { label: '中文', flag: '🇨🇳', short: '中' },
  'fr-FR': { label: 'Français', flag: '🇫🇷', short: 'FR' },
};

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
