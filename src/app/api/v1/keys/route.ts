import { createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';
import { apiError, authError, json } from '@/lib/api/auth';
import { addApiKey, currentOrgId, listApiKeys, revokeApiKey } from '@/lib/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CreateKeySchema = z.object({
  name: z.string().trim().min(1).max(120),
});

const RevokeKeySchema = z.object({
  id: z.string().trim().min(1),
});

/** GET /api/v1/keys — list API keys for the caller's org (hashes omitted). */
export function GET(req: Request) {
  const unauthorized = authError(req);
  if (unauthorized) return unauthorized;
  const orgId = currentOrgId();
  const keys = listApiKeys(orgId).map(({ hash: _h, ...rest }) => rest);
  return json(keys);
}

/**
 * POST /api/v1/keys — generate a new API key.
 * Returns the raw key ONCE; only the hash is stored.
 */
export async function POST(req: Request) {
  const unauthorized = authError(req);
  if (unauthorized) return unauthorized;

  let raw: unknown = {};
  try {
    raw = await req.json();
  } catch {
    raw = {};
  }

  const parsed = CreateKeySchema.safeParse(raw ?? {});
  if (!parsed.success) {
    return apiError('invalid_request', 'Body must include a non-empty string field `name`.', 400);
  }

  const rawKey = `sk_live_${randomBytes(24).toString('hex')}`;
  const prefix = rawKey.slice(0, 8);
  const hash = createHash('sha256').update(rawKey).digest('hex');

  const orgId = currentOrgId();
  const record = addApiKey(orgId, parsed.data.name, hash, prefix);

  return json({ key: rawKey, record: { ...record, hash: undefined } }, { status: 201 });
}

/** DELETE /api/v1/keys — revoke a key by `{ id }`. */
export async function DELETE(req: Request) {
  const unauthorized = authError(req);
  if (unauthorized) return unauthorized;

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

  const revoked = revokeApiKey(parsed.data.id);
  if (!revoked) {
    return apiError('not_found', `API key ${parsed.data.id} not found.`, 404);
  }

  const { hash: _h, ...rest } = revoked;
  return json(rest);
}
