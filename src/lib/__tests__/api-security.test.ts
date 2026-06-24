import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/ai/chat/route';

function req(body: unknown) {
  return new Request('http://localhost/api/ai/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  }) as unknown as Parameters<typeof POST>[0];
}

describe('AI chat route — input hardening (security)', () => {
  it('answers a valid message in mock mode', async () => {
    const res = await POST(req({ messages: [{ role: 'user', content: 'qual minha taxa de glosa?' }], locale: 'pt-BR' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(typeof json.reply).toBe('string');
    expect(json.reply.length).toBeGreaterThan(0);
  });

  it('rejects a malformed payload (messages not an array) with 400', async () => {
    const res = await POST(req({ messages: 'not-an-array' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error?.code).toBe('INVALID_INPUT');
  });

  it('rejects oversized message content (>6000 chars)', async () => {
    const res = await POST(req({ messages: [{ role: 'user', content: 'a'.repeat(7000) }] }));
    expect(res.status).toBe(400);
  });

  it('rejects too many messages (>50)', async () => {
    const many = Array.from({ length: 60 }, () => ({ role: 'user', content: 'x' }));
    const res = await POST(req({ messages: many }));
    expect(res.status).toBe(400);
  });

  it('rejects an oversized locale string', async () => {
    const res = await POST(req({ messages: [{ role: 'user', content: 'hi' }], locale: 'x'.repeat(40) }));
    expect(res.status).toBe(400);
  });

  it('defaults an unknown short locale safely (still answers)', async () => {
    const res = await POST(req({ messages: [{ role: 'user', content: 'hi' }], locale: 'xx' }));
    expect(res.status).toBe(200);
  });

  it('survives invalid JSON without throwing', async () => {
    const res = await POST(req('{ not valid json'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(typeof json.reply).toBe('string');
  });
});
