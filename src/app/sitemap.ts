import type { MetadataRoute } from 'next';
import { config } from '@/lib/config';

const base = config.site.url;
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
