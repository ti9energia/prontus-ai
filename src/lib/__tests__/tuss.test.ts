import { describe, it, expect } from 'vitest';
import { lookupTuss, lookupTussPrice, lookupCid, suggestCids, suggestProcs } from '../tuss';

describe('lookupTuss', () => {
  it('returns the consultation entry', () => {
    const item = lookupTuss('10101012');
    expect(item).toBeDefined();
    expect(item!.description).toMatch(/consulta/i);
    expect(item!.basePrice).toBe(180);
  });

  it('returns undefined for unknown code', () => {
    expect(lookupTuss('99999999')).toBeUndefined();
  });
});

describe('lookupTussPrice', () => {
  it('returns base price for Unimed (multiplier 1.0)', () => {
    expect(lookupTussPrice('10101012', 'Unimed')).toBe(180);
  });

  it('applies Hapvida discount (0.92)', () => {
    const price = lookupTussPrice('10101012', 'Hapvida');
    expect(price).toBeCloseTo(180 * 0.92, 1);
  });

  it('applies Bradesco premium (1.05)', () => {
    const price = lookupTussPrice('10101012', 'Bradesco Saúde');
    expect(price).toBeCloseTo(180 * 1.05, 1);
  });

  it('returns fallback 180 for unknown code', () => {
    expect(lookupTussPrice('99999999', 'Unimed')).toBe(180);
  });

  it('returns base price when no payer given', () => {
    expect(lookupTussPrice('40901360')).toBe(85);
  });
});

describe('lookupCid', () => {
  it('finds hypertension code', () => {
    const cid = lookupCid('I10');
    expect(cid).toBeDefined();
    expect(cid!.label).toMatch(/hipertensão/i);
  });

  it('returns undefined for unknown code', () => {
    expect(lookupCid('ZZZ')).toBeUndefined();
  });
});

describe('suggestCids', () => {
  it('matches hypertension from Portuguese note text', () => {
    const cids = suggestCids('pressão arterial elevada, cefaleia, hipertensão');
    expect(cids[0].code).toBe('I10');
    expect(cids[0].confidence).toBeGreaterThan(0.8);
  });

  it('matches headache code', () => {
    const cids = suggestCids('dor de cabeça intensa, cefaleia');
    const codes = cids.map((c) => c.code);
    expect(codes).toContain('R51');
  });

  it('returns empty array for unrelated text', () => {
    const cids = suggestCids('revisão do contrato de software');
    expect(cids).toHaveLength(0);
  });

  it('caps result at 3 items', () => {
    const cids = suggestCids('hipertensão diabetes colesterol cefaleia dor abdominal ansiedade');
    expect(cids.length).toBeLessThanOrEqual(3);
  });
});

describe('suggestProcs', () => {
  it('always includes consultation code', () => {
    const procs = suggestProcs('consulta de retorno');
    expect(procs[0].code).toBe('10101012');
    expect(procs[0].confidence).toBe(0.98);
  });

  it('includes ECG when mentioned', () => {
    const procs = suggestProcs('solicitei eletrocardiograma e hemograma');
    const codes = procs.map((p) => p.code);
    expect(codes).toContain('40901360');
    expect(codes).toContain('40304361');
  });

  it('caps result at 4 items', () => {
    const procs = suggestProcs('ecg hemograma holter espirometria ecocardiograma ultrassom');
    expect(procs.length).toBeLessThanOrEqual(4);
  });
});
