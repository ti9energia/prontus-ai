import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Auronis Health — Escriba clínico de IA',
    short_name: 'Auronis Health',
    description:
      'Da fala ao prontuário e à guia TISS — sem digitar. Escriba clínico de IA para médicos e clínicas.',
    start_url: '/pt-BR/app',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#090b0f',
    theme_color: '#14c8c4',
    categories: ['medical', 'health', 'productivity', 'business'],
    lang: 'pt-BR',
    dir: 'ltr',
    icons: [
      { src: '/brand/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/brand/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      // Maskable icons are separately-composed art with real safe-zone padding
      // (see scripts/process-assets.mjs) — not the "any" icon relabeled, which
      // would get its tips clipped by a circular/squircle OS mask.
      { src: '/brand/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/brand/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Agenda do dia', url: '/pt-BR/app', description: 'Consultas de hoje' },
      { name: 'Nova consulta', url: '/pt-BR/app?open=encounter', description: 'Iniciar gravação' },
      { name: 'Faturamento & glosas', url: '/pt-BR/app?open=billing', description: 'Guias e glosas' },
    ],
  };
}
