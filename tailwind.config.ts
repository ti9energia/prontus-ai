import type { Config } from 'tailwindcss';

/**
 * Auronis Health — Design System
 * "Somos extremamente inteligentes, mas também humanos."
 * Premium dark (Tesla / Apple Vision Pro): chromed silver + medical turquoise.
 * Brand turquoise #14C8C4 (hover #00A8A2) · Silver #C5CCD6 · Ink-black #090B0F.
 * Theme tokens are CSS variables (dark default / light); brand ramps are static.
 */
const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx,mdx}'],
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

        // Static brand ramp — medical turquoise (#14C8C4 primary, #00A8A2 hover)
        brand: {
          50: '#e7fcfb',
          100: '#c2f6f4',
          200: '#8eedea',
          300: '#52e0dc',
          400: '#23ccc8',
          500: '#14c8c4',
          600: '#00a8a2',
          700: '#0a8480',
          800: '#0f6663',
          900: '#114f4d',
          950: '#03302f',
          DEFAULT: '#14c8c4',
        },
        // Accent — electric cyan, for life/energy highlights
        accent: {
          50: '#ecfdff',
          100: '#cff7fe',
          200: '#a5effc',
          300: '#67e3f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          DEFAULT: '#22d3ee',
        },
        // Chromed silver — premium icons & details
        silver: {
          light: '#e2e6ec',
          DEFAULT: '#c5ccd6',
          dark: '#8a929c',
        },
        success: { DEFAULT: '#2ed47a', fg: '#13a85a', bg: '#e9fbf1' },
        warning: { DEFAULT: '#f5a623', fg: '#b4740c', bg: '#fff7e9' },
        danger: { DEFAULT: '#e5484d', fg: '#c2363b', bg: '#fdeced' },
        info: { DEFAULT: '#22d3ee', fg: '#0e7490', bg: '#ecfdff' },
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
        // Refined, layered shadows — premium depth on near-black.
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.30)',
        sm: '0 1px 3px 0 rgb(0 0 0 / 0.36), 0 1px 2px -1px rgb(0 0 0 / 0.24)',
        md: '0 6px 18px -6px rgb(0 0 0 / 0.50), 0 2px 8px -2px rgb(0 0 0 / 0.30)',
        lg: '0 22px 48px -18px rgb(0 0 0 / 0.62), 0 10px 20px -10px rgb(0 0 0 / 0.40)',
        xl: '0 40px 80px -28px rgb(0 0 0 / 0.70), 0 16px 32px -16px rgb(0 0 0 / 0.45)',
        glow: '0 0 0 1px rgb(20 200 196 / 0.22), 0 10px 36px -8px rgb(20 200 196 / 0.45)',
        'glow-accent': '0 0 0 1px rgb(34 211 238 / 0.24), 0 10px 36px -8px rgb(34 211 238 / 0.46)',
        focus: '0 0 0 3px rgb(20 200 196 / 0.30)',
        inset: 'inset 0 1px 0 0 rgb(255 255 255 / 0.05)',
      },
      backgroundImage: {
        'aurora':
          'radial-gradient(60% 80% at 12% 8%, rgb(20 200 196 / 0.30), transparent 60%), radial-gradient(50% 70% at 88% 18%, rgb(34 211 238 / 0.22), transparent 60%), radial-gradient(70% 60% at 76% 92%, rgb(0 168 162 / 0.18), transparent 60%)',
        'mesh':
          'radial-gradient(40% 60% at 18% 18%, rgb(20 200 196 / 0.14), transparent), radial-gradient(40% 60% at 82% 28%, rgb(34 211 238 / 0.10), transparent), radial-gradient(50% 50% at 50% 100%, rgb(0 168 162 / 0.10), transparent)',
        'brand-gradient': 'linear-gradient(135deg, #090B0F 0%, #171A21 52%, #0a8480 100%)',
        'chrome': 'linear-gradient(160deg, #f4f6f9 0%, #c5ccd6 28%, #8a929c 52%, #e2e6ec 74%, #aab2bd 100%)',
        'grid':
          'linear-gradient(to right, rgb(var(--hairline) / 0.7) 1px, transparent 1px), linear-gradient(to bottom, rgb(var(--hairline) / 0.7) 1px, transparent 1px)',
        'shine':
          'linear-gradient(110deg, transparent 30%, rgb(255 255 255 / 0.28) 50%, transparent 70%)',
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
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'record-pulse': {
          '0%': { boxShadow: '0 0 0 0 rgb(229 72 77 / 0.45)' },
          '70%': { boxShadow: '0 0 0 14px rgb(229 72 77 / 0)' },
          '100%': { boxShadow: '0 0 0 0 rgb(229 72 77 / 0)' },
        },
        'caret-blink': {
          '0%, 70%, 100%': { opacity: '1' },
          '20%, 50%': { opacity: '0' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'spin-slow': { to: { transform: 'rotate(360deg)' } },
        eq: {
          '0%, 100%': { transform: 'scaleY(0.3)' },
          '50%': { transform: 'scaleY(1)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
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
        eq: 'eq 0.9s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2.6s ease-in-out infinite',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
