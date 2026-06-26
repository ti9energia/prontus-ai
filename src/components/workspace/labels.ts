'use client';

import { useTranslations } from 'next-intl';

/**
 * Workspace chrome labels (split / tabs / command palette / rail). Backed by the
 * i18n catalog (namespace "chrome") — was an inline per-locale dictionary before.
 */
export function useChrome() {
  const t = useTranslations('chrome');
  return (key: string) => t(key);
}
