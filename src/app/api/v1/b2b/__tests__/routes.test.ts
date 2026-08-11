import { beforeEach, describe, expect, it } from 'vitest';
import { POST as createSchema } from '../schemas/route';
import { POST as createJob } from '../jobs/route';
import { POST as completeJob } from '../jobs/[id]/complete/route';
import { resetB2bMemoryStore } from '@/lib/b2b/repository';

const headers = { authorization: 'Bearer sk_test_auronis_dev', 'content-type': 'application/json' };

async function fitNutriSchemaId(): Promise<string> {
  const response = await createSchema(new Request('http://localhost/api/v1/b2b/schemas', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'Anamnese FitNutri',
      fields: [
        { key: 'objetivo', label: 'Objetivo da consulta', type: 'long_text', required: true },
        { key: 'peso_atual_kg', label: 'Peso atual', type: 'number' },
      ],
    }),
  }));
  expect(response.status).toBe(201);
  return (await response.json()).data.id as string;
}

describe('B2B API routes', () => {
  beforeEach(() => resetB2bMemoryStore());

  it('creates a schema and a collecting job with a browser upload token', async () => {
    const schemaId = await fitNutriSchemaId();
    const response = await createJob(new Request('http://localhost/api/v1/b2b/jobs', {
      method: 'POST',
      headers: { ...headers, 'idempotency-key': 'fitnutri-consulta-42' },
      body: JSON.stringify({
        schemaId,
        externalId: 'consulta-42',
        consent: { confirmed: true, capturedAt: new Date().toISOString(), method: 'checkbox_fitnutri' },
      }),
    }));
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.data.job.status).toBe('collecting');
    expect(body.data.uploadToken).toMatch(/^rec_/);
    expect(body.data.endpoints.uploadChunk).toContain(body.data.job.id);
  });

  it('fails honestly when no real extraction model is configured', async () => {
    const schemaId = await fitNutriSchemaId();
    const createResponse = await createJob(new Request('http://localhost/api/v1/b2b/jobs', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        schemaId,
        consent: { confirmed: true, capturedAt: new Date().toISOString() },
      }),
    }));
    const created = (await createResponse.json()).data;
    const response = await completeJob(new Request(`http://localhost${created.endpoints.complete}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${created.uploadToken}`, 'content-type': 'application/json' },
      body: JSON.stringify({ transcript: 'Paciente relata objetivo de reduzir peso.' }),
    }), { params: Promise.resolve({ id: created.job.id }) });
    expect(response.status).toBe(503);
    expect((await response.json()).error.code).toBe('extraction_model_unavailable');
  });
});
