import { describe, it, expect } from 'vitest';
import { computeImpact, BASELINE_DENIAL_RATE, DOCTOR_HOUR_BRL } from '@/lib/mari/impact';
import { getTool } from '@/lib/mari/tools';

describe('computeImpact — Auronis value ledger', () => {
  it('rolls revenue, prevented denials and returned time into one monthly number', () => {
    const r = computeImpact({
      glossRate: 0.08,
      submitted: 100,
      recovered: 5000,
      atRisk: 800,
      minutesSaved: 600,
      avgGuideValue: 200,
    });
    // baseline 0.18 - 0.08 ≈ 0.10 -> prevented = 0.10 * 100 * 200 = 2000
    expect(r.preventedValue).toBe(2000);
    // 600 min = 10 h -> time value = 10 * 250 = 2500
    expect(r.hoursReturned).toBe(10);
    // monthly = 5000 recovered + 2000 prevented + 2500 time = 9500
    expect(r.monthlyImpact).toBe(9500);
    expect(r.denialRateDelta).toBeCloseTo(0.1, 5);
  });

  it('never reports negative prevented value when denials exceed the baseline', () => {
    const r = computeImpact({ glossRate: 0.3, submitted: 100, recovered: 0, atRisk: 0, minutesSaved: 0 });
    expect(r.denialRateDelta).toBe(0);
    expect(r.preventedValue).toBe(0);
    expect(r.monthlyImpact).toBe(0);
  });

  it('falls back to a default guide value when none is provided', () => {
    const r = computeImpact({ glossRate: 0.08, submitted: 10, recovered: 0, atRisk: 0, minutesSaved: 0 });
    expect(r.preventedValue).toBe(180); // 0.10 * 10 * 180
  });

  it('exposes its assumptions transparently', () => {
    expect(BASELINE_DENIAL_RATE).toBeGreaterThan(0);
    expect(DOCTOR_HOUR_BRL).toBeGreaterThan(0);
  });
});

describe('impact.summary tool', () => {
  it('runs over the live store and returns a monthly impact number', async () => {
    const tool = getTool('impact.summary');
    expect(tool).toBeDefined();
    const r = await tool!.run({}, { role: 'doctor', locale: 'pt-BR' });
    expect(r.ok).toBe(true);
    expect(typeof (r.data as { monthlyImpact: number }).monthlyImpact).toBe('number');
    expect(r.summary.length).toBeGreaterThan(0);
  });
});
