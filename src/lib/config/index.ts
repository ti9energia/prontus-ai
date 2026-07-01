/**
 * Config tipada e centralizada — o único catálogo de variáveis de ambiente do servidor.
 *
 * Regras:
 * - Getters lazy (leem process.env na chamada): testes e plataformas que injetam env
 *   em runtime continuam funcionando; nada é congelado no load do módulo.
 * - Edge-safe: zero imports de Node — usável em middleware, rotas e client
 *   (no client, tudo resolve para undefined exceto NODE_ENV/NEXT_PUBLIC_*, que o
 *   bundler inlina; gates `isReal()` continuam decididos no servidor via probes).
 * - Toda variável nova entra AQUI e no `.env.example` — nunca `process.env.X` solto.
 */

const env = (key: string): string | undefined => {
  const v = process.env[key];
  return v === undefined || v === '' ? undefined : v;
};

const flag = (key: string, defaultOn: boolean): boolean => {
  const v = env(key);
  if (v === undefined) return defaultOn;
  return v !== 'false' && v !== '0';
};

export const config = {
  runtime: {
    get isProd(): boolean {
      return process.env.NODE_ENV === 'production';
    },
    get isTest(): boolean {
      return process.env.NODE_ENV === 'test';
    },
    /** SHA do commit no deploy (Vercel) — usado como versão em /api/health. */
    get commitSha(): string | undefined {
      return env('VERCEL_GIT_COMMIT_SHA');
    },
  },

  site: {
    /** URL pública canônica (metadata/OG, sitemap, robots).
     * Acesso literal a process.env.NEXT_PUBLIC_* — obrigatório para o bundler
     * inlinar o valor também no client. */
    get url(): string {
      return process.env.NEXT_PUBLIC_SITE_URL || 'https://auronishealth.com';
    },
  },

  auth: {
    /** Segredo HMAC das sessões. Sem ele, sessões de owner são recusadas (fail-closed). */
    get secret(): string | undefined {
      return env('AUTH_SECRET');
    },
    get ownerEmail(): string {
      return env('OWNER_EMAIL') ?? 'owner@auronishealth.com';
    },
    get ownerName(): string {
      return env('OWNER_NAME') ?? 'Owner';
    },
    get ownerPasswordHash(): string | undefined {
      return env('OWNER_PASSWORD_HASH');
    },
    get ownerPassword(): string | undefined {
      return env('OWNER_PASSWORD');
    },
    get testDoctorEmail(): string {
      return env('TEST_DOCTOR_EMAIL') ?? 'marianabarreto@auronishealth.com';
    },
    get testDoctorPassword(): string {
      return env('TEST_DOCTOR_PASSWORD') ?? 'auronis-demo';
    },
    /** Atalho "Entrar na demonstração" (default ligado; DEMO_MODE=false desliga). */
    get demoEnabled(): boolean {
      return flag('DEMO_MODE', true);
    },
  },

  ai: {
    get anthropicApiKey(): string | undefined {
      return env('ANTHROPIC_API_KEY');
    },
    get anthropicModel(): string {
      return env('ANTHROPIC_MODEL') ?? 'claude-sonnet-4-6';
    },
    /** Mari como serviço próprio — se presente, tem prioridade sobre a Claude local. */
    get mariApiUrl(): string | undefined {
      return env('MARI_API_URL');
    },
    get mariApiKey(): string | undefined {
      return env('MARI_API_KEY');
    },
  },

  asr: {
    get provider(): 'whisper' | 'azure' | undefined {
      const p = env('ASR_PROVIDER');
      return p === 'whisper' || p === 'azure' ? p : undefined;
    },
    get openaiApiKey(): string | undefined {
      return env('OPENAI_API_KEY');
    },
    get azureSpeechKey(): string | undefined {
      return env('AZURE_SPEECH_KEY');
    },
    get azureSpeechRegion(): string | undefined {
      return env('AZURE_SPEECH_REGION');
    },
  },

  db: {
    get url(): string | undefined {
      return env('DATABASE_URL');
    },
  },

  memed: {
    get token(): string | undefined {
      return env('MEMED_TOKEN');
    },
    get publicToken(): string | undefined {
      return env('MEMED_PUBLIC_TOKEN');
    },
    get apiUrl(): string {
      return env('MEMED_API_URL') ?? 'https://api.memed.com.br/v1';
    },
  },

  icp: {
    /** Certificado A1 (.pfx) — ativa assinatura real. */
    get pkcs12Path(): string | undefined {
      return env('ICP_PKCS12_PATH');
    },
    /** Biblioteca PKCS#11 (token A3) — ativa assinatura real. */
    get p11Lib(): string | undefined {
      return env('ICP_P11_LIB');
    },
  },

  whatsapp: {
    get token(): string | undefined {
      return env('WHATSAPP_TOKEN');
    },
    get phoneId(): string | undefined {
      return env('WHATSAPP_PHONE_ID');
    },
    get apiUrl(): string {
      return env('WHATSAPP_API_URL') ?? 'https://graph.facebook.com/v19.0';
    },
    get webhookSecret(): string | undefined {
      return env('WHATSAPP_WEBHOOK_SECRET');
    },
  },
} as const;

export type AppConfig = typeof config;
