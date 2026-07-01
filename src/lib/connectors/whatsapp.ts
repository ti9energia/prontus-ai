/**
 * WhatsApp Cloud API seam (Meta Business Platform).
 *
 * Activates when WHATSAPP_TOKEN + WHATSAPP_PHONE_ID are set.
 * Absent → deterministic stub that logs intent without hitting Meta servers.
 *
 * Webhook signature verification (HMAC-SHA256) always runs when
 * WHATSAPP_WEBHOOK_SECRET is set, even in mock mode — so the endpoint is safe.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import { config } from '@/lib/config';

export interface WhatsappMessage {
  to: string;
  body: string;
  type?: 'text';
}

export interface WhatsappSendResult {
  ok: boolean;
  messageId?: string;
  source: 'cloud' | 'stub';
}

/** Incoming message from the Meta webhook payload. */
export interface WhatsappInboundMessage {
  from: string;
  body: string;
  messageId: string;
  timestamp: number;
}

export function isWhatsappReal(): boolean {
  return !!(config.whatsapp.token && config.whatsapp.phoneId);
}

export async function sendMessage(msg: WhatsappMessage): Promise<WhatsappSendResult> {
  if (isWhatsappReal()) {
    const token = config.whatsapp.token!;
    const phoneId = config.whatsapp.phoneId!;
    const baseUrl = config.whatsapp.apiUrl;

    const res = await fetch(`${baseUrl}/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: msg.to.replace(/\s+/g, ''),
        type: msg.type ?? 'text',
        text: { body: msg.body },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`WhatsApp API error ${res.status}: ${err}`);
    }

    const data = (await res.json()) as { messages?: Array<{ id: string }> };
    return { ok: true, messageId: data.messages?.[0]?.id, source: 'cloud' };
  }

  return { ok: true, messageId: `stub_${Date.now()}`, source: 'stub' };
}

/**
 * Parse a Meta webhook payload and extract inbound messages.
 * Returns an empty array when the payload is not a valid message webhook.
 */
export function parseWebhookPayload(raw: unknown): WhatsappInboundMessage[] {
  const out: WhatsappInboundMessage[] = [];
  try {
    const payload = raw as {
      entry?: Array<{
        changes?: Array<{
          value?: {
            messages?: Array<{
              from?: string;
              id?: string;
              timestamp?: string;
              text?: { body?: string };
              type?: string;
            }>;
          };
        }>;
      }>;
    };

    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        for (const m of change.value?.messages ?? []) {
          if (m.type === 'text' && m.from && m.text?.body && m.id) {
            out.push({
              from: m.from,
              body: m.text.body,
              messageId: m.id,
              timestamp: parseInt(m.timestamp ?? '0', 10),
            });
          }
        }
      }
    }
  } catch {
    /* malformed payload — return empty */
  }
  return out;
}

/**
 * Verify the Meta webhook signature header (X-Hub-Signature-256).
 * Returns true when the signature is valid or when no secret is configured.
 */
export function verifyWebhookSignature(rawBody: Buffer, signatureHeader: string | null): boolean {
  const secret = config.whatsapp.webhookSecret;
  if (!secret) return true; // no secret configured → trust all (dev mode)
  if (!signatureHeader) return false;

  const expected = `sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}`;
  try {
    return timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(signatureHeader, 'utf8'));
  } catch {
    return false;
  }
}

/**
 * Respond to Meta's webhook verification challenge.
 * Returns the challenge string if the verify token matches, null otherwise.
 */
export function verifyWebhookChallenge(
  mode: string,
  token: string,
  challenge: string,
): string | null {
  const expected = config.whatsapp.webhookSecret ?? 'auronis_whatsapp_verify';
  if (mode === 'subscribe' && token === expected) return challenge;
  return null;
}
