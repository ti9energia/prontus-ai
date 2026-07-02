import { Sora, Inter, JetBrains_Mono, Noto_Sans_SC } from 'next/font/google';

export const fontDisplay = Sora({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  weight: ['600', '700', '800'],
  variable: '--font-display',
});

export const fontSans = Inter({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-sans',
});

export const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600'],
  variable: '--font-mono',
});

// CJK font for zh-CN ONLY. `preload: false` + applied conditionally in the
// [locale] layout (only when locale === 'zh-CN') so the ~99% of visitors on
// pt-BR/en/fr-FR don't download a 4th font family (3 weights) they never see —
// the CJK font-family is only ever referenced on zh-CN pages. next/font/google
// bundles the latin subset here; full CJK glyph coverage requires self-hosting
// (future). See src/app/[locale]/layout.tsx for the per-locale application.
export const fontCJK = Noto_Sans_SC({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  weight: ['400', '500', '700'],
  variable: '--font-cjk',
});

// The three fonts applied on every route. The CJK variable is added per-locale
// (zh-CN) in the [locale] layout, never here — see fontCJK above.
export const fontVariables = `${fontDisplay.variable} ${fontSans.variable} ${fontMono.variable}`;
