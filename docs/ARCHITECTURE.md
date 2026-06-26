# Arquitetura — Auronis Health

Como o sistema é montado hoje, como a **Mari** será desacoplada para um servidor
próprio, e como o sistema **conecta com sistemas externos**. Para a lógica de
produto da Mari, veja [`MARI.md`](./MARI.md). Para o padrão genérico reutilizável
em outros nichos, veja [`AI-COPILOT-BLUEPRINT.md`](./AI-COPILOT-BLUEPRINT.md).

---

## 1. Visão geral

Aplicação **Next.js (App Router)** full-stack, multilíngue (pt-BR · en · zh-CN ·
fr-FR), com sessões assinadas, um data store em memória (mock/seed hoje) e a Mari
como camada de IA.

```
┌─────────────────────────────────────────────────────────────┐
│  UI (React Server/Client Components)                         │
│   landing · login · workspace (/app) · console do dono (/owner)│
├─────────────────────────────────────────────────────────────┤
│  Middleware  →  gateia /app (sessão) e /owner (role=owner)   │
├─────────────────────────────────────────────────────────────┤
│  API (route handlers)   /api/auth/* · /api/ai/chat ·         │
│                         /api/owner/chat · /api/health        │
├──────────────┬───────────────────────┬──────────────────────┤
│  Mari        │  Data store           │  Connectors          │
│  (serviço)   │  (mock → DB futuro)   │  (sistemas externos) │
└──────────────┴───────────────────────┴──────────────────────┘
```

### Camadas
- **UI** — `src/components/**`, telas do workspace registradas em `registry.tsx`.
- **Auth** — cookie httpOnly assinado (HMAC-SHA256 via Web Crypto), isomórfico
  (mesmo código no middleware edge e nos route handlers). `src/lib/auth/**`.
- **API** — route handlers finos em `src/app/api/**`.
- **Mari** — `src/lib/mari/service.ts` (a *seam* de IA).
- **Data** — `src/lib/data/store.ts` (hoje seed em memória; amanhã um banco).
- **Connectors** — `src/lib/connectors/types.ts` (contrato para sistemas externos).
- **i18n** — `next-intl`, mensagens em `messages/*.json`.

---

## 2. Arquitetura de API

### Princípios
- **Rotas finas.** O handler valida → constrói contexto → chama um serviço →
  responde. Nenhuma regra de negócio mora no handler.
- **Validação na borda.** Todo corpo passa por **Zod** (`safeParse`), com limites
  de tamanho e sanitização (anti-abuso / anti-injeção). Entrada inválida → `400`.
- **Falha-fechada.** Rotas sensíveis exigem sessão; owner exige role `owner`
  (`403`). Em produção sem `AUTH_SECRET`, **nenhuma** sessão é honrada.
- **Auditoria.** Ações relevantes chamam `pushAudit(...)`.

### Envelope de resposta (alvo)
Erros já seguem um envelope consistente; o alvo é padronizar sucesso também:

```ts
// sucesso
{ "data": <T>, "error": null }
// erro
{ "data": null, "error": { "code": "FORBIDDEN", "messageKey": "errors.forbidden" } }
```
> As rotas de chat retornam `{ reply, source }` por contrato com o cliente do
> dock; ao migrar para o envelope, manter `reply`/`source` dentro de `data`.

### Superfície atual
| Método | Rota | Auth | Função |
|---|---|---|---|
| POST | `/api/auth/login` | pública (rate-limited) | cria sessão |
| POST | `/api/auth/logout` | sessão | encerra sessão |
| GET | `/api/auth/session` | sessão | reflete a sessão para a UI |
| POST | `/api/ai/chat` | gate de custo | Mari clínica |
| POST | `/api/owner/chat` | **owner** | Mari de negócio |
| POST | `/api/ai/action` | sessão | executa uma *tool* da Mari (pré-glosa, gerar guia…) |
| GET | `/api/health` | pública | liveness + checks de readiness |

---

## 3. Mari — arquitetura e plano de decoupling

### Hoje: in-process, atrás de uma *seam*
Toda surface chama **`mariChat(req)`**. A inteligência roda dentro do próprio app
(Claude) com um mock determinístico de fallback. **Onde a Mari roda é decisão de
ambiente, não de código.**

```
Surface (rota)  ──►  mariChat()  ──►  1) remoto?  2) Claude local?  3) mock
   clinical                              (MARI_API_URL)  (ANTHROPIC_API_KEY)
   owner
```

Contrato in-process (`src/lib/mari/service.ts`):

```ts
mariChat({
  surface: 'clinical' | 'owner',
  system: string,            // persona + contexto já montados
  messages: MariMessage[],   // já limitado e sanitizado
  locale: string,
  context?: Record<string, unknown>,
  allowModel: boolean,       // gate de custo/auth do chamador
  maxTokens?: number,
  fallback: () => string,    // resposta determinística ciente dos dados
}) => Promise<{ reply: string; source: 'remote'|'claude'|'mock'|'mock-fallback' }>
```

### Mari que age (tools)
Além de conversar, a Mari **executa ações** via um registro de *tools* tipadas e
determinísticas (`src/lib/mari/tools.ts`): `schedule.today`, `note.summarize`,
`tiss.generate`, **`glosa.check`** (a verificação pré-glosa — score de prontidão +
issues) e `tiss.submit`. O endpoint `POST /api/ai/action` roda uma tool com sessão,
validação Zod e auditoria; ações que mudam estado exigem **confirmação humana** e o
envio é bloqueado enquanto houver bloqueios de pré-glosa. Cada tool já carrega
`{ id, description, input }` — a mesma forma que alimenta o **tool-use do modelo**
quando o cérebro (local ou remoto) for ligado às ferramentas.

### Amanhã: Mari como serviço próprio
O futuro é **tirar a Mari do app**, rodá-la num servidor dedicado (com memória,
treino/fine-tuning, ferramentas e conhecimento próprios) e ligá-la ao sistema por
API. Como a *seam* já existe, isso é **só configuração**:

```
                         ┌──────────────────────────────┐
   Auronis Health  ──HTTP──►  Servidor da Mari (cérebro)  │
   (e outros sistemas)      │  • memória & treino próprios │
        set MARI_API_URL    │  • ferramentas / RAG        │
                            │  • multi-tenant, multi-app  │
                         └──────────────────────────────┘
```

**Contrato do cérebro remoto** — `POST {MARI_API_URL}/v1/chat`, header
`Authorization: Bearer {MARI_API_KEY}`:

```jsonc
// request
{ "surface": "clinical", "system": "…", "messages": [...],
  "locale": "pt-BR", "context": { "screen": "tiss" }, "maxTokens": 600 }
// response
{ "reply": "…" }
```

Propriedades de design que tornam o decoupling seguro:
- **Mesmo contrato** dos dois lados → o código do produto não muda.
- **Degradação graciosa** → se o cérebro remoto cair, cai para Claude local e,
  por fim, para o mock. A Mari nunca derruba uma requisição.
- **Timeout** no cliente remoto (15s) → um cérebro lento não trava o app.
- **Multi-sistema** → o campo `surface` + `context` deixam o mesmo cérebro servir
  outros produtos/nichos sem ramificar código.

### Roadmap de decoupling
1. **(feito)** *Seam* `mariChat` + contrato; rotas finas.
2. Subir o servidor da Mari expondo `POST /v1/chat` (mesmo contrato).
3. Setar `MARI_API_URL` / `MARI_API_KEY` em produção → tráfego migra sem deploy de código.
4. Mover memória/treino/ferramentas para o servidor; o app só envia `context`.
5. Conectar outros sistemas ao mesmo cérebro (cada um manda seu `surface`).

---

## 4. Conectores — ligando com sistemas externos

O sistema fala com terceiros (EHR/EMR, operadoras/TISS, WhatsApp/mensageria,
ASR/voz, faturamento) **sempre por um contrato único** — nunca contra o SDK do
fornecedor direto. Contrato em `src/lib/connectors/types.ts`.

```
App / Mari  ──►  ConnectorRegistry.get(id)  ──►  Connector
                                                  ├─ check(ctx) → status
                                                  └─ capabilities[id].invoke(input, ctx)
                                                       ehr.patient.read
                                                       payer.claim.submit
                                                       messaging.send …
```

- **`Connector`** — um fornecedor (id, categoria, `check()` de saúde,
  `capabilities`).
- **`ConnectorCapability`** — uma ação discreta (`invoke(input, ctx)`), descoberta
  por id. **A Mari pode listar capabilities e usá-las como ferramentas** sem saber
  o fornecedor.
- **`ConnectorContext`** — `orgId` (multi-tenant) + `config` (segredos injetados).
- **`ConnectorRegistry`** — resolve por id em runtime; troca de fornecedor = trocar
  o registro, não o código que usa.

Benefício: adicionar uma operadora nova, trocar o motor de ASR, ou ligar outro
mensageiro vira **implementar a interface + registrar** — o app e a Mari não mudam.

---

## 5. Segurança, multi-tenant e configuração

- **Sessões:** HMAC-SHA256, httpOnly, `SameSite=Lax`, fail-closed em produção.
- **Headers + CSP:** headers de segurança e uma **Content-Security-Policy** em
  `next.config.mjs` (defesa-em-profundidade contra XSS, relevante por renderizar
  saída de LLM); `frame-ancestors 'none'`.
- **Observabilidade:** `src/instrumentation.ts` loga o boot e captura
  `unhandledRejection`/`uncaughtException` em JSON estruturado (seam para
  Sentry/OTel); `/api/health` expõe liveness + checks de readiness.
- **Demonstração:** o login público de demo fica atrás de `DEMO_MODE`
  (`false` desativa). Nenhuma PII real no código — o dono é configurado por env.
- **Multi-tenant:** todo connector recebe `orgId`; nada cruza tenants.
- **Segredos:** sempre via env / config injetada — nunca hard-coded.

### Variáveis de ambiente
| Var | Para quê |
|---|---|
| `AUTH_SECRET` | assina sessões — **obrigatória em produção** (senão todo login falha-fechado) |
| `OWNER_EMAIL` / `OWNER_NAME` / `OWNER_PASSWORD(_HASH)` | login do dono |
| `TEST_DOCTOR_EMAIL` / `TEST_DOCTOR_PASSWORD` | conta de teste (lado médico) |
| `DEMO_MODE` | habilita o login público de demo (`false` desativa) |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` | modelo local da Mari |
| `MARI_API_URL` / `MARI_API_KEY` | **cérebro remoto da Mari** (decoupling) |
| `NEXT_PUBLIC_SITE_URL` | OG / sitemap / robots |
| *(por connector)* | credenciais de cada sistema externo |
