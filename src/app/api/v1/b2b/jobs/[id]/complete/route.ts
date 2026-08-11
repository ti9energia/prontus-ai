import { apiError, json } from '@/lib/api';
import {
  CompleteB2bJobRequest,
  toPublicJob,
  type TranscriptSegment,
} from '@/lib/b2b/contracts';
import { extractStructuredData, ExtractionUnavailableError } from '@/lib/b2b/extractor';
import { authorizeJobRequest, originError, recordingPreflight, withCors } from '@/lib/b2b/request';
import { appendSegment, getJob, updateJob } from '@/lib/b2b/repository';
import { deliverCompletionWebhook } from '@/lib/b2b/webhook';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export function OPTIONS(req: Request) {
  return recordingPreflight(req);
}

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const auth = authorizeJobRequest(req, id, 'b2b:jobs:write');
  if (auth.error) return auth.error;
  const deniedOrigin = originError(req, auth.access.allowedOrigins);
  if (deniedOrigin) return deniedOrigin;

  let job = await getJob(auth.access.orgId, id);
  if (!job) return withCors(apiError('not_found', 'B2B job not found.', 404), req, auth.access.allowedOrigins);
  if (job.status === 'completed') {
    return withCors(json(toPublicJob(job, false)), req, auth.access.allowedOrigins);
  }
  if (job.status === 'processing') {
    return withCors(apiError('already_processing', 'This job is already being processed.', 409), req, auth.access.allowedOrigins);
  }

  let body: unknown = {};
  try {
    const text = await req.text();
    body = text ? JSON.parse(text) : {};
  } catch {
    body = {};
  }
  const parsed = CompleteB2bJobRequest.safeParse(body);
  if (!parsed.success) {
    return withCors(apiError('invalid_request', parsed.error.issues.map((issue) => issue.message).join('; '), 400), req, auth.access.allowedOrigins);
  }

  if (parsed.data.transcript) {
    const sequence = job.segments.reduce((max, segment) => Math.max(max, segment.sequence), -1) + 1;
    const partnerSegment: TranscriptSegment = {
      sequence,
      text: parsed.data.transcript,
      source: 'partner',
      createdAt: new Date().toISOString(),
    };
    const appended = await appendSegment(job.orgId, job.id, partnerSegment);
    if (appended.job) job = appended.job;
  }

  const transcript = job.transcript?.trim();
  if (!transcript) {
    return withCors(
      apiError('empty_transcript', 'Upload audio chunks or send a transcript before completing the job.', 400),
      req,
      auth.access.allowedOrigins,
    );
  }

  job = (await updateJob(job.orgId, job.id, (draft) => {
    draft.status = 'processing';
    draft.error = undefined;
    return draft;
  }))!;

  try {
    const result = await extractStructuredData(job.schemaSnapshot, transcript, job.locale);
    const completedAt = new Date().toISOString();
    job = (await updateJob(job.orgId, job.id, (draft) => {
      draft.status = 'completed';
      draft.result = result;
      draft.completedAt = completedAt;
      draft.usage.transcriptCharacters = transcript.length;
      if (draft.retention === 'result_only') {
        draft.transcript = undefined;
        draft.segments = [];
      }
      return draft;
    }))!;

    const delivery = await deliverCompletionWebhook(job);
    if (delivery) {
      job = (await updateJob(job.orgId, job.id, (draft) => {
        draft.webhookDelivery = delivery;
        return draft;
      }))!;
    }
    return withCors(json(toPublicJob(job, false)), req, auth.access.allowedOrigins);
  } catch (error) {
    const unavailable = error instanceof ExtractionUnavailableError;
    const code = unavailable ? 'extraction_model_unavailable' : 'extraction_failed';
    const message = unavailable
      ? error.message
      : 'The transcript could not be converted into the requested schema.';
    job = (await updateJob(job.orgId, job.id, (draft) => {
      draft.status = 'failed';
      draft.error = { code, message };
      return draft;
    }))!;
    return withCors(apiError(code, message, unavailable ? 503 : 502), req, auth.access.allowedOrigins);
  }
}
