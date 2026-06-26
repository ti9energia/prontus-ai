import { z } from 'zod';
import { apiError, authError, json } from '@/lib/api/auth';
import { addPatient, listPatients } from '@/lib/data/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CreatePatient = z.object({
  name: z.string().trim().min(1).max(200),
  payer: z.string().trim().min(1).max(120),
});

/** GET /api/v1/patients — list every patient. */
export function GET(req: Request) {
  const unauthorized = authError(req);
  if (unauthorized) return unauthorized;
  return json(listPatients());
}

/** POST /api/v1/patients — create a patient from `{ name, payer }`. */
export async function POST(req: Request) {
  const unauthorized = authError(req);
  if (unauthorized) return unauthorized;

  let raw: unknown = {};
  try {
    raw = await req.json();
  } catch {
    raw = {};
  }

  const parsed = CreatePatient.safeParse(raw ?? {});
  if (!parsed.success) {
    return apiError('invalid_request', 'Body must include non-empty string fields `name` and `payer`.', 400);
  }

  const patient = addPatient(parsed.data);
  return json(patient, { status: 201 });
}
