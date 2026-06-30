/**
 * Mari — assistant service layer.
 *
 * This is the seam that lets Mari run anywhere. Today she runs in-process (an
 * Anthropic call plus a deterministic, data-aware fallback). Tomorrow she can
 * live on her own server: set MARI_API_URL and every product surface calls that
 * brain over HTTP with the exact same contract — the product code never changes,
 * and the same brain can serve other systems too.
 *
 * Resolution order (first that can answer wins):
 *   1. Remote Mari brain  (MARI_API_URL)      — the decoupled, independently-trained service
 *   2. Local model        (ANTHROPIC_API_KEY) — in-process Claude
 *   3. Deterministic mock (always)            — data-aware, offline-safe fallback
 *
 * See docs/ARCHITECTURE.md for the decoupling plan and the brain's API contract.
 */

export type MariSurface = 'clinical' | 'owner';
export type MariSource = 'remote' | 'claude' | 'mock' | 'mock-fallback';

export interface MariMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface MariChatRequest {
  /** Which product surface is asking — lets a shared brain tailor behaviour. */
  surface: MariSurface;
  /** Fully-built system prompt (persona + injected context). */
  system: string;
  /** Conversation so far (already capped & sanitised by the caller). */
  messages: MariMessage[];
  locale: string;
  /** Structured context forwarded to a remote brain (screen, platform stats…). */
  context?: Record<string, unknown>;
  /** May this caller reach a paid model / the remote brain? (cost & auth gate) */
  allowModel: boolean;
  maxTokens?: number;
  /** Deterministic, data-aware reply used when no model is available. */
  fallback: () => string;
}

export interface MariChatResponse {
  reply: string;
  source: MariSource;
}

const model = () => process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';

/** Call the decoupled Mari brain over HTTP. Returns null on any failure (never throws). */
async function callRemote(req: MariChatRequest): Promise<string | null> {
  const base = process.env.MARI_API_URL;
  if (!base) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15_000);
  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/v1/chat`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(process.env.MARI_API_KEY ? { authorization: `Bearer ${process.env.MARI_API_KEY}` } : {}),
      },
      body: JSON.stringify({
        surface: req.surface,
        system: req.system,
        messages: req.messages,
        locale: req.locale,
        context: req.context ?? {},
        maxTokens: req.maxTokens ?? 600,
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { reply?: string };
    const reply = (data?.reply ?? '').trim();
    return reply || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Call the in-process Anthropic model. Returns null on any failure (never throws). */
async function callLocalModel(req: MariChatRequest): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey });
    const completion = await client.messages.create({
      model: model(),
      max_tokens: req.maxTokens ?? 600,
      system: req.system,
      messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
    });
    const reply = completion.content
      .filter((b): b is { type: 'text'; text: string } => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();
    return reply || null;
  } catch {
    return null;
  }
}

/**
 * Streaming variant: returns a ReadableStream of SSE chunks.
 * Each chunk is `data: {"delta":"...","done":false}\n\n`.
 * Final chunk: `data: {"delta":"","done":true,"source":"claude"}\n\n`.
 * Falls back to a single-shot "chunk" when streaming is unavailable.
 */
export function mariChatStream(req: MariChatRequest): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const sse = (payload: object) => encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const enqueue = (payload: object) => controller.enqueue(sse(payload));
      const finish = (full: string, source: MariSource) => {
        enqueue({ delta: '', done: true, source, full });
        controller.close();
      };

      if (req.allowModel) {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (apiKey) {
          try {
            const { default: Anthropic } = await import('@anthropic-ai/sdk');
            const client = new Anthropic({ apiKey });
            const stream = await client.messages.stream({
              model: model(),
              max_tokens: req.maxTokens ?? 600,
              system: req.system,
              messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
            });
            let full = '';
            for await (const chunk of stream) {
              if (
                chunk.type === 'content_block_delta' &&
                chunk.delta.type === 'text_delta'
              ) {
                const delta = chunk.delta.text;
                full += delta;
                enqueue({ delta, done: false });
              }
            }
            finish(full, 'claude');
            return;
          } catch {
            // fall through to mock
          }
        }
      }

      // Mock: emit the whole reply as one chunk then close.
      const reply = req.fallback();
      enqueue({ delta: reply, done: false });
      finish(reply, 'mock');
    },
  });
}

/**
 * The single entry point every Mari surface calls. Where the intelligence
 * actually runs (remote brain, local model, or mock) is an env/ops decision —
 * not a code change.
 */
export async function mariChat(req: MariChatRequest): Promise<MariChatResponse> {
  if (req.allowModel) {
    const remote = await callRemote(req);
    if (remote) return { reply: remote, source: 'remote' };

    if (process.env.ANTHROPIC_API_KEY) {
      const local = await callLocalModel(req);
      return local
        ? { reply: local, source: 'claude' }
        : { reply: req.fallback(), source: 'mock-fallback' };
    }
  }
  return { reply: req.fallback(), source: 'mock' };
}
