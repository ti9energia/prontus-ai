import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SESSION_COOKIE, readCookie, verifySession } from '@/lib/auth/session';
import { pushAudit } from '@/lib/data/store';
import { getTool, type ToolSurface } from '@/lib/mari/tools';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LOCALES = ['pt-BR', 'en', 'zh-CN', 'fr-FR'] as const;

const BodySchema = z.object({
  tool: z.string().min(1).max(64),
  input: z.unknown().optional(),
  confirm: z.boolean().optional(),
  locale: z.string().max(12).optional(),
});

const fail = (code: string, messageKey: string, status: number) =>
  NextResponse.json({ data: null, error: { code, messageKey } }, { status });

/**
 * Mari's action endpoint — runs one tool from the registry. This is how Mari
 * *acts* (generate a guide, run the pre-denial check, submit). State-changing
 * tools require an explicit `confirm` (human-in-the-loop).
 */
export async function POST(req: NextRequest) {
  // Any authenticated session may use the clinical tools; owner-only tools
  // additionally require role owner.
  const session = await verifySession(readCookie(req.headers.get('cookie'), SESSION_COOKIE));
  if (!session) return fail('UNAUTHENTICATED', 'errors.unauthenticated', 401);

  let raw: unknown = {};
  try {
    raw = await req.json();
  } catch {
    raw = {};
  }
  const parsed = BodySchema.safeParse(raw ?? {});
  if (!parsed.success) return fail('INVALID_INPUT', 'errors.invalid_input', 400);

  const tool = getTool(parsed.data.tool);
  if (!tool) return fail('UNKNOWN_TOOL', 'errors.unknown_tool', 400);

  const granted: ToolSurface[] = session.role === 'owner' ? ['clinical', 'owner'] : ['clinical'];
  if (!tool.surfaces.some((s) => granted.includes(s))) return fail('FORBIDDEN', 'errors.forbidden', 403);

  // Human-in-the-loop: state-changing tools never run without explicit confirm.
  if (tool.requiresConfirmation && !parsed.data.confirm) {
    return NextResponse.json({
      data: { status: 'confirm_required', tool: tool.id, title: tool.title, description: tool.description },
      error: null,
    });
  }

  const inputParse = tool.input.safeParse(parsed.data.input ?? {});
  if (!inputParse.success) return fail('INVALID_INPUT', 'errors.invalid_input', 400);

  const locale = (LOCALES as readonly string[]).includes(parsed.data.locale ?? '')
    ? (parsed.data.locale as string)
    : 'pt-BR';

  const result = await tool.run(inputParse.data, { role: session.role, locale });
  pushAudit('Mari (IA)', `tool:${tool.id}`, result.ok ? 'run' : result.error?.code ?? 'error', result.ok ? 'ok' : 'blocked', 'ai');

  return NextResponse.json({ data: result, error: null }, { status: result.ok ? 200 : 422 });
}
