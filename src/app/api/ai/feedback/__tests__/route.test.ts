import { describe, it, expect, beforeEach } from 'vitest';
import { POST } from '@/app/api/ai/feedback/route';
import { listAudit, resetStore } from '@/lib/data';

function req(body: unknown) {
  return new Request('http://localhost/api/ai/feedback', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  }) as unknown as Parameters<typeof POST>[0];
}

// Each case checks the audit trail, so start from a clean seed every time.
beforeEach(() => resetStore());

describe('AI copilot feedback route', () => {
  it('accepts a thumbs-up and returns { data: { ok: true } }', async () => {
    const res = await POST(req({ intent: 'up' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual({ ok: true });
    expect(json.error).toBeNull();
  });

  it('accepts a thumbs-down', async () => {
    const res = await POST(req({ intent: 'down' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.ok).toBe(true);
  });

  it('rejects an invalid intent with 400 INVALID_INPUT', async () => {
    const res = await POST(req({ intent: 'sideways' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error?.code).toBe('INVALID_INPUT');
    expect(json.data).toBeNull();
  });

  it('rejects a missing intent with 400 INVALID_INPUT', async () => {
    const res = await POST(req({}));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error?.code).toBe('INVALID_INPUT');
  });

  it('treats invalid JSON as an empty body → 400', async () => {
    const res = await POST(req('{ not valid json'));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error?.code).toBe('INVALID_INPUT');
  });

  it('appends a copilot.feedback audit entry on a thumbs-up', async () => {
    const before = listAudit().length;
    await POST(req({ intent: 'up', screen: 'today' }));

    const audit = listAudit();
    expect(audit.length).toBe(before + 1);
    const newest = audit[0];
    expect(newest.action).toContain('copilot.feedback');
    expect(newest.action).toBe('copilot.feedback.up');
    expect(newest.target).toBe('screen:today');
    expect(newest.actor).toBe('Mari (IA)');
    expect(newest.source).toBe('ai');
    expect(newest.result).toBe('ok');
  });

  it('records the direction in the audit action for a thumbs-down', async () => {
    await POST(req({ intent: 'down', screen: 'tiss' }));
    expect(listAudit()[0].action).toBe('copilot.feedback.down');
  });

  it('defaults the screen target to "-" when none is supplied', async () => {
    await POST(req({ intent: 'up' }));
    expect(listAudit()[0].target).toBe('screen:-');
  });

  it('sanitizes unsafe characters out of the screen target', async () => {
    await POST(req({ intent: 'up', screen: 'a b@c' }));
    // only [\w:-] survive the sanitizer → "a b@c" becomes "abc"
    expect(listAudit()[0].target).toBe('screen:abc');
  });

  it('does not append an audit entry for an invalid body', async () => {
    const before = listAudit().length;
    await POST(req({ intent: 'sideways' }));
    expect(listAudit().length).toBe(before);
  });
});
