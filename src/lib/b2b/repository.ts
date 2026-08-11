import { randomUUID } from 'node:crypto';
import { config } from '@/lib/config';
import type {
  B2bExtractionSchema,
  B2bJob,
  CreateB2bJobInput,
  CreateExtractionSchemaInput,
  TranscriptSegment,
} from './contracts';

type PrismaClientLike = any;

interface MemoryState {
  schemas: B2bExtractionSchema[];
  jobs: B2bJob[];
}

const globalState = globalThis as typeof globalThis & {
  __auronisB2bState__?: MemoryState;
  __auronisB2bPrisma__?: PrismaClientLike;
};

function memory(): MemoryState {
  if (!globalState.__auronisB2bState__) {
    globalState.__auronisB2bState__ = { schemas: [], jobs: [] };
  }
  return globalState.__auronisB2bState__;
}

function usePostgres(): boolean {
  return !config.runtime.isTest && !!config.db.url;
}

function prisma(): PrismaClientLike {
  if (!globalState.__auronisB2bPrisma__) {
    const { PrismaClient } = require('@prisma/client');
    globalState.__auronisB2bPrisma__ = new PrismaClient();
  }
  return globalState.__auronisB2bPrisma__;
}

const clone = <T>(value: T): T => structuredClone(value);
const iso = (value: Date | string | undefined): string | undefined =>
  value ? new Date(value).toISOString() : undefined;

function schemaFromRow(row: any): B2bExtractionSchema {
  return {
    id: row.id,
    orgId: row.orgId,
    name: row.name,
    description: row.description ?? undefined,
    instructions: row.instructions ?? undefined,
    version: row.version,
    fields: row.fields,
    active: row.active,
    createdAt: iso(row.createdAt)!,
    updatedAt: iso(row.updatedAt)!,
  };
}

function jobFromRow(row: any): B2bJob {
  return {
    id: row.id,
    orgId: row.orgId,
    apiKeyId: row.apiKeyId,
    schemaId: row.schemaId,
    schemaSnapshot: row.schemaSnapshot,
    externalId: row.externalId ?? undefined,
    idempotencyKey: row.idempotencyKey ?? undefined,
    locale: row.locale,
    status: row.status,
    metadata: row.metadata ?? {},
    consent: row.consent,
    retention: row.retention,
    webhookUrl: row.webhookUrl ?? undefined,
    webhookDelivery: row.webhookDelivery ?? undefined,
    segments: row.segments ?? [],
    transcript: row.transcript ?? undefined,
    result: row.result ?? undefined,
    error: row.error ?? undefined,
    usage: row.usage,
    createdAt: iso(row.createdAt)!,
    updatedAt: iso(row.updatedAt)!,
    completedAt: iso(row.completedAt),
  };
}

function jobData(job: B2bJob) {
  return {
    orgId: job.orgId,
    apiKeyId: job.apiKeyId,
    schemaId: job.schemaId,
    schemaSnapshot: job.schemaSnapshot,
    externalId: job.externalId ?? null,
    idempotencyKey: job.idempotencyKey ?? null,
    locale: job.locale,
    status: job.status,
    metadata: job.metadata,
    consent: job.consent,
    retention: job.retention,
    webhookUrl: job.webhookUrl ?? null,
    webhookDelivery: job.webhookDelivery ?? undefined,
    segments: job.segments,
    transcript: job.transcript ?? null,
    result: job.result ?? undefined,
    error: job.error ?? undefined,
    usage: job.usage,
    completedAt: job.completedAt ? new Date(job.completedAt) : null,
  };
}

export async function listExtractionSchemas(orgId: string): Promise<B2bExtractionSchema[]> {
  if (usePostgres()) {
    const rows = await prisma().b2bExtractionSchema.findMany({
      where: { orgId, active: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(schemaFromRow);
  }
  return memory().schemas.filter((schema) => schema.orgId === orgId && schema.active).map(clone);
}

export async function getExtractionSchema(
  orgId: string,
  id: string,
): Promise<B2bExtractionSchema | undefined> {
  if (usePostgres()) {
    const row = await prisma().b2bExtractionSchema.findFirst({ where: { id, orgId } });
    return row ? schemaFromRow(row) : undefined;
  }
  const schema = memory().schemas.find((item) => item.id === id && item.orgId === orgId);
  return schema ? clone(schema) : undefined;
}

export async function createExtractionSchema(
  orgId: string,
  input: CreateExtractionSchemaInput,
): Promise<B2bExtractionSchema> {
  const now = new Date().toISOString();
  const schema: B2bExtractionSchema = {
    id: `b2bs_${randomUUID().replace(/-/g, '')}`,
    orgId,
    name: input.name,
    description: input.description,
    instructions: input.instructions,
    version: input.version,
    fields: input.fields,
    active: true,
    createdAt: now,
    updatedAt: now,
  };

  if (usePostgres()) {
    const row = await prisma().b2bExtractionSchema.create({
      data: {
        id: schema.id,
        orgId,
        name: schema.name,
        description: schema.description ?? null,
        instructions: schema.instructions ?? null,
        version: schema.version,
        fields: schema.fields,
        active: true,
      },
    });
    return schemaFromRow(row);
  }

  memory().schemas.unshift(schema);
  return clone(schema);
}

export async function archiveExtractionSchema(orgId: string, id: string): Promise<boolean> {
  if (usePostgres()) {
    const result = await prisma().b2bExtractionSchema.updateMany({
      where: { id, orgId },
      data: { active: false },
    });
    return result.count > 0;
  }
  const schema = memory().schemas.find((item) => item.id === id && item.orgId === orgId);
  if (!schema) return false;
  schema.active = false;
  schema.updatedAt = new Date().toISOString();
  return true;
}

export async function listJobs(orgId: string, limit = 50): Promise<B2bJob[]> {
  if (usePostgres()) {
    const rows = await prisma().b2bJob.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 100),
    });
    return rows.map(jobFromRow);
  }
  return memory().jobs
    .filter((job) => job.orgId === orgId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, Math.min(Math.max(limit, 1), 100))
    .map(clone);
}

export async function getJob(orgId: string, id: string): Promise<B2bJob | undefined> {
  if (usePostgres()) {
    const row = await prisma().b2bJob.findFirst({ where: { id, orgId } });
    return row ? jobFromRow(row) : undefined;
  }
  const job = memory().jobs.find((item) => item.id === id && item.orgId === orgId);
  return job ? clone(job) : undefined;
}

export async function findJobByIdempotencyKey(
  orgId: string,
  idempotencyKey: string,
): Promise<B2bJob | undefined> {
  if (usePostgres()) {
    const row = await prisma().b2bJob.findFirst({ where: { orgId, idempotencyKey } });
    return row ? jobFromRow(row) : undefined;
  }
  const job = memory().jobs.find(
    (item) => item.orgId === orgId && item.idempotencyKey === idempotencyKey,
  );
  return job ? clone(job) : undefined;
}

export async function createJob(
  orgId: string,
  apiKeyId: string,
  schema: B2bExtractionSchema,
  input: CreateB2bJobInput,
  idempotencyKey?: string,
): Promise<{ job: B2bJob; created: boolean }> {
  if (idempotencyKey) {
    const existing = await findJobByIdempotencyKey(orgId, idempotencyKey);
    if (existing) return { job: existing, created: false };
  }

  const now = new Date().toISOString();
  const job: B2bJob = {
    id: `b2bj_${randomUUID().replace(/-/g, '')}`,
    orgId,
    apiKeyId,
    schemaId: schema.id,
    schemaSnapshot: schema,
    externalId: input.externalId,
    idempotencyKey,
    locale: input.locale,
    status: 'collecting',
    metadata: input.metadata ?? {},
    consent: input.consent,
    retention: input.retention,
    webhookUrl: input.webhookUrl,
    webhookDelivery: input.webhookUrl ? { status: 'pending', attempts: 0 } : undefined,
    segments: [],
    usage: { audioBytes: 0, audioDurationMs: 0, chunks: 0, transcriptCharacters: 0 },
    createdAt: now,
    updatedAt: now,
  };

  if (usePostgres()) {
    try {
      const row = await prisma().b2bJob.create({ data: { id: job.id, ...jobData(job) } });
      return { job: jobFromRow(row), created: true };
    } catch (error) {
      if (idempotencyKey && (error as { code?: string }).code === 'P2002') {
        const existing = await findJobByIdempotencyKey(orgId, idempotencyKey);
        if (existing) return { job: existing, created: false };
      }
      throw error;
    }
  }

  memory().jobs.unshift(job);
  return { job: clone(job), created: true };
}

export async function updateJob(
  orgId: string,
  id: string,
  updater: (job: B2bJob) => B2bJob,
): Promise<B2bJob | undefined> {
  const current = await getJob(orgId, id);
  if (!current) return undefined;
  const next = updater(clone(current));
  next.updatedAt = new Date().toISOString();

  if (usePostgres()) {
    const row = await prisma().b2bJob.update({ where: { id }, data: jobData(next) });
    return jobFromRow(row);
  }

  const index = memory().jobs.findIndex((item) => item.id === id && item.orgId === orgId);
  if (index < 0) return undefined;
  memory().jobs[index] = next;
  return clone(next);
}

export async function appendSegment(
  orgId: string,
  id: string,
  segment: TranscriptSegment,
): Promise<{ job?: B2bJob; duplicate: boolean }> {
  const current = await getJob(orgId, id);
  if (!current) return { duplicate: false };
  if (current.segments.some((item) => item.sequence === segment.sequence)) {
    return { job: current, duplicate: true };
  }

  const job = await updateJob(orgId, id, (draft) => {
    draft.segments.push(segment);
    draft.segments.sort((a, b) => a.sequence - b.sequence);
    draft.transcript = draft.segments.map((item) => item.text).filter(Boolean).join('\n');
    draft.usage.audioBytes += segment.audioBytes ?? 0;
    draft.usage.audioDurationMs += segment.durationMs ?? 0;
    draft.usage.chunks = draft.segments.length;
    draft.usage.transcriptCharacters = draft.transcript.length;
    draft.error = undefined;
    return draft;
  });
  return { job, duplicate: false };
}

export async function deleteJob(orgId: string, id: string): Promise<boolean> {
  if (usePostgres()) {
    const result = await prisma().b2bJob.deleteMany({ where: { id, orgId } });
    return result.count > 0;
  }
  const index = memory().jobs.findIndex((item) => item.id === id && item.orgId === orgId);
  if (index < 0) return false;
  memory().jobs.splice(index, 1);
  return true;
}

export function resetB2bMemoryStore(): void {
  globalState.__auronisB2bState__ = { schemas: [], jobs: [] };
}
