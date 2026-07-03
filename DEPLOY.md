# DEPLOY.md — Auronis Health

App Next.js 14 (App Router) pronto para deploy. **Nenhuma variável de ambiente e obrigatoria** — roda 100% com dados mock e fallbacks funcionais. Defina as variaveis abaixo para ativar recursos reais.

---

## Variaveis de ambiente

### Obrigatorias em producao

| Variavel | Para que |
|---|---|
| `AUTH_SECRET` | Assina as sessoes do dono e do medico de teste. **Sem ela o login e fail-closed.** Gere com `openssl rand -base64 32`. |
| `NEXT_PUBLIC_SITE_URL` | URL publica e canonica (OG, sitemap, robots). Ex.: `https://auronishealth.com` |

### Banco de dados (multi-dispositivo)

| Variavel | Para que | Sem ela |
|---|---|---|
| `DATABASE_URL` | Postgres — ex.: `postgresql://user:pass@host/db?sslmode=require` (Neon, Supabase, Railway) | Dados em memoria (`store.ts`); reiniciam a cada deploy |

**Passos para ativar:**
1. Provisione um Postgres (Neon.tech ou Supabase sao gratuitos para comecar).
2. Defina `DATABASE_URL` na Vercel (*Settings → Environment Variables*).
3. Execute uma vez: `npx prisma migrate deploy` (ou `npm run db:migrate`).
4. Execute o seed: `npx tsx prisma/seed.ts` (ou `npm run db:seed`).
5. Pronto — os dados agora persistem entre deploys e dispositivos.

### IA / Copiloto Mari

| Variavel | Para que | Sem ela |
|---|---|---|
| `ANTHROPIC_API_KEY` | Mari responde com a Claude API real (streaming) | Fallback inteligente com dados reais do app |
| `ANTHROPIC_MODEL` | Modelo padrao da Mari | `claude-sonnet-4-6` |
| `MARI_API_URL` / `MARI_API_KEY` | Cerebro Mari em servidor proprio (prioridade sobre Claude local) | Usa Claude local |

### ASR — Transcricao de audio

| Variavel | Para que | Sem ela |
|---|---|---|
| `ASR_PROVIDER` | `whisper` (OpenAI) ou `azure` | Demo fallback (script fixo) |
| `OPENAI_API_KEY` | Chave da OpenAI (Whisper) — usada quando `ASR_PROVIDER=whisper` | — |
| `AZURE_SPEECH_KEY` / `AZURE_SPEECH_REGION` | Credenciais do Azure Speech — usadas quando `ASR_PROVIDER=azure` | — |

### Prescricao eletronica (Memed)

| Variavel | Para que | Sem ela |
|---|---|---|
| `MEMED_TOKEN` | Token da API Memed | Stub funcional |
| `MEMED_PUBLIC_TOKEN` | Token publico Memed (widget/integracao) | — |
| `MEMED_API_URL` | Ambiente Memed | `https://api.memed.com.br/v1` |

### Assinatura ICP-Brasil (A1/A3)

| Variavel | Para que | Sem ela |
|---|---|---|
| `ICP_PKCS12_PATH` | Caminho do certificado A1 (`.pfx`/`.p12`) | Fingerprint mock |
| `ICP_P11_LIB` | Biblioteca PKCS#11 para token A3 | Fingerprint mock |

### WhatsApp Cloud API (Meta)

| Variavel | Para que | Sem ela |
|---|---|---|
| `WHATSAPP_TOKEN` | Token permanente da Meta Cloud API | Simulador local |
| `WHATSAPP_PHONE_ID` | ID do numero verificado | — |
| `WHATSAPP_API_URL` | Endpoint da Graph API | `https://graph.facebook.com/v19.0` |
| `WHATSAPP_WEBHOOK_SECRET` | Segredo para verificacao do webhook da Meta | — |

### Pagamento / Checkout (Mercado Pago)

| Variavel | Para que | Sem ela |
|---|---|---|
| `MERCADOPAGO_ACCESS_TOKEN` | Token do Mercado Pago (um `TEST-...` ja ativa o sandbox real) | Checkout 100% em sandbox mock |
| `MERCADOPAGO_WEBHOOK_SECRET` | Valida a assinatura `x-signature` dos webhooks | — |
| `MERCADOPAGO_API_URL` | Endpoint da API do Mercado Pago | `https://api.mercadopago.com` |

### E-mail transacional (Resend)

| Variavel | Para que | Sem ela |
|---|---|---|
| `RESEND_API_KEY` | Envia e-mails reais (boas-vindas, confirmacao/falha de pagamento) | E-mails apenas registrados em log estruturado |
| `EMAIL_FROM` | Remetente usado nos envios reais | `Auronis Health <no-reply@auronishealth.com>` |

### Autenticacao e demo

| Variavel | Para que | Padrao |
|---|---|---|
| `OWNER_EMAIL` | E-mail de login do dono (super-admin) | `owner@auronishealth.com` |
| `OWNER_NAME` | Nome exibido no painel do dono | `Owner` |
| `OWNER_PASSWORD_HASH` | Hash scrypt da senha do dono (gere com `node scripts/hash-password.mjs 'SuaSenha'`) | — (bloqueado sem hash) |
| `TEST_DOCTOR_EMAIL` | Conta de teste do lado medico | `marianabarreto@…` |
| `TEST_DOCTOR_PASSWORD` | Senha da conta de teste | `auronis-demo` |
| `DEMO_MODE` | Atalho de demo via API (`POST /api/auth/login {"demo":true}`); sem botao visivel na UI; defina `false` em producao | habilitado |

---

## Deploy na Vercel (recomendado)

O deploy e **manual via CLI** — git push NAO faz deploy automatico (a integracao git esta desativada).

```bash
npm i -g vercel          # instalar uma vez
vercel --prod            # deploy de producao -> prontus-ai.vercel.app
```

Para inspecionar o ultimo deploy:
```bash
vercel ls
vercel logs <url>
```

`vercel.json` define a regiao **gru1 (Sao Paulo)** para baixa latencia no Brasil.

---

## Deploy com Docker

```bash
docker build -t auronis-health .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SITE_URL=https://seu-dominio.com \
  -e AUTH_SECRET=... \
  -e DATABASE_URL=postgresql://... \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  auronis-health
```

O `Dockerfile` usa build multi-stage com `output: standalone` (~120 MB final). Health check em `GET /api/health`.

> **Fly.io:** ativo — o `fly.toml` fica na **raiz** do repo (`flyctl deploy` → `auronis-health.fly.dev`; ver `DEPLOY-FLY.md`). **Render:** manifesto parqueado em `deploy/_inactive/` (tinha `autoDeploy: true` em regiao errada); para usar, mova o `render.yaml` de volta e revise regiao (Sao Paulo, nao Oregon) e `autoDeploy`.

---

## Deploy tradicional (Node)

```bash
npm ci
npm run build
npm run start          # porta 3000 (ou PORT)
```

---

## Checklist de producao

- [x] Build verde (`npm run build`) — 4 idiomas, 20+ rotas.
- [x] Next 14.2.35 (correcao de seguranca aplicada).
- [x] `output: standalone` + Dockerfile multi-stage nao-root.
- [x] Headers de seguranca + CSP em `next.config.mjs`.
- [x] Observabilidade: `src/instrumentation.ts` + `/api/health`.
- [x] `robots.txt` + `sitemap.xml` + PWA (manifest + service worker).
- [x] Sem segredos no codigo; tudo via env.
- [x] Chaves de API publicas SHA-256 hasheadas (nunca a chave bruta persistida).
- [ ] **Definir `AUTH_SECRET`** — obrigatorio para o login do dono funcionar.
- [ ] **Provisionar Postgres** (`DATABASE_URL`) para persistencia multi-dispositivo real.
- [ ] Pos-deploy: `npm run security:scan <url-real>`.

---

## Gerenciar chaves de API publicas (/api/v1)

O painel do dono (`/owner` → aba "API") permite:
- Gerar novas chaves (`sk_live_...`) — a chave bruta e mostrada **uma unica vez**; guarde imediatamente.
- Revogar chaves existentes.

Apenas o hash SHA-256 e armazenado (no Postgres quando `DATABASE_URL` presente, no store in-memory caso contrario). A chave bruta nunca toca o banco.

Para testes locais use `sk_test_*` — aceito sem lookup de banco em `NODE_ENV != production`.
