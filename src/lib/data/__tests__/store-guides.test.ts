import { describe, it, expect, beforeEach } from 'vitest';
import {
  resetStore,
  PAYERS,
  getGuideTemplate,
  createGuidesFromEncounter,
  listEncounters,
  listGuides,
  getPatient,
} from '@/lib/data/store';

/** Block 2 — per-payer standard guide templates + dual generation on convênio selection. */
describe('per-payer guide templates + dual generation', () => {
  beforeEach(() => resetStore());

  it('seeds a guide template for every payer', () => {
    for (const payer of PAYERS) {
      const tpl = getGuideTemplate(payer);
      expect(tpl?.kind).toBe('guide');
      expect(tpl?.payer).toBe(payer);
      expect(tpl?.procedures?.length).toBeGreaterThan(0);
    }
  });

  it('generates BOTH the standard and the app-generated guide', () => {
    const enc = listEncounters().find((e) => !e.hasGuide)!;
    const patient = getPatient(enc.patientId)!;
    const { generated, standard } = createGuidesFromEncounter(enc.id);

    expect(generated.source).toBe('generated');
    expect(generated.encounterId).toBe(enc.id);

    expect(standard).not.toBeNull();
    expect(standard!.source).toBe('standard');
    expect(standard!.encounterId).toBe(enc.id);
    expect(standard!.payer).toBe(patient.payer);
    expect(standard!.procedures.length).toBeGreaterThan(0);

    const forEnc = listGuides().filter((g) => g.encounterId === enc.id);
    expect(forEnc.some((g) => (g.source ?? 'generated') === 'generated')).toBe(true);
    expect(forEnc.some((g) => g.source === 'standard')).toBe(true);
  });

  it('is idempotent — re-running yields the same two guides', () => {
    const enc = listEncounters().find((e) => !e.hasGuide)!;
    const first = createGuidesFromEncounter(enc.id);
    const again = createGuidesFromEncounter(enc.id);
    expect(again.generated.id).toBe(first.generated.id);
    expect(again.standard!.id).toBe(first.standard!.id);
    const forEnc = listGuides().filter((g) => g.encounterId === enc.id);
    expect(forEnc.filter((g) => g.source === 'standard').length).toBe(1);
    expect(forEnc.filter((g) => (g.source ?? 'generated') === 'generated').length).toBe(1);
  });
});
