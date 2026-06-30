import { describe, it, expect } from 'vitest';
import { calcRoi } from '@/components/landing/roi-calculator';

describe('calcRoi', () => {
  it('calculates recovery for 3 doctors, 12 consults, R$250 ticket, 18% gloss', () => {
    const r = calcRoi({ doctors: 3, consultsPerDay: 12, ticketAvg: 250, glossRate: 18 });
    // billingGross = 3 * 12 * 22 * 250 = 198 000
    // glossMonthly = 198 000 * 0.18 = 35 640
    // recovery = round(35 640 * 0.7) = 24 948
    expect(r.recovery).toBe(24948);
    // timeSaved = round(3 * 1.8 * 22) = round(118.8) = 119
    expect(r.timeSaved).toBe(119);
    expect(r.plan).toBe('Pro');
    expect(r.planPrice).toBe(197);
    expect(r.daysToBreakEven).toBeGreaterThan(0);
  });

  it('returns positive recovery for minimum values', () => {
    const r = calcRoi({ doctors: 1, consultsPerDay: 5, ticketAvg: 80, glossRate: 5 });
    expect(r.recovery).toBeGreaterThan(0);
  });

  it('recovery is zero when glossRate is 0', () => {
    const r = calcRoi({ doctors: 1, consultsPerDay: 5, ticketAvg: 80, glossRate: 0 });
    expect(r.recovery).toBe(0);
    expect(r.daysToBreakEven).toBe(0);
  });

  it('selects Starter plan for 1-2 doctors', () => {
    const r1 = calcRoi({ doctors: 1, consultsPerDay: 10, ticketAvg: 200, glossRate: 15 });
    expect(r1.plan).toBe('Starter');
    expect(r1.planPrice).toBe(97);

    const r2 = calcRoi({ doctors: 2, consultsPerDay: 10, ticketAvg: 200, glossRate: 15 });
    expect(r2.plan).toBe('Starter');
  });

  it('selects Pro plan for 3-5 doctors', () => {
    const r = calcRoi({ doctors: 5, consultsPerDay: 12, ticketAvg: 250, glossRate: 18 });
    expect(r.plan).toBe('Pro');
    expect(r.planPrice).toBe(197);
  });

  it('selects Scale plan for 6+ doctors', () => {
    const r = calcRoi({ doctors: 6, consultsPerDay: 15, ticketAvg: 300, glossRate: 20 });
    expect(r.plan).toBe('Scale');
    expect(r.planPrice).toBe(397);
  });

  it('billingGross matches formula', () => {
    const r = calcRoi({ doctors: 2, consultsPerDay: 10, ticketAvg: 150, glossRate: 10 });
    expect(r.billingGross).toBe(2 * 10 * 22 * 150);
  });
});
