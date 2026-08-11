import { createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';
import { apiError, authenticateApiKey, json, scopeError } from '@/lib/api';
import { addApiKey, listApiKeys, revokeApiKey } from '@/lib/data';
import type { ApiScope } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ScopeSchema = z.enum([
  '*',
  'keys:manage',
  'b2b:schemas:read',
  'b2b:schemas:write',
  'b2b:jobs:read',
  'b2b:jobs:write',
]);

const CreateKeySchema = z.object({
  name: z.string().trim().min(1).max(120),
  scopes: z.array(ScopeSchema).min(1).max(10).optional(),
  allowedOrigins: z.array(z.string().url().max(300)).max(20).optional(),
});

const RevokeKeySchema = z.object({
  id: z.string().trim().min(1),
});

const DEFAULT_PARTNER_SCOPES: ApiScope[] = [
  'b2b:schemas:read',
  'b2b:schemas:write',
  'b2b:jobs:read',
  'b2b:jobs:write',
];

/** GET /api/v1/keys — list keys for the authenticated tenant. */
export function GET(req: Request) {
  const auth = authenticateApiKey(req);
  if (auth.error) return auth.error;
  const forbidden = scopeError(auth.context, 'keys:manage');
  if (forbidden) return forbidden;

  const keys = listApiKeys(auth.context.orgId).map(({ hash: _hash, ...record }) => record);
  return json(keys);
}

/** POST /api/v1/keys — create a scoped partner key; the raw key is returned once. */
export async function POST(req: Request) {
  const auth = authenticateApiKey(req);
  if (auth.error) return auth.error;
  const forbidden = scopeError(auth.context, 'keys:manage');
  if (forbidden) return forbidden;

  let raw: unknown = {};
  try {
    raw = await req.json();
  } catch {
    raw = {};
  }

  const parsed = CreateKeySchema.safeParse(raw ?? {});
  if (!parsed.success) {
    return apiError('invalid_request', 'Invalid key name, scopes, or allowed origins.', 400);
  }

  const rawKey = `sk_live_${randomBytes(24).toString('hex')}`;
  const prefix = rawKey.slice(0, 12);
  const hash = createHash('sha256').update(rawKey).digest('hex');
  const record = addApiKey(auth.context.orgId, parsed.data.name, hash, prefix, {
    scopes: parsed.data.scopes ?? DEFAULT_PARTNER_SCOPES,
    allowedOrigins: parsed.data.allowedOrigins ?? [],
  });

  const { hash: _hash, ...safeRecord } = record;
  return json({ key: rawKey, record: safeRecord }, { status: 201 });
}

/** DELETE /api/v1/keys — revoke a key belonging to the authenticated tenant. */
export async function DELETE(req: Request) {
  const auth = authenticateApiKey(req);
  if (auth.error) return auth.error;
  const forbidden = scopeError(auth.context, 'keys:manage');
  if (forbidden) return forbidden;

  let raw: unknown = {};
  try {
    raw = await req.json();
  } catch {
    raw = {};
  }

  const parsed = RevokeKeySchema.safeParse(raw ?? {});
  if (!parsed.success) {
    return apiError('invalid_request', 'Body must include a non-empty string field `id`.', 400);
  }

  const belongsToCaller = listApiKeys(auth.context.orgId).some((key) => key.id === parsed.data.id);
  const revoked = belongsToCaller ? revokeApiKey(parsed.data.id) : undefined;
  if (!revoked) return apiError('not_found', `API key ${parsed.data.id} not found.`, 404);

  const { hash: _hash, ...safeRecord } = revoked;
  return json(safeRecord);
}
