import { z } from 'zod';

export const B2B_FIELD_TYPES = [
  'string',
  'long_text',
  'number',
  'boolean',
  'date',
  'single_select',
  'multi_select',
] as const;

export type B2bFieldType = (typeof B2B_FIELD_TYPES)[number];

export const ExtractionFieldSchema = z.object({
  key: z.string().trim().min(2).max(64).regex(/^[a-z][a-z0-9_.-]*$/),
  label: z.string().trim().min(1).max(160),
  type: z.enum(B2B_FIELD_TYPES),
  description: z.string().trim().max(1_000).optional(),
  section: z.string().trim().max(120).optional(),
  required: z.boolean().default(false),
  options: z.array(z.string().trim().min(1).max(160)).min(1).max(100).optional(),
}).superRefine((field, ctx) => {
  const select = field.type === 'single_select' || field.type === 'multi_select';
  if (select && !field.options?.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['options'],
      message: 'Select fields require at least one option.',
    });
  }
});

export type ExtractionField = z.infer<typeof ExtractionFieldSchema>;

export const CreateExtractionSchemaRequest = z.object({
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(2_000).optional(),
  instructions: z.string().trim().max(4_000).optional(),
  version: z.number().int().min(1).max(10_000).default(1),
  fields: z.array(ExtractionFieldSchema).min(1).max(100),
}).superRefine((value, ctx) => {
  const seen = new Set<string>();
  value.fields.forEach((field, index) => {
    if (seen.has(field.key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fields', index, 'key'],
        message: `Duplicate field key: ${field.key}`,
      });
    }
    seen.add(field.key);
  });
});

export type CreateExtractionSchemaInput = z.infer<typeof CreateExtractionSchemaRequest>;

const JsonPrimitive = z.union([z.string(), z.number(), z.boolean(), z.null()]);
export const MetadataSchema = z.record(JsonPrimitive).refine(
  (value) => JSON.stringify(value).length <= 16_000,
  'Metadata exceeds 16 KB.',
);

export const CreateB2bJobRequest = z.object({
  schemaId: z.string().trim().min(1).max(120),
  externalId: z.string().trim().min(1).max(200).optional(),
  locale: z.string().trim().min(2).max(20).default('pt-BR'),
  metadata: MetadataSchema.optional(),
  consent: z.object({
    confirmed: z.literal(true),
    capturedAt: z.string().datetime(),
    method: z.string().trim().min(1).max(120).optional(),
  }),
  retention: z.enum(['result_only', 'transcript_and_result']).default('result_only'),
  webhookUrl: z.string().url().max(1_000).optional(),
});

export type CreateB2bJobInput = z.infer<typeof CreateB2bJobRequest>;

export const CompleteB2bJobRequest = z.object({
  /** Systems that already transcribe audio may send the final transcript directly. */
  transcript: z.string().trim().min(1).max(250_000).optional(),
});

export type CompleteB2bJobInput = z.infer<typeof CompleteB2bJobRequest>;

export interface B2bExtractionSchema {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  instructions?: string;
  version: number;
  fields: ExtractionField[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PublicExtractionSchema = Omit<B2bExtractionSchema, 'orgId'>;

export function toPublicSchema(schema: B2bExtractionSchema): PublicExtractionSchema {
  const { orgId: _orgId, ...safe } = schema;
  return safe;
}

export type B2bJobStatus = 'collecting' | 'processing' | 'completed' | 'failed';

export interface TranscriptSegment {
  sequence: number;
  text: string;
  source: 'whisper' | 'azure' | 'partner';
  durationMs?: number;
  audioBytes?: number;
  createdAt: string;
}

export interface ExtractedFieldValue {
  value: string | number | boolean | string[] | null;
  confidence: number;
  evidence?: string;
  needsReview: boolean;
}

export interface ExtractionResult {
  fields: Record<string, ExtractedFieldValue>;
  summary?: string;
  warnings: string[];
  source: 'remote' | 'claude';
}

export interface B2bJob {
  id: string;
  orgId: string;
  apiKeyId: string;
  schemaId: string;
  schemaSnapshot: B2bExtractionSchema;
  externalId?: string;
  idempotencyKey?: string;
  locale: string;
  status: B2bJobStatus;
  metadata: Record<string, string | number | boolean | null>;
  consent: { confirmed: true; capturedAt: string; method?: string };
  retention: 'result_only' | 'transcript_and_result';
  webhookUrl?: string;
  webhookDelivery?: {
    status: 'pending' | 'delivered' | 'failed';
    attempts: number;
    lastAttemptAt?: string;
    lastError?: string;
  };
  segments: TranscriptSegment[];
  transcript?: string;
  result?: ExtractionResult;
  error?: { code: string; message: string };
  usage: {
    audioBytes: number;
    audioDurationMs: number;
    chunks: number;
    transcriptCharacters: number;
  };
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface PublicB2bJob extends Omit<B2bJob, 'orgId' | 'apiKeyId' | 'segments' | 'transcript' | 'schemaSnapshot'> {
  schemaSnapshot: PublicExtractionSchema;
  transcript?: string;
  segmentCount: number;
}

export function toPublicJob(job: B2bJob, includeTranscript = false): PublicB2bJob {
  const { orgId: _orgId, apiKeyId: _apiKeyId, segments, transcript, ...safe } = job;
  return {
    ...safe,
    schemaSnapshot: toPublicSchema(safe.schemaSnapshot),
    segmentCount: segments.length,
    ...(includeTranscript && transcript ? { transcript } : {}),
  };
}
