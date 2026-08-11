import { apiError, authenticateApiKey, json, scopeError } from '@/lib/api';
import { CreateB2bJobRequest, toPublicJob } from '@/lib/b2b/contracts';
import { issueRecordingToken } from '@/lib/b2b/recording-token';
import { createJob, getExtractionSchema, listJobs } from '@/lib/b2b/repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = authenticateApiKey(req);
  if (auth.error) return auth.error;
  const forbidden = scopeError(auth.context, 'b2b:jobs:read');
  if (forbidden) return forbidden;

  const url = new URL(req.url);
  const limit = Number(url.searchParams.get('limit') ?? 50);
  const jobs = await listJobs(auth.context.orgId, Number.isFinite(limit) ? limit : 50);
  return json(jobs.map((job) => toPublicJob(job, false)));
}

export async function POST(req: Request) {
  const auth = authenticateApiKey(req);
  if (auth.error) return auth.error;
  const forbidden = scopeError(auth.context, 'b2b:jobs:write');
  if (forbidden) return forbidden;

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const parsed = CreateB2bJobRequest.safeParse(body);
  if (!parsed.success) {
    return apiError('invalid_request', parsed.error.issues.map((issue) => issue.message).join('; '), 400);
  }

  const schema = await getExtractionSchema(auth.context.orgId, parsed.data.schemaId);
  if (!schema || !schema.active) return apiError('schema_not_found', 'Extraction schema not found.', 404);

  const rawIdempotencyKey = req.headers.get('idempotency-key')?.trim();
  if (rawIdempotencyKey && rawIdempotencyKey.length > 200) {
    return apiError('invalid_idempotency_key', 'Idempotency-Key must have at most 200 characters.', 400);
  }

  const { job, created } = await createJob(
    auth.context.orgId,
    auth.context.keyId,
    schema,
    parsed.data,
    rawIdempotencyKey,
  );
  const upload = issueRecordingToken({
    jobId: job.id,
    orgId: job.orgId,
    allowedOrigins: auth.context.allowedOrigins,
  });

  return json({
    job: toPublicJob(job, false),
    uploadToken: upload.token,
    uploadTokenExpiresAt: upload.expiresAt,
    endpoints: {
      uploadChunk: `/api/v1/b2b/jobs/${job.id}/chunks`,
      complete: `/api/v1/b2b/jobs/${job.id}/complete`,
      status: `/api/v1/b2b/jobs/${job.id}`,
    },
  }, { status: created ? 201 : 200 });
}
