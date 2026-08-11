import { apiError, authenticateApiKey, json, scopeError } from '@/lib/api';
import { toPublicJob } from '@/lib/b2b/contracts';
import { deleteJob, getJob } from '@/lib/b2b/repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const auth = authenticateApiKey(req);
  if (auth.error) return auth.error;
  const forbidden = scopeError(auth.context, 'b2b:jobs:read');
  if (forbidden) return forbidden;

  const job = await getJob(auth.context.orgId, id);
  if (!job) return apiError('not_found', 'B2B job not found.', 404);
  const includeTranscript = new URL(req.url).searchParams.get('include_transcript') === 'true';
  return json(toPublicJob(job, includeTranscript));
}

/** Permanently purges transcript, extracted fields, and job metadata for LGPD workflows. */
export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const auth = authenticateApiKey(req);
  if (auth.error) return auth.error;
  const forbidden = scopeError(auth.context, 'b2b:jobs:write');
  if (forbidden) return forbidden;

  const deleted = await deleteJob(auth.context.orgId, id);
  if (!deleted) return apiError('not_found', 'B2B job not found.', 404);
  return json({ id, deleted: true });
}
