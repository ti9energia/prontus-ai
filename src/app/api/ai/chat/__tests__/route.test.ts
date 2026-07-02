import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { POST } from '@/app/api/ai/chat/route';
import { createSession, SESSION_COOKIE } from '@/lib/auth';
import { registerTenant, resetStore, updateTenantAi } from '@/lib/data';

// Mari's persona/model come from the TENANT's own AI config (owner/sections.tsx
// AiSection → updateTenantAi) — this proves that config actually reaches the
// live chat instead of being admin-UI-only decoration.
const SECRET = 'test-secret-for-ai-chat-persona-abcdef';
let prevSecret: string | undefined;
beforeAll(() => {
  prevSecret = process.env.AUTH_SECRET;
  process.env.AUTH_SECRET = SECRET;
});
afterAll(() => {
  if (prevSecret === undefined) delete process.env.AUTH_SECRET;
  else process.env.AUTH_SECRET = prevSecret;
});
beforeEach(() => resetStore());

function call(body: unknown, token?: string) {
  return POST(
    new Request('http://localhost/api/ai/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(token ? { cookie: `${SESSION_COOKIE}=${token}` } : {}) },
      body: JSON.stringify(body),
    }) as unknown as Parameters<typeof POST>[0],
  );
}

describe('POST /api/ai/chat — per-tenant persona parametrization', () => {
  it('an anonymous caller gets the default "Mari" persona in the mock fallback', async () => {
    const res = await call({ messages: [{ role: 'user', content: 'oi, quem é você?' }], locale: 'pt-BR' });
    const json = await res.json();
    expect(json.reply).toContain('Sou a Mari');
  });

  it("a signed-in user whose tenant renamed the assistant gets THAT persona's name, not the default", async () => {
    const { tenant, user } = registerTenant({ orgName: 'Clínica Sofia', name: 'Dr. Yuri', email: 'yuri@sofia.com', passwordHash: 'h' });
    updateTenantAi(tenant.id, { persona: 'Sofia' });
    const token = await createSession({ email: user.email, role: 'doctor', name: user.name });

    const res = await call({ messages: [{ role: 'user', content: 'oi, quem é você?' }], locale: 'pt-BR' }, token);
    const json = await res.json();
    expect(json.reply).toContain('Sou a Sofia');
    expect(json.reply).not.toContain('Sou a Mari');
  });

  it('two different tenants get two different personas in the same test run (no shared/global state)', async () => {
    const a = registerTenant({ orgName: 'A', name: 'Dr. A', email: 'a@a.com', passwordHash: 'h' });
    const b = registerTenant({ orgName: 'B', name: 'Dr. B', email: 'b@b.com', passwordHash: 'h' });
    updateTenantAi(a.tenant.id, { persona: 'Ana' });
    updateTenantAi(b.tenant.id, { persona: 'Beto' });
    const tokenA = await createSession({ email: a.user.email, role: 'doctor', name: a.user.name });
    const tokenB = await createSession({ email: b.user.email, role: 'doctor', name: b.user.name });

    const replyA = (await (await call({ messages: [{ role: 'user', content: 'e aí?' }], locale: 'pt-BR' }, tokenA)).json()).reply;
    const replyB = (await (await call({ messages: [{ role: 'user', content: 'e aí?' }], locale: 'pt-BR' }, tokenB)).json()).reply;
    expect(replyA).toContain('Ana');
    expect(replyB).toContain('Beto');
  });

  it('a tenant with no AI config yet still falls back to the default persona (no crash on missing config)', async () => {
    const { user } = registerTenant({ orgName: 'Sem config', name: 'Dr. Zeca', email: 'zeca@x.com', passwordHash: 'h' });
    const token = await createSession({ email: user.email, role: 'doctor', name: user.name });
    const res = await call({ messages: [{ role: 'user', content: 'oi' }], locale: 'pt-BR' }, token);
    expect(res.status).toBe(200);
    expect((await res.json()).reply).toContain('Mari');
  });
});
