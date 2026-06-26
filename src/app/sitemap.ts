import type { MetadataRoute } from 'next';

const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://auronishealth.com';
const locales = ['pt-BR', 'en', 'zh-CN', 'fr-FR'] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const languages = Object.fromEntries(locales.map((x) => [x, `${base}/${x}`]));
  return locales.map((l) => ({
    url: `${base}/${l}`,
    lastModified,
    changeFrequency: 'weekly',
    priority: l === 'pt-BR' ? 1 : 0.8,
    alternates: { languages },
  }));
}
