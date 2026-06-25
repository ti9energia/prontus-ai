import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Aureon Health — Escriba clínico de IA',
    short_name: 'Aureon Health',
    description:
      'Da fala ao prontuário e à guia TISS — sem digitar. Escriba clínico de IA para médicos e clínicas.',
    start_url: '/pt-BR/app',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#070b13',
    theme_color: '#0d9488',
    categories: ['medical', 'health', 'productivity', 'business'],
    lang: 'pt-BR',
    dir: 'ltr',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icon-maskable.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Agenda do dia', url: '/pt-BR/app', description: 'Consultas de hoje' },
      { name: 'Nova consulta', url: '/pt-BR/app?open=encounter', description: 'Iniciar gravação' },
      { name: 'Faturamento & glosas', url: '/pt-BR/app?open=billing', description: 'Guias e glosas' },
    ],
  };
}
