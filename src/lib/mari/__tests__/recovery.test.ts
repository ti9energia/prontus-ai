import { describe, it, expect } from 'vitest';
import { diagnoseGuide, getTool, MARI_TOOLS } from '@/lib/mari/tools';
import type { TissGuide } from '@/lib/types';

function guide(over: Partial<TissGuide> = {}): TissGuide {
  return {
    id: 'gui_test',
    encounterId: 'enc_1',
    patientId: 'pat_1',
    type: 'consulta',
    payer: 'Unimed',
    cardNumber: '00012345678901',
    professional: 'Dra. Helena',
    council: 'CRM-SP 123456',
    cbo: '225125',
    procedures: [{ code: '10101012', description: 'Consulta', qty: 1, value: 180 }],
    diagnoses: [{ code: 'I10', label: 'HAS' }],
    status: 'glossed',
    value: 180,
    currency: 'BRL',
    issues: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    ...over,
  };
}

describe('glosa recovery — diagnosis', () => {
  it('marks a guide with high-severity gaps as not yet recoverable', () => {
    const dx = diagnoseGuide(guide({ diagnoses: [] })); // missing CID = high blocker
    expect(dx.recoverable).toBe(false);
    expect(dx.issues.some((i) => i.severity === 'high')).toBe(true);
  });

  it('marks a clean guide as recoverable', () => {
    expect(diagnoseGuide(guide()).recoverable).toBe(true);
  });

  it('uses the recorded denial reason when present', () => {
    expect(diagnoseGuide(guide({ glossReasonKey: 'expiredCard' })).reasonKey).toBe('expiredCard');
  });
});

describe('glosa recovery — tools', () => {
  it('registers the recovery queue and a confirmation-guarded resubmit', () => {
    expect(getTool('glosa.recoveryQueue')?.surfaces).toEqual(expect.arrayContaining(['clinical', 'owner']));
    expect(MARI_TOOLS['glosa.resubmit'].requiresConfirmation).toBe(true);
    expect(MARI_TOOLS['glosa.resubmit'].surfaces).toContain('clinical');
  });
});
