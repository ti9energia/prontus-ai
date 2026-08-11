import { beforeEach, describe, expect, it } from 'vitest';
import {
  appendSegment,
  createExtractionSchema,
  createJob,
  getExtractionSchema,
  getJob,
  listExtractionSchemas,
  resetB2bMemoryStore,
} from '../repository';

const schemaInput = {
  name: 'Formulário parceiro',
  version: 1,
  fields: [{ key: 'queixa', label: 'Queixa', type: 'long_text' as const, required: true }],
};

describe('B2B tenant repository', () => {
  beforeEach(() => resetB2bMemoryStore());

  it('never returns another tenant schema', async () => {
    const schema = await createExtractionSchema('org_a', schemaInput);
    expect(await getExtractionSchema('org_a', schema.id)).toBeDefined();
    expect(await getExtractionSchema('org_b', schema.id)).toBeUndefined();
    expect(await listExtractionSchemas('org_b')).toEqual([]);
  });

  it('deduplicates jobs with the same tenant idempotency key', async () => {
    const schema = await createExtractionSchema('org_a', schemaInput);
    const input = {
      schemaId: schema.id,
      locale: 'pt-BR',
      metadata: {},
      consent: { confirmed: true as const, capturedAt: new Date().toISOString() },
      retention: 'result_only' as const,
    };
    const first = await createJob('org_a', 'key_a', schema, input, 'consulta-123');
    const second = await createJob('org_a', 'key_a', schema, input, 'consulta-123');
    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.job.id).toBe(first.job.id);
  });

  it('keeps chunks ordered and ignores a repeated sequence', async () => {
    const schema = await createExtractionSchema('org_a', schemaInput);
    const { job } = await createJob('org_a', 'key_a', schema, {
      schemaId: schema.id,
      locale: 'pt-BR',
      metadata: {},
      consent: { confirmed: true, capturedAt: new Date().toISOString() },
      retention: 'transcript_and_result',
    });
    await appendSegment('org_a', job.id, { sequence: 2, text: 'fim', source: 'partner', createdAt: new Date().toISOString() });
    await appendSegment('org_a', job.id, { sequence: 1, text: 'início', source: 'partner', createdAt: new Date().toISOString() });
    const duplicate = await appendSegment('org_a', job.id, { sequence: 1, text: 'duplicado', source: 'partner', createdAt: new Date().toISOString() });
    const stored = await getJob('org_a', job.id);
    expect(duplicate.duplicate).toBe(true);
    expect(stored?.transcript).toBe('início\nfim');
    expect(stored?.segments).toHaveLength(2);
  });
});
