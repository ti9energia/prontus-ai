import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  resetStore,
  addPatient,
  listPatients,
  listEncounters,
  ensureNote,
  getNote,
  updateNoteSection,
  persist,
  markDirty,
} from '@/lib/data/store';

/**
 * Stress + persistence-robustness coverage for the data layer (Block 1 / QA).
 * Verifies the store survives large batches and rapid edits, and that the
 * dirty-flag persist only serializes when something actually changed.
 */
describe('store — stress & persistence robustness', () => {
  beforeEach(() => {
    resetStore();
  });

  it('absorbs a large batch of patient inserts without error or loss', () => {
    const before = listPatients().length;
    for (let i = 0; i < 500; i++) addPatient({ name: `Paciente Stress ${i}`, payer: 'Unimed' });
    const after = listPatients();
    expect(after.length).toBe(before + 500);
    // ids stay unique across the batch
    expect(new Set(after.map((p) => p.id)).size).toBe(after.length);
  });

  it('keeps note version monotonic and content consistent under rapid edits', () => {
    const enc = listEncounters()[0];
    ensureNote(enc.id);
    const v0 = getNote(enc.id)!.version;
    for (let i = 0; i < 50; i++) updateNoteSection(enc.id, 'queixa', `conteudo ${i}`);
    const note = getNote(enc.id)!;
    expect(note.version).toBe(v0 + 50);
    expect(note.sections.find((s) => s.key === 'queixa')!.content).toBe('conteudo 49');
  });

  it('persist() writes only when the store is dirty', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem');
    markDirty();
    persist();
    const writes = spy.mock.calls.length;
    expect(writes).toBeGreaterThan(0);

    persist(); // nothing changed → no extra write
    expect(spy.mock.calls.length).toBe(writes);

    markDirty();
    persist(); // changed again → exactly one more write
    expect(spy.mock.calls.length).toBe(writes + 1);
    spy.mockRestore();
  });

  it('a mutation marks the store dirty so the next persist flushes it', () => {
    persist(); // flush whatever resetStore marked, store is now clean
    const spy = vi.spyOn(Storage.prototype, 'setItem');
    persist(); // still clean → no write
    expect(spy.mock.calls.length).toBe(0);
    addPatient({ name: 'Gatilho', payer: 'Amil' }); // audits → markDirty
    persist();
    expect(spy.mock.calls.length).toBe(1);
    spy.mockRestore();
  });
});
