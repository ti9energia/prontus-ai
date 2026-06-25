import { describe, it, expect } from 'vitest';
import { checkGuide, getTool, listTools, MARI_TOOLS } from '@/lib/mari/tools';
import type { TissGuide } from '@/lib/types';

function guide(over: Partial<TissGuide> = {}): TissGuide {
  return {
    id: 'gui_test',
    encounterId: 'enc_1',
    patientId: 'pat_1',
    type: 'consulta',
    payer: 'Unimed',
    cardNumber: '12345',
    professional: 'Dra. Helena',
    council: 'CRM-SP 123456',
    cbo: '225125',
    procedures: [{ code: '10101012', description: 'Consulta', qty: 1, value: 180 }],
    diagnoses: [{ code: 'I10', label: 'HAS' }],
    status: 'draft',
    value: 180,
    currency: 'BRL',
    issues: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    ...over,
  };
}

describe('checkGuide — pre-denial (pré-glosa) rules', () => {
  it('a complete guide is ready with a perfect score', () => {
    const r = checkGuide(guide());
    expect(r.ready).toBe(true);
    expect(r.score).toBe(100);
    expect(r.issues).toHaveLength(0);
  });

  it('flags missing CID and card number as high-severity blockers', () => {
    const r = checkGuide(guide({ diagnoses: [], cardNumber: '' }));
    expect(r.ready).toBe(false);
    const highs = r.issues.filter((i) => i.severity === 'high');
    expect(highs.map((i) => i.fieldKey).sort()).toEqual(['cardNumber', 'diagnoses']);
    expect(r.score).toBe(50); // two high blockers -> 2 * 25 penalty
  });

  it('treats empty procedures as a blocker', () => {
    const r = checkGuide(guide({ procedures: [], value: 0 }));
    expect(r.ready).toBe(false);
    expect(r.issues.some((i) => i.fieldKey === 'procedures' && i.severity === 'high')).toBe(true);
  });

  it('preserves pre-existing guide issues', () => {
    const r = checkGuide(guide({ issues: [{ id: 'x', fieldKey: 'foo', messageKey: 'bar', severity: 'low' }] }));
    expect(r.issues.some((i) => i.id === 'x')).toBe(true);
  });
});

describe('Mari tool registry', () => {
  it('resolves known tools and rejects unknown ones', () => {
    expect(getTool('glosa.check')?.id).toBe('glosa.check');
    expect(getTool('does.not.exist')).toBeUndefined();
  });

  it('lists clinical tools and marks submit as confirmation-required', () => {
    const clinical = listTools('clinical');
    expect(clinical.length).toBeGreaterThan(0);
    expect(clinical.every((t) => t.surfaces.includes('clinical'))).toBe(true);
    expect(MARI_TOOLS['tiss.submit'].requiresConfirmation).toBe(true);
  });
});
