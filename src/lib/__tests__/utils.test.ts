import { describe, it, expect } from 'vitest';
import {
  clamp,
  clock,
  cn,
  formatCompact,
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
  initials,
  intlLocale,
  timeAgo,
} from '@/lib/utils';

describe('utils', () => {
  it('clock formats seconds as mm:ss', () => {
    expect(clock(0)).toBe('00:00');
    expect(clock(65)).toBe('01:05');
    expect(clock(3599)).toBe('59:59');
  });

  it('initials takes up to two uppercase initials', () => {
    expect(initials('Marina Albuquerque')).toBe('MA');
    expect(initials('Helena')).toBe('H');
    expect(initials('Carlos Eduardo Lima')).toBe('CE');
  });

  it('clamp bounds a value', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(42, 0, 10)).toBe(10);
  });

  it('formatPercent respects locale + fraction digits', () => {
    expect(formatPercent(0.375, 'en', 1)).toBe('37.5%');
  });

  it('formatNumber groups thousands', () => {
    expect(formatNumber(184320, 'en')).toBe('184,320');
  });

  it('formatCurrency renders the amount', () => {
    expect(formatCurrency(180, 'pt-BR', 'BRL')).toContain('180');
  });

  it('formatCurrency carries the currency symbol per locale', () => {
    const brl = formatCurrency(180, 'pt-BR', 'BRL');
    expect(brl).toContain('R$');
    expect(brl).toContain('180');

    const usd = formatCurrency(180, 'en', 'USD');
    expect(usd).toContain('$');
    expect(usd).toContain('180');
  });
});

describe('utils — classnames (cn)', () => {
  it('merges multiple class strings', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('lets the last Tailwind utility win (dedupe via tailwind-merge)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('drops falsy values and flattens arrays', () => {
    expect(cn('a', false && 'b', undefined, null, 'c')).toBe('a c');
    expect(cn(['a', 'b'], 'c')).toBe('a b c');
  });

  it('applies conditional object syntax', () => {
    expect(cn('base', { active: true, hidden: false })).toBe('base active');
  });
});

describe('utils — dates & misc formatting', () => {
  it('intlLocale passes BCP-47 tags through unchanged', () => {
    expect(intlLocale('pt-BR')).toBe('pt-BR');
    expect(intlLocale('en')).toBe('en');
  });

  it('formatDate renders day + short month by default (locale-aware)', () => {
    // Use explicit local Date components to avoid timezone drift from string parsing.
    const d = new Date(2026, 5, 24); // 24 June 2026, local midnight
    const en = formatDate(d, 'en');
    expect(en).toContain('24');
    expect(en).toContain('Jun');

    expect(formatDate(d, 'pt-BR')).toContain('24');
  });

  it('formatDate honours custom Intl options', () => {
    const d = new Date(2026, 5, 24);
    expect(formatDate(d, 'en', { year: 'numeric' })).toContain('2026');
  });

  it('formatCompact abbreviates large numbers', () => {
    const out = formatCompact(12400, 'en');
    expect(out).toMatch(/12\.4/);
    expect(out.toUpperCase()).toContain('K');
  });

  it('timeAgo reports relative minutes and hours in the past', () => {
    const now = new Date('2026-06-25T12:00:00Z');
    const thirtyMinAgo = new Date('2026-06-25T11:30:00Z');
    const twoHoursAgo = new Date('2026-06-25T10:00:00Z');

    expect(timeAgo(thirtyMinAgo, 'en', now)).toMatch(/minute/);
    expect(timeAgo(twoHoursAgo, 'en', now)).toMatch(/hour/);
  });
});
