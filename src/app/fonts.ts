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

// CJK fallback for zh-CN. next/font/google bundles Noto Sans SC with
// latin-only subset; full CJK glyph coverage requires self-hosting (future).
export const fontCJK = Noto_Sans_SC({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '700'],
  variable: '--font-cjk',
});

export const fontVariables = `${fontDisplay.variable} ${fontSans.variable} ${fontMono.variable} ${fontCJK.variable}`;
