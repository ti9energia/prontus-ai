# MAPA DO SISTEMA — Auronis Health (FASE 0)

**Data:** 2026-07-01 · **Stack:** Next.js 14.2 (App Router) · React 18 · TypeScript · Tailwind · next-intl (pt-BR/en/zh-CN/fr-FR) · Prisma 5 (Postgres opcional, seam) · `@anthropic-ai/sdk` · Recharts · Vitest (271 testes verdes) · Vercel `gru1` (deploy manual `vercel --prod`).

**Como rodar:** `npm run dev` → http://localhost:3000 (verificado: 200 em `/pt-BR`). Build prod: `npm run build && npm run start`. Testes: `npm test` (37 arquivos, 271 ✅). Typecheck e lint verdes.

**Princípio central do código:** tudo roda 100% sem credenciais — cada integração/banco é um *seam* (`isXReal()` + env var → real; senão stub determinístico).

---

## 1. Rotas de página (`src/app/[locale]`)

| Rota | Arquivo | Conteúdo |
|---|---|---|
| `/[locale]` | `page.tsx` | Landing (17 seções, ver §4) |
| `/[locale]/login` | `login/page.tsx` | Login (owner / médico teste / demo) |
| `/[locale]/app` | `app/page.tsx` | Workspace (22 telas em abas, gate de sessão via middleware → 307) |
| `/[locale]/owner` | `owner/page.tsx` | Painel do Dono (10 seções, gate role owner → 307) |
| 404 | `not-found.tsx` | Tratado (verificado: rota inexistente → 404) |
| loading | `loading.tsx` | Só no nível `[locale]` |
| **error.tsx** | **NÃO EXISTE** | Nenhum `error.tsx`/`global-error.tsx` em toda a app ⚠️ |

Extras SEO/PWA: `manifest.ts`, `robots.ts`, `sitemap.ts`, `opengraph-image.tsx`, `icon.png`, `apple-icon.png`. Middleware: locale + gates `/app` (sessão) e `/owner` (owner).

## 2. Workspace — 22 telas (todas lazy, registry em `components/workspace/registry.tsx`)

- **product:** today, agenda, encounter (consulta ao vivo), review, tiss
- **clinic:** requisicao, patients, exams, billing, faturamento, reports, templates, documents
- **system:** signature, agent, agents, whatsapp, automations, integrations, marketplace, equipe, contratos, settings

Shell: TopBar + AppRail + TabStrip (split até 3 painéis) + CommandPalette (⌘K) + CopilotDock Mari (⌘J). Cada aba dentro de `ScreenErrorBoundary` ✅ (mas só o workspace tem boundary).

## 3. Painel do Dono — 10 seções (`components/owner/`)

overview (MRR/KPIs), mari (console IA), tenants (orgs + impersonação), plans, landing (CMS mock ⚠️ publicar = toast sem persistência), flags, ai, whatsapp, access (matriz RBAC), audit.

## 4. Landing (`components/landing/`)

Ordem: JsonLd → DnaHelix (hero-only) → LandingNav → Hero (aurora + demo ao vivo) → LogoCloud → Stats → ROICalculator → Features (bento) → How → ForWhom → Security → Pricing (3 planos, CTA → `/login` ⚠️ sem checkout) → Testimonials → FAQ → FinalCTA → Footer (⚠️ 10 links `href="#"` inertes).

## 5. Endpoints de API (`src/app/api`, todos `force-dynamic`)

| Grupo | Endpoints | Auth |
|---|---|---|
| auth | POST `/api/auth/login` (rate-limit IP 8/15min, zod) · POST `logout` · GET `session` | cookie HMAC `auronis_session`, TTL 8h |
| IA | POST `/api/ai/chat` (SSE stream, fallback mock; modelo pago só com sessão+chave) · POST `ai/action` (tools Mari, confirm p/ mutações — sessão) · POST `ai/feedback` · GET/POST `ai/transcribe` (ASR, sessão, ≤25MB) · POST `/api/owner/chat` (owner) | mista |
| API pública | `/api/v1/{encounters,patients,patients/[id],guides,guides/[id],stats,keys}` — envelope `{data}/{error}`; keys geradas SHA-256 | Bearer `sk_...`; `sk_test_*` passa em dev ⚠️ keys sem role-gate |
| connectors | GET/POST `/api/memed` (prescrição) · `/api/icp` (assinatura) · `/api/whatsapp` (webhook Meta c/ HMAC + challenge; ⚠️ sem idempotência) | sessão (POST); webhook por assinatura |
| health | GET `/api/health` (liveness + checks) | nenhuma |

## 6. Entidades (Prisma, 15 modelos) + dados

Tenant, User, Plan, Subscription, FeatureFlag, Patient, Encounter, ClinicalNote, TissGuide, Template, LabOrder, AuditLog, ApiKey, ConnectorSecret. Seed idempotente espelha o store in-memory.

**Camada de dados (`src/lib/data`):** seam único — `index.ts` resolve adapter no load (`DATABASE_URL` → `postgres.ts` write-through com cache em memória e `pgFire` fire-and-forget; senão `store.ts` in-memory com `globalThis` + snapshot localStorage 4s). API síncrona ~70 funções. **As telas leem o store local direto (client-side), não via API** → front quase não faz fetch no mount.

## 7. Auth & permissões

- Sessão HMAC-SHA256 isomórfica (Web Crypto), fail-closed: owner só com `AUTH_SECRET` real; compare em tempo constante.
- Credenciais: owner (`OWNER_PASSWORD_HASH` scrypt), médico teste (`TEST_DOCTOR_*`), demo (`DEMO_MODE`, on por padrão).
- RBAC: `permissions.ts` — 18 permissões, 9 roles. Entitlements = flag ON ∧ plano concede módulo (`workspace/entitlements.ts` → open/locked/hidden).

## 8. Integrações (seams) — status honesto

| Seam | Env | Estado |
|---|---|---|
| Mari/IA | `MARI_API_URL` (remoto) → `ANTHROPIC_API_KEY` (local) → mock | Real streaming SSE; fallback lê dados reais; guardrails no system prompt |
| ASR | `ASR_PROVIDER` + OpenAI/Azure | Real ou stub |
| Memed | `MEMED_TOKEN` | Real (api.memed.com.br) ou stub |
| ICP-Brasil | `ICP_PKCS12_PATH`/`ICP_P11_LIB` | Parcial: real = só SHA-256; PAdES/PKCS#7 pendente |
| WhatsApp | `WHATSAPP_TOKEN`+`PHONE_ID`+`WEBHOOK_SECRET` | Real (Meta Graph v19) ou simulador; webhook sem dedup |
| Postgres | `DATABASE_URL` | Write-through opcional |
| **Pagamento** | — | **NÃO EXISTE** (nem gateway, nem checkout; pricing → `/login`) |
| E-mail transacional | — | NÃO EXISTE |
| EHR/FHIR | — | Só entradas mock no registry de connectors |

## 9. Jornada completa — estado atual

```
Landing ✅ (premium, 4 idiomas)
  → Cadastro ❌ NÃO EXISTE (sem signup público; acesso só login/demo)
  → Onboarding ❌ NÃO EXISTE (sem wizard)
  → Núcleo ✅ (agenda → consulta ao vivo → revisão → TISS → faturamento; 22 telas)
  → Checkout ❌ NÃO EXISTE (pricing sem compra)
  → Retenção ⚠️ parcial (agente, insights, WhatsApp sim; sem e-mail/lifecycle)
```

## 10. Requisições (raio-x) — front enxuto

- Sem React Query/SWR; sem polling de rede; sem EventSource/WebSocket. `setInterval` só p/ cronômetros de UI e persist localStorage.
- Por superfície: landing 0 fetch · workspace 1 (`/api/auth/session`, deduplicada no SessionProvider) · encounter 1 probe + POST/5s durante gravação (intencional, ASR) · whatsapp 1 probe · resto 0 no mount.
- **Sem cache HTTP:** todos handlers `force-dynamic`, zero ETag/`s-maxage` (oportunidade FASE 9). Sem waterfalls detectados.

## 11. PWA — estado atual

- Manifest via `src/app/manifest.ts` (standalone, shortcuts, theme). SW `public/sw.js`: precache mínimo, network-first navegação, cache-first estáticos, nunca cacheia `/api`. Registrado só em produção.
- **Gaps:** fallback offline hardcoded `/pt-BR` (monolíngue); sem fluxo de update (sem prompt "nova versão"); só ícone 512 (sem 192, sem splash iOS); maskable reusa a arte "any".

## 12. Design system

Tokens em `tailwind.config.ts` + `globals.css`: paleta semântica CSS vars (dark-first, brand `#14C8C4`, accent ciano, silver cromado), Sora/Inter/JetBrains (+CJK), radii 6–36px, sombras + glow, ~14 keyframes, easing spring. Tema claro/escuro sem FOUC. `prefers-reduced-motion` respeitado (CSS global + `useReducedMotion` no hero). Primitivos em `components/ui`: Button, Card, Badge, Input/Textarea/Select/Field, Avatar, Kbd, Switch, SegmentedControl, Tooltip, IconButton, Modal, Sheet, Skeleton, Spinner, Progress, EmptyState, Toaster.

## 13. Testes & CI

- Vitest: 37 arquivos / 271 testes ✅ (auth, store, mari, connectors, entitlements, segurança de input).
- **Sem Playwright/E2E** (FASE 7). CI: `.github/workflows/ci.yml` — typecheck → test → lint → i18n:check → audit → build + job docker.
- Scripts: `hash-password`, `i18n-check` (paridade 4 idiomas), `process-assets` (não-portátil, path local), `security-scan` (pen-test leve).

## 14. Dívida & candidatos a limpeza (anotados — remoção só na FASE 11)

- Zero TODO/FIXME/console.log em src; zero deps mortas; zero órfãos reais.
- `as any`: ~16 ocorrências (10 em `lib/data/postgres.ts` mappers; `lib/voice.ts` SpeechRecognition; `copilot-dock.tsx:40`; `registry.tsx:47`).
- Drift de marca "Aureon": `Dockerfile:2`, `02-Aureon-Health.md`.
- Docs sobrepostos: trilha IA (0A ⇄ docs/AI-COPILOT-BLUEPRINT ⇄ docs/MARI) e arquitetura (0D ⇄ docs/MODULARITY ⇄ docs/ARCHITECTURE); README raiz descreve o portfólio, não o app.
- i18n inline via helper `L()` fora dos JSON (owner/sections, faturamento, contratos, login-form, mari-console).
- `scripts/process-assets.mjs` com path absoluto local.
- `.env.example` não documenta vars de connectors/DB (só em comentários de código).

## 15. Lacunas priorizadas (alimentam as fases)

1. **F4:** sem `error.tsx` em nenhuma rota; footer com 10 links `#`; CMS de landing sem persistência; estados vazios ausentes em ~12 telas.
2. **F5:** pagamento/checkout inexistente; cadastro/onboarding inexistente; e-mail inexistente; webhook WhatsApp sem idempotência; ICP incompleto.
3. **F6:** update-flow do SW, offline por locale, ícones 192/maskable dedicado/splash.
4. **F7:** zero E2E.
5. **F9:** zero cache HTTP em APIs idempotentes; rate-limit só no login (in-memory).
6. **F11:** consolidação de docs + drift Aureon.

## 16. Skills disponíveis no ambiente (relevantes)

`vercel:shadcn` (design/UI), `dataviz` (gráficos), `vercel:nextjs`, `vercel:ai-sdk`, `claude-api`, `code-review`, `verify`, `simplify`, `run`, skills Vercel de deploy/env/functions. Não há skill de design própria do repo; a referência de design vive em `tailwind.config.ts`/`globals.css` + diretivas do dono (Mari loira, DNA hero-only, readability-first).
