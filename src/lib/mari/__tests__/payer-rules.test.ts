import { describe, it, expect } from 'vitest';
import { evaluatePayer, getPayerRule, PAYER_RULES } from '@/lib/mari/payer-rules';
import { getTool } from '@/lib/mari/tools';
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
    status: 'draft',
    value: 180,
    currency: 'BRL',
    issues: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    ...over,
  };
}

describe('per-payer denial intelligence', () => {
  it('knows the major payers, case/space-insensitively', () => {
    expect(getPayerRule('Unimed')?.label).toBe('Unimed');
    expect(getPayerRule('  unimed ')?.label).toBe('Unimed');
    expect(getPayerRule('Unknown Health')).toBeUndefined();
  });

  it('flags a payer prior-authorization code as a high blocker', () => {
    const code = PAYER_RULES['unimed'].priorAuthCodes[0];
    const issues = evaluatePayer(guide({ procedures: [{ code, description: 'Imagem', qty: 1, value: 500 }] }));
    expect(issues.some((i) => i.messageKey === 'payerPriorAuth' && i.severity === 'high')).toBe(true);
  });

  it('flags a malformed card for the payer (medium)', () => {
    const issues = evaluatePayer(guide({ cardNumber: '123' }));
    expect(issues.some((i) => i.messageKey === 'payerCardFormat' && i.severity === 'medium')).toBe(true);
  });

  it('does not double-flag an empty card (the generic check owns that)', () => {
    expect(evaluatePayer(guide({ cardNumber: '' }))).toHaveLength(0);
  });

  it('leaves a clean guide and unknown payers alone', () => {
    expect(evaluatePayer(guide())).toHaveLength(0);
    expect(evaluatePayer(guide({ payer: 'Foo Health' }))).toHaveLength(0);
  });
});

describe('glosa.payerProfile tool', () => {
  it('is registered for the clinical and owner surfaces', () => {
    const tool = getTool('glosa.payerProfile');
    expect(tool).toBeDefined();
    expect(tool!.surfaces).toEqual(expect.arrayContaining(['clinical', 'owner']));
  });
});
