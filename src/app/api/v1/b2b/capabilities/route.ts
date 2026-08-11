import { authenticateApiKey, json } from '@/lib/api';
import { isAsrReal } from '@/lib/asr';
import { B2B_FIELD_TYPES } from '@/lib/b2b/contracts';
import { config } from '@/lib/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(req: Request) {
  const auth = authenticateApiKey(req);
  if (auth.error) return auth.error;

  return json({
    version: 'v1',
    tenant: auth.context.orgId,
    capabilities: {
      audioTranscription: isAsrReal(),
      structuredExtraction: !!(config.ai.mariApiUrl || config.ai.anthropicApiKey),
      persistentStorage: !!config.db.url,
      partnerTranscript: true,
      signedWebhooks: true,
      shortLivedBrowserUploadTokens: true,
    },
    limits: {
      chunkBytes: 25 * 1024 * 1024,
      jobAudioBytes: 500 * 1024 * 1024,
      jobDurationSeconds: 6 * 60 * 60,
      schemaFields: 100,
      transcriptCharacters: 250_000,
    },
    fieldTypes: B2B_FIELD_TYPES,
  });
}
