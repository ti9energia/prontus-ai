import { describe, it, expect, beforeEach } from 'vitest';
import { resetStore } from '@/lib/data/store';
import { ownerBriefing } from '@/lib/mari/briefing';

/** Block 7 — the owner "Mari reunião" briefing deck. */
describe('owner briefing (Mari reunião)', () => {
  beforeEach(() => resetStore());

  it('builds a briefing deck that always includes the metrics line', () => {
    const points = ownerBriefing('pt-BR');
    expect(points.length).toBeGreaterThan(0);
    expect(points.some((p) => p.kind === 'metric')).toBe(true);
  });

  it('localizes to English', () => {
    const points = ownerBriefing('en');
    expect(points.find((p) => p.kind === 'metric')?.title).toContain('MRR');
  });
});
