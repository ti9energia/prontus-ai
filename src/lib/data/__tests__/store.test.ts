import { describe, it, expect } from 'vitest';
import {
  addPatient,
  billingStats,
  getGuide,
  getPatient,
  glossReasons,
  listGuides,
  listPatients,
  listTenants,
  ownerInsights,
} from '@/lib/data/store';

describe('store — patients', () => {
  it('listPatients returns the seeded patients', () => {
    const patients = listPatients();
    expect(patients.length).toBeGreaterThan(0);
    expect(patients.every((p) => typeof p.id === 'string' && p.id.length > 0)).toBe(true);
  });

  it('getPatient resolves a seeded id and is undefined for an unknown one', () => {
    const first = listPatients()[0];
    expect(getPatient(first.id)).toBe(first);
    expect(getPatient('pat_does_not_exist')).toBeUndefined();
  });

  it('addPatient appends a retrievable patient and trims its fields', () => {
    const before = listPatients().length;
    const created = addPatient({ name: '  Novo Paciente  ', payer: '  Amil ' });

    expect(listPatients().length).toBe(before + 1);
    expect(created.name).toBe('Novo Paciente');
    expect(created.payer).toBe('Amil');
    expect(created.consent).toBe('pending');
    // retrievable by its own id right after insertion
    expect(getPatient(created.id)?.id).toBe(created.id);
  });

  it('addPatient falls back to defaults for blank input', () => {
    const created = addPatient({ name: '   ', payer: '   ' });
    expect(created.name).toMatch(/^Paciente /);
    expect(created.payer).toBe('Unimed');
  });
});

describe('store — guides', () => {
  it('listGuides is non-empty and getGuide round-trips by id', () => {
    const guides = listGuides();
    expect(guides.length).toBeGreaterThan(0);
    const sample = guides[0];
    expect(getGuide(sample.id)).toBe(sample);
  });

  it('getGuide returns undefined for an unknown id', () => {
    expect(getGuide('gui_nope')).toBeUndefined();
  });
});

describe('store — billingStats invariants', () => {
  it('totals are coherent and the gloss rate is a finite fraction', () => {
    const s = billingStats();
    expect(s.submitted).toBeGreaterThanOrEqual(0);
    expect(s.paid).toBeGreaterThanOrEqual(0);
    expect(s.glossed).toBeGreaterThanOrEqual(0);
    // paid + glossed can never exceed everything that was submitted
    expect(s.paid + s.glossed).toBeLessThanOrEqual(s.submitted);
    expect(s.recovered).toBeGreaterThanOrEqual(0);
    expect(s.atRisk).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(s.glossRate)).toBe(true);
    expect(s.glossRate).toBeGreaterThanOrEqual(0);
    expect(s.glossRate).toBeLessThanOrEqual(1);
    expect(s.currency).toBe('BRL');
  });
});

describe('store — glossReasons', () => {
  it('returns labelled reason buckets with positive counts', () => {
    const reasons = glossReasons();
    expect(reasons.length).toBeGreaterThan(0);
    for (const r of reasons) {
      expect(typeof r.key).toBe('string');
      expect(r.key.length).toBeGreaterThan(0);
      expect(r.value).toBeGreaterThan(0);
    }
  });
});

describe('store — ownerInsights', () => {
  it('rolls up coherent, bounded owner-facing numbers', () => {
    const o = ownerInsights();
    expect(o.tenantCount).toBe(listTenants().length);
    expect(o.stats.mrr).toBeGreaterThan(0);

    // highUsage is the top slice (≤ 3) sorted by usage descending
    expect(o.highUsage.length).toBeGreaterThan(0);
    expect(o.highUsage.length).toBeLessThanOrEqual(3);
    for (let i = 1; i < o.highUsage.length; i++) {
      expect(o.highUsage[i - 1].usagePct).toBeGreaterThanOrEqual(o.highUsage[i].usagePct);
    }

    // each bucket is a real subset of the tenant list
    const ids = new Set(listTenants().map((t) => t.id));
    for (const bucket of [o.atRisk, o.trials, o.upsell]) {
      expect(Array.isArray(bucket)).toBe(true);
      expect(bucket.every((t) => ids.has(t.id))).toBe(true);
    }
    // upsell tenants are, by definition, high-usage non-scale plans
    expect(o.upsell.every((t) => t.planId !== 'plan_scale' && t.usagePct >= 80)).toBe(true);
  });
});
