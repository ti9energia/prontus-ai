import type { Config } from 'tailwindcss';

/**
 * Prontus.ai — Design System
 * "Clinical Calm meets Premium Precision."
 * Brand: clinical teal #0D9488 · Accent: coral #FB7185
 * Theme tokens are CSS variables (light/dark); brand/accent ramps are static.
 */
const config: Config = {
  darkMode: ['class'],
  content: [
    './src/**/*.{ts,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: { '2xl': '1280px' },
    },
    extend: {
      colors: {
        // Theme-aware semantic tokens (defined in globals.css)
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        elevated: 'rgb(var(--elevated) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        subtle: 'rgb(var(--subtle) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        hairline: 'rgb(var(--hairline) / <alpha-value>)',
        ring: 'rgb(var(--ring) / <alpha-value>)',

        // Static brand ramp — clinical teal
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
          DEFAULT: '#0d9488',
        },
        // Static accent ramp — coral / rose
        accent: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
          DEFAULT: '#fb7185',
        },
        success: {
          DEFAULT: '#10b981',
          fg: '#047857',
          bg: '#ecfdf5',
        },
        warning: {
          DEFAULT: '#f59e0b',
          fg: '#b45309',
          bg: '#fffbeb',
        },
        danger: {
          DEFAULT: '#ef4444',
          fg: '#b91c1c',
          bg: '#fef2f2',
        },
        info: {
          DEFAULT: '#3b82f6',
          fg: '#1d4ed8',
          bg: '#eff6ff',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Sora', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.02em' }],
        'display-sm': ['2.5rem', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'display-md': ['3.5rem', { lineHeight: '1.02', letterSpacing: '-0.03em' }],
        'display-lg': ['4.75rem', { lineHeight: '0.98', letterSpacing: '-0.035em' }],
        'display-xl': ['6rem', { lineHeight: '0.95', letterSpacing: '-0.04em' }],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
        xl: '22px',
        '2xl': '28px',
        '3xl': '36px',
      },
      spacing: {
        '4.5': '1.125rem',
        '18': '4.5rem',
        '22': '5.5rem',
      },
      boxShadow: {
        // Refined, layered, low-contrast shadows — premium, not heavy.
        xs: '0 1px 2px 0 rgb(8 15 30 / 0.04)',
        sm: '0 1px 3px 0 rgb(8 15 30 / 0.06), 0 1px 2px -1px rgb(8 15 30 / 0.04)',
        md: '0 4px 14px -4px rgb(8 15 30 / 0.10), 0 2px 6px -2px rgb(8 15 30 / 0.06)',
        lg: '0 18px 40px -16px rgb(8 15 30 / 0.18), 0 8px 16px -8px rgb(8 15 30 / 0.08)',
        xl: '0 32px 64px -24px rgb(8 15 30 / 0.28), 0 12px 24px -12px rgb(8 15 30 / 0.10)',
        glow: '0 0 0 1px rgb(13 148 136 / 0.18), 0 8px 30px -8px rgb(13 148 136 / 0.35)',
        'glow-accent': '0 0 0 1px rgb(251 113 133 / 0.20), 0 8px 30px -8px rgb(251 113 133 / 0.38)',
        focus: '0 0 0 3px rgb(13 148 136 / 0.22)',
        inset: 'inset 0 1px 0 0 rgb(255 255 255 / 0.06)',
      },
      backgroundImage: {
        'aurora':
          'radial-gradient(60% 80% at 15% 10%, rgb(13 148 136 / 0.28), transparent 60%), radial-gradient(50% 70% at 85% 20%, rgb(45 212 191 / 0.22), transparent 60%), radial-gradient(70% 60% at 75% 90%, rgb(251 113 133 / 0.18), transparent 60%)',
        'mesh':
          'radial-gradient(40% 60% at 20% 20%, rgb(13 148 136 / 0.10), transparent), radial-gradient(40% 60% at 80% 30%, rgb(251 113 133 / 0.08), transparent), radial-gradient(50% 50% at 50% 100%, rgb(20 184 166 / 0.08), transparent)',
        'grid':
          'linear-gradient(to right, rgb(var(--hairline) / 0.6) 1px, transparent 1px), linear-gradient(to bottom, rgb(var(--hairline) / 0.6) 1px, transparent 1px)',
        'shine':
          'linear-gradient(110deg, transparent 30%, rgb(255 255 255 / 0.45) 50%, transparent 70%)',
      },
      backgroundSize: {
        grid: '44px 44px',
      },
      keyframes: {
        aurora: {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)', opacity: '0.9' },
          '33%': { transform: 'translate3d(2%, -3%, 0) scale(1.08)', opacity: '1' },
          '66%': { transform: 'translate3d(-2%, 2%, 0) scale(0.96)', opacity: '0.85' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'record-pulse': {
          '0%': { boxShadow: '0 0 0 0 rgb(244 63 94 / 0.45)' },
          '70%': { boxShadow: '0 0 0 14px rgb(244 63 94 / 0)' },
          '100%': { boxShadow: '0 0 0 0 rgb(244 63 94 / 0)' },
        },
        'caret-blink': {
          '0%, 70%, 100%': { opacity: '1' },
          '20%, 50%': { opacity: '0' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'spin-slow': {
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        aurora: 'aurora 16s ease-in-out infinite',
        float: 'float 7s ease-in-out infinite',
        'fade-up': 'fade-up 0.6s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in': 'fade-in 0.5s ease both',
        'scale-in': 'scale-in 0.35s cubic-bezier(0.16,1,0.3,1) both',
        shimmer: 'shimmer 1.8s infinite',
        'record-pulse': 'record-pulse 1.8s cubic-bezier(0.4,0,0.6,1) infinite',
        'caret-blink': 'caret-blink 1.1s steps(1) infinite',
        marquee: 'marquee 34s linear infinite',
        'spin-slow': 'spin-slow 9s linear infinite',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
