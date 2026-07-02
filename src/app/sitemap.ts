import type { MetadataRoute } from 'next';
import { config } from '@/lib/config';

const base = config.site.url;
const locales = ['pt-BR', 'en', 'zh-CN', 'fr-FR'] as const;

const pages = ['', '/privacy', '/terms', '/lgpd', '/contact'] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return pages.flatMap((page) => {
    const languages = Object.fromEntries(locales.map((x) => [x, `${base}/${x}${page}`]));
    return locales.map((l) => ({
      url: `${base}/${l}${page}`,
      lastModified,
      changeFrequency: page === '' ? ('weekly' as const) : ('monthly' as const),
      priority: page === '' ? (l === 'pt-BR' ? 1 : 0.8) : 0.4,
      alternates: { languages },
    }));
  });
}
