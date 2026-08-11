import { createHmac } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { config } from '@/lib/config';
import { listApiKeys } from '@/lib/data';
import type { B2bJob } from './contracts';
import { toPublicJob } from './contracts';

export interface WebhookDeliveryResult {
  status: 'delivered' | 'failed';
  attempts: number;
  lastAttemptAt: string;
  lastError?: string;
}

function privateIpv4(address: string): boolean {
  const parts = address.split('.').map(Number);
  if (parts.length !== 4) return true;
  return parts[0] === 10
    || parts[0] === 127
    || parts[0] === 0
    || (parts[0] === 169 && parts[1] === 254)
    || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
    || (parts[0] === 192 && parts[1] === 168)
    || parts[0] >= 224;
}

function privateIp(address: string): boolean {
  const kind = isIP(address);
  if (kind === 4) return privateIpv4(address);
  if (kind === 6) {
    const value = address.toLowerCase();
    return value === '::1' || value === '::' || value.startsWith('fc') || value.startsWith('fd') || value.startsWith('fe8') || value.startsWith('fe9') || value.startsWith('fea') || value.startsWith('feb');
  }
  return true;
}

async function validateWebhookUrl(raw: string): Promise<URL> {
  const url = new URL(raw);
  if (url.username || url.password) throw new Error('Webhook URL must not contain credentials.');
  if (config.runtime.isProd && url.protocol !== 'https:') {
    throw new Error('Webhook URL must use HTTPS in production.');
  }
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Unsupported webhook protocol.');
  if (url.hostname === 'localhost' || url.hostname.endsWith('.local')) {
    throw new Error('Private webhook hosts are not allowed.');
  }
  const addresses = await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some((entry) => privateIp(entry.address))) {
    throw new Error('Webhook host resolves to a private or invalid address.');
  }
  return url;
}

/**
 * Sends a signed completion event. The signing key is SHA-256(partner API key),
 * which the partner can derive while the raw API key never needs to be stored.
 */
export async function deliverCompletionWebhook(job: B2bJob): Promise<WebhookDeliveryResult | undefined> {
  if (!job.webhookUrl) return undefined;
  const lastAttemptAt = new Date().toISOString();

  try {
    const url = await validateWebhookUrl(job.webhookUrl);
    const apiKey = listApiKeys(job.orgId).find((key) => key.id === job.apiKeyId);
    if (!apiKey) throw new Error('Signing API key was not found.');

    const body = JSON.stringify({
      event: 'b2b.job.completed',
      createdAt: lastAttemptAt,
      data: toPublicJob(job, false),
    });
    const signature = createHmac('sha256', apiKey.hash).update(body).digest('hex');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'user-agent': 'Auronis-B2B-Webhook/1.0',
          'x-auronis-event': 'b2b.job.completed',
          'x-auronis-signature': `sha256=${signature}`,
          'x-auronis-delivery': job.id,
        },
        body,
        signal: controller.signal,
        redirect: 'error',
      });
      if (!response.ok) throw new Error(`Webhook returned HTTP ${response.status}.`);
    } finally {
      clearTimeout(timeout);
    }
    return { status: 'delivered', attempts: 1, lastAttemptAt };
  } catch (error) {
    return {
      status: 'failed',
      attempts: 1,
      lastAttemptAt,
      lastError: error instanceof Error ? error.message.slice(0, 500) : 'Webhook delivery failed.',
    };
  }
}
