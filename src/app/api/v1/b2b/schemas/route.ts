import { apiError, authenticateApiKey, json, scopeError } from '@/lib/api';
import {
  CreateExtractionSchemaRequest,
  toPublicSchema,
} from '@/lib/b2b/contracts';
import {
  createExtractionSchema,
  listExtractionSchemas,
} from '@/lib/b2b/repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = authenticateApiKey(req);
  if (auth.error) return auth.error;
  const forbidden = scopeError(auth.context, 'b2b:schemas:read');
  if (forbidden) return forbidden;

  const schemas = await listExtractionSchemas(auth.context.orgId);
  return json(schemas.map(toPublicSchema));
}

export async function POST(req: Request) {
  const auth = authenticateApiKey(req);
  if (auth.error) return auth.error;
  const forbidden = scopeError(auth.context, 'b2b:schemas:write');
  if (forbidden) return forbidden;

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const parsed = CreateExtractionSchemaRequest.safeParse(body);
  if (!parsed.success) {
    return apiError('invalid_schema', parsed.error.issues.map((issue) => issue.message).join('; '), 400);
  }

  const schema = await createExtractionSchema(auth.context.orgId, parsed.data);
  return json(toPublicSchema(schema), { status: 201 });
}
