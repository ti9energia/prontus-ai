import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio, isAsrReal } from '@/lib/asr';
import { SESSION_COOKIE, readCookie, verifySession } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/** GET /api/ai/transcribe — capability probe (no auth required). */
export function GET() {
  return NextResponse.json({ real: isAsrReal() });
}

/**
 * POST /api/ai/transcribe
 * Accepts multipart/form-data with:
 *   - audio: Blob (audio/webm or audio/wav from MediaRecorder)
 *   - locale: string (BCP-47, e.g. "pt-BR")
 * Returns: { text: string, source: 'whisper' | 'azure' | 'stub' }
 */
export async function POST(req: NextRequest) {
  // Require a valid session — this route touches real audio data.
  const session = await verifySession(readCookie(req.headers.get('cookie'), SESSION_COOKIE));
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
  }

  const audioEntry = form.get('audio');
  const locale = String(form.get('locale') ?? 'pt-BR').slice(0, 12);

  if (!(audioEntry instanceof Blob)) {
    return NextResponse.json({ error: 'Missing audio field' }, { status: 400 });
  }

  const MAX_BYTES = 25 * 1024 * 1024; // 25 MB (Whisper hard limit)
  if (audioEntry.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Audio file too large (max 25 MB)' }, { status: 413 });
  }

  const result = await transcribeAudio(audioEntry, locale);
  return NextResponse.json(result);
}
