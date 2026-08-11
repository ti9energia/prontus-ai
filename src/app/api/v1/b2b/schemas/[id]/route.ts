import { apiError, authenticateApiKey, json, scopeError } from '@/lib/api';
import { toPublicSchema } from '@/lib/b2b/contracts';
import { archiveExtractionSchema, getExtractionSchema } from '@/lib/b2b/repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const auth = authenticateApiKey(req);
  if (auth.error) return auth.error;
  const forbidden = scopeError(auth.context, 'b2b:schemas:read');
  if (forbidden) return forbidden;

  const schema = await getExtractionSchema(auth.context.orgId, id);
  if (!schema || !schema.active) return apiError('not_found', 'Extraction schema not found.', 404);
  return json(toPublicSchema(schema));
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const auth = authenticateApiKey(req);
  if (auth.error) return auth.error;
  const forbidden = scopeError(auth.context, 'b2b:schemas:write');
  if (forbidden) return forbidden;

  const archived = await archiveExtractionSchema(auth.context.orgId, id);
  if (!archived) return apiError('not_found', 'Extraction schema not found.', 404);
  return json({ id, archived: true });
}
