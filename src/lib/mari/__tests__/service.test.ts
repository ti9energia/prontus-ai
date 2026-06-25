import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mariChat, type MariChatRequest } from '@/lib/mari/service';

// Isolate the env keys mariChat reads so each test starts from a clean slate.
const KEYS = ['MARI_API_URL', 'MARI_API_KEY', 'ANTHROPIC_API_KEY', 'ANTHROPIC_MODEL'] as const;
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of KEYS) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
});
afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function req(over: Partial<MariChatRequest> = {}): MariChatRequest {
  return {
    surface: 'clinical',
    system: 'sys',
    messages: [{ role: 'user', content: 'oi' }],
    locale: 'pt-BR',
    allowModel: true,
    fallback: () => 'FALLBACK',
    ...over,
  };
}

const remoteOk = (reply: string) =>
  vi.fn(async () => ({ ok: true, json: async () => ({ reply }) }) as unknown as Response);

describe('mariChat — brain resolution order', () => {
  it('returns the mock when the caller is not allowed a model', async () => {
    const r = await mariChat(req({ allowModel: false }));
    expect(r).toEqual({ reply: 'FALLBACK', source: 'mock' });
  });

  it('returns the mock when allowed but no brain is configured', async () => {
    const r = await mariChat(req());
    expect(r).toEqual({ reply: 'FALLBACK', source: 'mock' });
  });

  it('prefers the remote brain when MARI_API_URL is set, hitting /v1/chat', async () => {
    process.env.MARI_API_URL = 'https://brain.test';
    const fetchMock = remoteOk('FROM REMOTE');
    vi.stubGlobal('fetch', fetchMock);

    const r = await mariChat(req());

    expect(r).toEqual({ reply: 'FROM REMOTE', source: 'remote' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toBe('https://brain.test/v1/chat');
  });

  it('forwards an Authorization header when MARI_API_KEY is set', async () => {
    process.env.MARI_API_URL = 'https://brain.test';
    process.env.MARI_API_KEY = 'secret-token';
    const fetchMock = remoteOk('OK');
    vi.stubGlobal('fetch', fetchMock);

    await mariChat(req());

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer secret-token');
  });

  it('falls back to the mock when the remote brain throws', async () => {
    process.env.MARI_API_URL = 'https://brain.test';
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network');
      }),
    );
    const r = await mariChat(req());
    expect(r).toEqual({ reply: 'FALLBACK', source: 'mock' });
  });

  it('falls back to the mock when the remote brain returns non-OK', async () => {
    process.env.MARI_API_URL = 'https://brain.test';
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, json: async () => ({}) }) as unknown as Response));
    const r = await mariChat(req());
    expect(r.source).toBe('mock');
  });

  it('falls back to the mock when the remote brain replies empty', async () => {
    process.env.MARI_API_URL = 'https://brain.test';
    vi.stubGlobal('fetch', remoteOk('   '));
    const r = await mariChat(req());
    expect(r).toEqual({ reply: 'FALLBACK', source: 'mock' });
  });

  it('never touches the remote brain when the caller is not allowed', async () => {
    process.env.MARI_API_URL = 'https://brain.test';
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const r = await mariChat(req({ allowModel: false }));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(r.source).toBe('mock');
  });
});
