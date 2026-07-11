import { apiError, authError, json } from '@/lib/api';
import { getGuide } from '@/lib/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/v1/guides/:id — a single TISS guide, or 404. */
export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const unauthorized = authError(req);
  if (unauthorized) return unauthorized;

  const guide = getGuide(params.id);
  if (!guide) return apiError('not_found', `No guide with id '${params.id}'.`, 404);
  return json(guide);
}
