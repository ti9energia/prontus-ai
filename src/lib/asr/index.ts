import { config } from '@/lib/config';
/**
 * ASR seam — automatic speech recognition.
 *
 * Resolution order (first that can answer wins):
 *   1. OpenAI Whisper  (ASR_PROVIDER=whisper + OPENAI_API_KEY)
 *   2. Azure Speech    (ASR_PROVIDER=azure  + AZURE_SPEECH_KEY + AZURE_SPEECH_REGION)
 *   3. Deterministic stub (always — demo/offline safe)
 *
 * Usage:
 *   import { transcribeAudio, isAsrReal } from '@/lib/asr';
 *   const { text } = await transcribeAudio(audioBlob, 'pt-BR');
 *
 * For the browser: POST audio/form-data to /api/ai/transcribe which proxies
 * to this module server-side (avoids exposing API keys to the client).
 */

export type AsrSource = 'whisper' | 'azure' | 'stub';

export interface AsrResult {
  text: string;
  source: AsrSource;
  durationMs?: number;
}

/** Returns true when a real ASR provider is configured server-side. */
export function isAsrReal(): boolean {
  const provider = config.asr.provider;
  if (!provider) return false;
  if (provider === 'whisper') return !!config.asr.openaiApiKey;
  if (provider === 'azure') return !!(config.asr.azureSpeechKey && config.asr.azureSpeechRegion);
  return false;
}

/** Map Next.js / BCP-47 locale to the provider's language tag. */
function toProviderLocale(locale: string, provider: AsrSource): string {
  // Most providers accept BCP-47 directly.
  const map: Record<string, string> = {
    'pt-BR': provider === 'whisper' ? 'pt' : 'pt-BR',
    'zh-CN': provider === 'whisper' ? 'zh' : 'zh-CN',
    'fr-FR': provider === 'whisper' ? 'fr' : 'fr-FR',
    en: provider === 'whisper' ? 'en' : 'en-US',
  };
  return map[locale] ?? locale;
}

async function transcribeWhisper(audio: Blob, locale: string): Promise<string> {
  const apiKey = config.asr.openaiApiKey!;
  const form = new FormData();
  form.append('file', audio, 'audio.webm');
  form.append('model', 'whisper-1');
  form.append('language', toProviderLocale(locale, 'whisper'));
  form.append('response_format', 'text');

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!res.ok) {
    const err = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(`Whisper API error: ${err}`);
  }
  return (await res.text()).trim();
}

async function transcribeAzure(audio: Blob, locale: string): Promise<string> {
  const key = config.asr.azureSpeechKey!;
  const region = config.asr.azureSpeechRegion!;
  const lang = toProviderLocale(locale, 'azure');

  const res = await fetch(
    `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${lang}&format=simple`,
    {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'audio/webm;codecs=opus',
      },
      body: audio,
    },
  );
  if (!res.ok) {
    const err = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(`Azure Speech error: ${err}`);
  }
  const json = (await res.json()) as { DisplayText?: string; RecognitionStatus?: string };
  if (json.RecognitionStatus !== 'Success') {
    throw new Error(`Azure speech recognition failed: ${json.RecognitionStatus}`);
  }
  return (json.DisplayText ?? '').trim();
}

/**
 * Transcribe an audio blob.
 *
 * In server context (API route): routes to the configured provider.
 * When no credentials are present: returns '' with source='stub' — the
 * caller (encounter screen) falls back to the deterministic demo script.
 */
export async function transcribeAudio(audio: Blob, locale: string): Promise<AsrResult> {
  const t0 = Date.now();
  const provider = process.env.ASR_PROVIDER;

  try {
    if (provider === 'whisper' && process.env.OPENAI_API_KEY) {
      const text = await transcribeWhisper(audio, locale);
      return { text, source: 'whisper', durationMs: Date.now() - t0 };
    }
    if (provider === 'azure' && process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION) {
      const text = await transcribeAzure(audio, locale);
      return { text, source: 'azure', durationMs: Date.now() - t0 };
    }
  } catch (e) {
    console.error('[asr] transcription failed, returning stub:', e instanceof Error ? e.message : e);
    // Fall through to stub — never crash the encounter.
  }

  return { text: '', source: 'stub', durationMs: 0 };
}
