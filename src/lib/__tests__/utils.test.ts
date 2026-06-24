import { describe, it, expect } from 'vitest';
import {
  clamp,
  clock,
  formatCurrency,
  formatNumber,
  formatPercent,
  initials,
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
});
