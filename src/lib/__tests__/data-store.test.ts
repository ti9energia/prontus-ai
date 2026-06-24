import { describe, it, expect } from 'vitest';
import {
  approveNote,
  billingStats,
  createGuideFromEncounter,
  ensureNote,
  getGuideByEncounter,
  getNote,
  listEncounters,
  listPatients,
  submitGuide,
} from '@/lib/data/store';

describe('data store (backend)', () => {
  it('seeds patients and encounters', () => {
    expect(listPatients().length).toBeGreaterThan(0);
    expect(listEncounters().length).toBeGreaterThan(0);
  });

  it('billingStats returns a gloss rate between 0 and 1', () => {
    const s = billingStats();
    expect(s.submitted).toBeGreaterThan(0);
    expect(s.glossRate).toBeGreaterThanOrEqual(0);
    expect(s.glossRate).toBeLessThanOrEqual(1);
  });

  it('ensureNote creates a clinical note with 5 sections', () => {
    const enc = listEncounters().find((e) => e.status === 'scheduled')!;
    const note = ensureNote(enc.id);
    expect(note.sections).toHaveLength(5);
    expect(note.sections.map((x) => x.key)).toEqual([
      'queixa',
      'hma',
      'exame',
      'hipoteses',
      'conduta',
    ]);
  });

  it('createGuideFromEncounter creates a draft guide and flags hasGuide', () => {
    const enc = listEncounters().find((e) => !e.hasGuide && e.status === 'scheduled')!;
    const guide = createGuideFromEncounter(enc.id);
    expect(guide.encounterId).toBe(enc.id);
    expect(getGuideByEncounter(enc.id)).toBeTruthy();
    expect(enc.hasGuide).toBe(true);
  });

  it('submitGuide moves a guide to "sent"', () => {
    const enc = listEncounters().find((e) => e.status === 'scheduled')!;
    const guide = createGuideFromEncounter(enc.id);
    submitGuide(guide.id);
    expect(guide.status).toBe('sent');
  });

  it('approveNote finalizes the note and encounter', () => {
    const enc = listEncounters()[0];
    ensureNote(enc.id);
    approveNote(enc.id);
    expect(getNote(enc.id)!.approved).toBe(true);
    expect(enc.status).toBe('finalized');
  });
});
