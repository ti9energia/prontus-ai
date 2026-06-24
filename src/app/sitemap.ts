import type { MetadataRoute } from 'next';

const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://prontus.ai';
const locales = ['pt-BR', 'en', 'zh-CN', 'fr-FR'];

export default function sitemap(): MetadataRoute.Sitemap {
  return locales.map((l) => ({
    url: `${base}/${l}`,
    changeFrequency: 'weekly',
    priority: l === 'pt-BR' ? 1 : 0.8,
  }));
}
