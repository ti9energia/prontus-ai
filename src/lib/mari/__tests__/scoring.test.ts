import { describe, it, expect } from 'vitest';
import { scoreIssues } from '@/lib/mari/tools';
import { payerKey } from '@/lib/mari/payer-rules';
import { impactFromStore } from '@/lib/mari/impact';
import type { TissIssue } from '@/lib/types';

const issue = (severity: TissIssue['severity'], n = 0): TissIssue => ({
  id: `i${n}`,
  fieldKey: `f${n}`,
  messageKey: `m${n}`,
  severity,
});

describe('scoreIssues — readiness scoring', () => {
  it('a clean guide scores 100 and is ready', () => {
    expect(scoreIssues([])).toEqual({ score: 100, ready: true });
  });

  it('penalises by severity (high 25, medium 10, low 5)', () => {
    expect(scoreIssues([issue('high')]).score).toBe(75);
    expect(scoreIssues([issue('medium')]).score).toBe(90);
    expect(scoreIssues([issue('low')]).score).toBe(95);
  });

  it('sums penalties across multiple issues', () => {
    const r = scoreIssues([issue('medium', 1), issue('low', 2), issue('low', 3)]);
    expect(r.score).toBe(80); // 100 - 10 - 5 - 5
    expect(r.ready).toBe(true); // no high-severity issue
  });

  it('any high-severity issue blocks readiness', () => {
    expect(scoreIssues([issue('high')]).ready).toBe(false);
    expect(scoreIssues([issue('medium'), issue('high')]).ready).toBe(false);
  });

  it('floors the score at 0 (never negative) for many blockers', () => {
    const fiveHighs = Array.from({ length: 5 }, (_, i) => issue('high', i));
    const r = scoreIssues(fiveHighs);
    expect(r.score).toBe(0); // 100 - 125, clamped
    expect(r.ready).toBe(false);
  });
});

describe('payerKey — normalisation', () => {
  it('trims and lowercases the payer name', () => {
    expect(payerKey('  Unimed ')).toBe('unimed');
    expect(payerKey('Bradesco Saúde')).toBe('bradesco saúde');
  });
});

describe('impactFromStore — live ledger invariants', () => {
  it('returns a coherent, non-negative BRL impact rollup', () => {
    const im = impactFromStore();
    expect(im.currency).toBe('BRL');
    expect(im.monthlyImpact).toBeGreaterThanOrEqual(0);
    expect(im.recovered).toBeGreaterThanOrEqual(0);
    expect(im.atRisk).toBeGreaterThanOrEqual(0);
    expect(im.preventedValue).toBeGreaterThanOrEqual(0);
    expect(im.hoursReturned).toBeGreaterThanOrEqual(0);
    // denial-rate delta is a bounded 0..1 fraction
    expect(im.denialRateDelta).toBeGreaterThanOrEqual(0);
    expect(im.denialRateDelta).toBeLessThanOrEqual(1);
    // monthly impact is at least the cash already recovered
    expect(im.monthlyImpact).toBeGreaterThanOrEqual(im.recovered);
  });
});
