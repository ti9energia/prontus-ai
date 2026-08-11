import { apiError, json } from '@/lib/api';
import { transcribeAudio } from '@/lib/asr';
import { toPublicJob, type TranscriptSegment } from '@/lib/b2b/contracts';
import { authorizeJobRequest, originError, recordingPreflight, withCors } from '@/lib/b2b/request';
import { appendSegment, getJob } from '@/lib/b2b/repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_CHUNK_BYTES = 25 * 1024 * 1024;
const MAX_JOB_AUDIO_BYTES = 500 * 1024 * 1024;
const MAX_JOB_DURATION_MS = 6 * 60 * 60 * 1_000;

export function OPTIONS(req: Request) {
  return recordingPreflight(req);
}

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const auth = authorizeJobRequest(req, id, 'b2b:jobs:write');
  if (auth.error) return auth.error;
  const deniedOrigin = originError(req, auth.access.allowedOrigins);
  if (deniedOrigin) return deniedOrigin;

  const job = await getJob(auth.access.orgId, id);
  if (!job) return withCors(apiError('not_found', 'B2B job not found.', 404), req, auth.access.allowedOrigins);
  if (job.status !== 'collecting') {
    return withCors(
      apiError('invalid_job_state', `Audio can only be uploaded while status is collecting; current status is ${job.status}.`, 409),
      req,
      auth.access.allowedOrigins,
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return withCors(apiError('invalid_request', 'Expected multipart/form-data.', 400), req, auth.access.allowedOrigins);
  }

  const audio = form.get('audio');
  const sequence = Number(form.get('sequence'));
  const durationRaw = form.get('duration_ms');
  const durationMs = durationRaw === null ? undefined : Number(durationRaw);
  if (!(audio instanceof Blob) || audio.size === 0) {
    return withCors(apiError('missing_audio', 'A non-empty `audio` file is required.', 400), req, auth.access.allowedOrigins);
  }
  if (audio.size > MAX_CHUNK_BYTES) {
    return withCors(apiError('audio_too_large', 'Each audio chunk must be at most 25 MB.', 413), req, auth.access.allowedOrigins);
  }
  if (!Number.isInteger(sequence) || sequence < 0 || sequence > 10_000) {
    return withCors(apiError('invalid_sequence', '`sequence` must be an integer from 0 to 10000.', 400), req, auth.access.allowedOrigins);
  }
  if (durationMs !== undefined && (!Number.isFinite(durationMs) || durationMs < 0 || durationMs > 30 * 60 * 1_000)) {
    return withCors(apiError('invalid_duration', '`duration_ms` is invalid.', 400), req, auth.access.allowedOrigins);
  }
  if (job.usage.audioBytes + audio.size > MAX_JOB_AUDIO_BYTES) {
    return withCors(apiError('job_audio_limit', 'Total audio for one job cannot exceed 500 MB.', 413), req, auth.access.allowedOrigins);
  }
  if (job.usage.audioDurationMs + (durationMs ?? 0) > MAX_JOB_DURATION_MS) {
    return withCors(apiError('job_duration_limit', 'Total audio duration cannot exceed 6 hours.', 413), req, auth.access.allowedOrigins);
  }

  const existing = job.segments.find((segment) => segment.sequence === sequence);
  if (existing) {
    return withCors(json({ duplicate: true, segment: existing, job: toPublicJob(job, false) }), req, auth.access.allowedOrigins);
  }

  const transcription = await transcribeAudio(audio, job.locale);
  if (transcription.source === 'stub') {
    return withCors(
      apiError('asr_unavailable', 'A real ASR provider is not configured or failed to transcribe this chunk.', 503),
      req,
      auth.access.allowedOrigins,
    );
  }
  if (!transcription.text.trim()) {
    return withCors(apiError('no_speech', 'No speech was recognized in this audio chunk.', 422), req, auth.access.allowedOrigins);
  }

  const segment: TranscriptSegment = {
    sequence,
    text: transcription.text,
    source: transcription.source,
    durationMs,
    audioBytes: audio.size,
    createdAt: new Date().toISOString(),
  };
  const appended = await appendSegment(job.orgId, job.id, segment);
  if (!appended.job) return withCors(apiError('not_found', 'B2B job not found.', 404), req, auth.access.allowedOrigins);

  return withCors(
    json({ duplicate: appended.duplicate, segment, job: toPublicJob(appended.job, false) }),
    req,
    auth.access.allowedOrigins,
  );
}
