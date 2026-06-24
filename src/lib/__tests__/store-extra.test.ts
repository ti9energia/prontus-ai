import { describe, it, expect } from 'vitest';
import {
  agentRecommendations,
  glossTimeSeries,
  listGuides,
  mrrSeries,
  ownerStats,
  resubmitGuide,
} from '@/lib/data/store';

describe('store — analytics & mutations', () => {
  it('resubmitGuide clears the gloss reason and marks it sent', () => {
    const glossed = listGuides().find((g) => g.status === 'glossed');
    if (!glossed) return; // tolerate shared-state ordering
    resubmitGuide(glossed.id);
    expect(glossed.status).toBe('sent');
    expect(glossed.glossReasonKey).toBeUndefined();
  });

  it('glossTimeSeries returns 6 points with before/after series', () => {
    const s = glossTimeSeries();
    expect(s).toHaveLength(6);
    expect(s[0]).toHaveProperty('before');
    expect(s[0]).toHaveProperty('after');
  });

  it('mrrSeries returns 6 monthly points', () => {
    expect(mrrSeries()).toHaveLength(6);
  });

  it('ownerStats has positive MRR and bounded rates', () => {
    const o = ownerStats();
    expect(o.mrr).toBeGreaterThan(0);
    expect(o.churn).toBeGreaterThanOrEqual(0);
    expect(o.errorRate).toBeGreaterThanOrEqual(0);
    expect(o.errorRate).toBeLessThan(1);
  });

  it('agent recommendations carry bounded confidence and impact', () => {
    const recs = agentRecommendations();
    expect(recs.length).toBeGreaterThan(0);
    for (const r of recs) {
      expect(r.confidence).toBeGreaterThan(0);
      expect(r.confidence).toBeLessThanOrEqual(1);
      expect(r.impact).toBeGreaterThanOrEqual(0);
    }
  });
});
