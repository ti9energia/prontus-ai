import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHmac } from 'node:crypto';
import {
  isWhatsappReal,
  sendMessage,
  parseWebhookPayload,
  verifyWebhookSignature,
  verifyWebhookChallenge,
} from '../connectors/whatsapp';

describe('isWhatsappReal', () => {
  beforeEach(() => {
    delete process.env.WHATSAPP_TOKEN;
    delete process.env.WHATSAPP_PHONE_ID;
  });

  it('returns false when no env vars set', () => {
    expect(isWhatsappReal()).toBe(false);
  });

  it('returns false when only token is set', () => {
    process.env.WHATSAPP_TOKEN = 'tok';
    expect(isWhatsappReal()).toBe(false);
  });

  it('returns false when only phone id is set', () => {
    process.env.WHATSAPP_PHONE_ID = '123456';
    expect(isWhatsappReal()).toBe(false);
  });

  it('returns true when both token and phone id are set', () => {
    process.env.WHATSAPP_TOKEN = 'tok';
    process.env.WHATSAPP_PHONE_ID = '123456';
    expect(isWhatsappReal()).toBe(true);
  });
});

describe('sendMessage (stub mode)', () => {
  beforeEach(() => {
    delete process.env.WHATSAPP_TOKEN;
    delete process.env.WHATSAPP_PHONE_ID;
  });

  it('returns stub source without making network calls', async () => {
    const result = await sendMessage({ to: '+5511999990000', body: 'Hello' });
    expect(result.ok).toBe(true);
    expect(result.source).toBe('stub');
    expect(result.messageId).toMatch(/^stub_/);
  });
});

describe('sendMessage (real mode — fetch stub)', () => {
  afterEach(() => {
    delete process.env.WHATSAPP_TOKEN;
    delete process.env.WHATSAPP_PHONE_ID;
    vi.restoreAllMocks();
  });

  it('calls WhatsApp Graph API with correct payload', async () => {
    process.env.WHATSAPP_TOKEN = 'my_token';
    process.env.WHATSAPP_PHONE_ID = 'phone_123';
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ messages: [{ id: 'wamid.abc123' }] }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await sendMessage({ to: '+5511999990000', body: 'Test message' });
    expect(result.ok).toBe(true);
    expect(result.source).toBe('cloud');
    expect(result.messageId).toBe('wamid.abc123');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('phone_123/messages'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer my_token' }),
      }),
    );
  });

  it('throws on non-ok API response', async () => {
    process.env.WHATSAPP_TOKEN = 'tok';
    process.env.WHATSAPP_PHONE_ID = 'pid';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401, text: async () => 'Unauthorized' }));

    await expect(sendMessage({ to: '+5511999990000', body: 'msg' })).rejects.toThrow('WhatsApp API error 401');
  });
});

describe('parseWebhookPayload', () => {
  it('extracts inbound text messages', () => {
    const payload = {
      entry: [{
        changes: [{
          value: {
            messages: [{
              from: '5511999990000',
              id: 'wamid.abc',
              timestamp: '1704067200',
              type: 'text',
              text: { body: 'Olá Mari!' },
            }],
          },
        }],
      }],
    };

    const msgs = parseWebhookPayload(payload);
    expect(msgs).toHaveLength(1);
    expect(msgs[0].from).toBe('5511999990000');
    expect(msgs[0].body).toBe('Olá Mari!');
    expect(msgs[0].messageId).toBe('wamid.abc');
  });

  it('ignores non-text messages', () => {
    const payload = {
      entry: [{
        changes: [{
          value: {
            messages: [{ from: 'x', id: 'y', type: 'image', timestamp: '1' }],
          },
        }],
      }],
    };
    expect(parseWebhookPayload(payload)).toHaveLength(0);
  });

  it('returns empty array for malformed payload', () => {
    expect(parseWebhookPayload(null)).toHaveLength(0);
    expect(parseWebhookPayload({ unexpected: 'shape' })).toHaveLength(0);
  });
});

describe('verifyWebhookSignature', () => {
  afterEach(() => {
    delete process.env.WHATSAPP_WEBHOOK_SECRET;
  });

  it('returns true when no secret is configured', () => {
    delete process.env.WHATSAPP_WEBHOOK_SECRET;
    expect(verifyWebhookSignature(Buffer.from('body'), 'any_sig')).toBe(true);
  });

  it('returns false when signature header is missing and secret is set', () => {
    process.env.WHATSAPP_WEBHOOK_SECRET = 'mysecret';
    expect(verifyWebhookSignature(Buffer.from('body'), null)).toBe(false);
  });

  it('accepts a valid HMAC-SHA256 signature', () => {
    process.env.WHATSAPP_WEBHOOK_SECRET = 'testsecret';
    const body = Buffer.from('{"test":true}');
    const sig = `sha256=${createHmac('sha256', 'testsecret').update(body).digest('hex')}`;
    expect(verifyWebhookSignature(body, sig)).toBe(true);
  });
});

describe('verifyWebhookChallenge', () => {
  afterEach(() => {
    delete process.env.WHATSAPP_WEBHOOK_SECRET;
  });

  it('returns challenge when token matches default', () => {
    delete process.env.WHATSAPP_WEBHOOK_SECRET;
    const result = verifyWebhookChallenge('subscribe', 'auronis_whatsapp_verify', 'challenge_abc');
    expect(result).toBe('challenge_abc');
  });

  it('returns null when mode is wrong', () => {
    expect(verifyWebhookChallenge('unsubscribe', 'auronis_whatsapp_verify', 'abc')).toBeNull();
  });

  it('returns null when token is wrong', () => {
    expect(verifyWebhookChallenge('subscribe', 'wrong_token', 'abc')).toBeNull();
  });

  it('uses WHATSAPP_WEBHOOK_SECRET as the verify token', () => {
    process.env.WHATSAPP_WEBHOOK_SECRET = 'custom_secret';
    expect(verifyWebhookChallenge('subscribe', 'custom_secret', 'ch1')).toBe('ch1');
    expect(verifyWebhookChallenge('subscribe', 'auronis_whatsapp_verify', 'ch1')).toBeNull();
  });
});
