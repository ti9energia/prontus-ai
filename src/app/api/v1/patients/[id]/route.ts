import { apiError, authError, json } from '@/lib/api';
import { getPatient } from '@/lib/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/v1/patients/:id — a single patient, or 404. */
export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const unauthorized = authError(req);
  if (unauthorized) return unauthorized;

  const patient = getPatient(params.id);
  if (!patient) return apiError('not_found', `No patient with id '${params.id}'.`, 404);
  return json(patient);
}
