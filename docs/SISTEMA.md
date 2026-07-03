# Auronis Health — Visão do Sistema

> Documento canônico: **o que é, o que faz, como é construído, e as cores/design**.
> Escriba clínico de IA. Da fala da consulta → prontuário estruturado + guia TISS.
> _"Somos extremamente inteligentes, mas também humanos."_

---

## 1. O que é

**Auronis Health** é um SaaS de **escriba clínico com IA** para médicos e clínicas.
O médico atende normalmente; a **Mari** (copiloto de IA) ouve a consulta e devolve,
ao final, o **prontuário estruturado** e a **guia TISS** prontos para revisão e
assinatura — recuperando horas de documentação e reduzindo **glosa** (rejeição de
faturamento pelos convênios).

**Fluxo central:**

```
fala da consulta  →  transcrição (ASR)  →  Mari estrutura  →  prontuário + guia TISS
                                                              →  revisão do médico
                                                              →  assinatura (ICP-Brasil)
                                                              →  envio ao convênio
```

**Três tipos de usuário:**
- **Médico** → workspace clínico (`/app`) — 23 telas, Mari como copiloto.
- **Dono da plataforma (owner)** → painel SaaS (`/owner`) — MRR, tenants, planos, feature flags, console da Mari.
- **Visitante** → landing (4 idiomas) → cadastro/`login` → onboarding → `/app`.

---

## 2. O que ele faz (por área)

| Área | O que entrega |
|---|---|
| **Landing** | Site de marketing em 4 idiomas (pt-BR/en/zh-CN/fr-FR), calculadora de ROI/glosa, preços, FAQ, legal (Privacidade/Termos/LGPD). Fundo vivo de **DNA** (ver §5). |
| **Auth** | Login, cadastro real (tenant + usuário), sessão HMAC, gate de owner _fail-closed_, atalho de demonstração via API. |
| **Onboarding** | Assistente de 4 etapas, persistente e retomável. |
| **Workspace clínico (`/app`)** | 23 telas: consulta/gravação, prontuário, guias TISS, pacientes, exames, receituário, assinatura, documentos, agente, automações, marketplace, integrações, configurações, etc. Mari como copiloto em toda a jornada. |
| **Painel do dono (`/owner`)** | Métricas (MRR, gráfico), tenants, planos, feature flags, CMS da landing, console da Mari (persona/modelo por tenant). |
| **Checkout** | PIX / boleto / cartão sobre adapter **Mercado Pago** real + sandbox mock (QR EMV válido, CRC16). Webhook idempotente. Ciclos mensal/anual. |
| **API pública v1** | REST autenticada por API-key, paginada (`patients`/`encounters`/`guides`). |
| **PWA** | Manifest + ícones (any/maskable), service worker com fluxo de atualização, fallback offline por idioma. |

---

## 3. Arquitetura

### Visão geral
- **App único full-stack Next.js 14** (App Router). "Front" (páginas) e "back" (rotas
  de API) são **o mesmo app** — não são separáveis. Deploy como container standalone
  (`output: 'standalone'`) ou serverless.
- **TypeScript estrito**, Tailwind, **next-intl** (4 locales, paridade garantida por
  `scripts/i18n-check.mjs`).

### Camadas
```
src/
├─ app/
│  ├─ [locale]/            rotas localizadas (landing, login, signup, app, owner,
│  │                       checkout, onboarding, legal…) + error/loading boundaries
│  └─ api/                 rotas de API (auth, v1, checkout, webhooks, health, whatsapp)
├─ components/
│  ├─ landing/  auth/  onboarding/  checkout/   (jornada pública)
│  ├─ workspace/  screens/  owner/              (produto logado)
│  ├─ brand/  ui/  seo/                          (design system + marca)
│  └─ theme-provider · language-switcher
├─ lib/
│  ├─ config/              ÚNICA porta para process.env (getters lazy, tipados)
│  ├─ data/                store in-memory + adapter Postgres opcional (DATABASE_URL)
│  ├─ auth/                sessão HMAC, scrypt, gate de owner
│  ├─ api/                 paginação, auth de API-key, helpers
│  └─ hooks · utils · i18n
├─ i18n/routing.ts         Link/router localizados
messages/                  catálogos pt-BR · en · zh-CN · fr-FR (927 chaves)
```

### Padrões-chave
- **Barrels por módulo:** `@/lib/<mod>` (isomórfico) + `/server` (Node-only) + `/client`
  (hooks). Lint `no-restricted-imports` bloqueia import profundo.
- **`lib/config` é a única porta para `process.env`** — getters lazy, tipados; nada lê
  env direto.
- **Camada de dados:** `src/lib/data/store.ts` roda **100% em memória** (dá para logar e
  testar tudo sem banco). Com `DATABASE_URL`, um adapter Postgres adiciona persistência
  entre restarts (ver `src/lib/data/PERSISTENCE.md`).
- **Auth:** sessões **HMAC-SHA256** (`AUTH_SECRET`), senhas com **scrypt**, gate de owner
  **fail-closed** (sem `AUTH_SECRET` real, login de owner é recusado), `DEMO_MODE` para
  demonstração via API. Ver `ACESSOS.md`.
- **Integrações pré-prontas** (seam real + mock/sandbox rotulado; ativam com credencial):
  Mercado Pago (pagamentos), Memed (receita), ICP-Brasil (assinatura), WhatsApp Cloud,
  Anthropic/Mari (IA), ASR (Whisper/Azure), Resend (e-mail). Ver `.entrega/INTEGRACOES.md`.

### Stack
Next.js 14.2 · React 18 · TypeScript strict · TailwindCSS · next-intl · framer-motion ·
recharts (lazy) · Vitest (unit/rota) · Playwright + @axe-core (E2E/a11y) · k6 (carga).

### Qualidade & CI
GitHub Actions: **quality** (typecheck/test/lint/i18n/audit/build) · **e2e** (Playwright,
sobe/derruba o servidor no runner) · **k6** (carga) · **docker**. ~361 testes unitários,
49 E2E, paridade i18n de 927 chaves.

### Deploy
- **Vercel** (serverless) — `vercel --prod` → `prontus-ai.vercel.app`.
- **Fly.io** (container Docker) — `flyctl deploy` → `auronis-health.fly.dev`. Máquina
  sempre ligada (`auto_stop_machines=off`) para não ter cold-start. Ver `DEPLOY-FLY.md`.
- Deploy é **manual** (não é auto-deploy por git).

---

## 4. Design system — Cores

Estética **premium dark** (linha Tesla / Apple Vision Pro): **prata cromada + turquesa
médica** sobre preto-tinta. Tokens de tema são **variáveis CSS** (tema escuro por padrão,
tema claro disponível); as **rampas de marca são estáticas**. Definições em
`src/app/globals.css` e `tailwind.config.ts`.

### Tokens semânticos (mudam com o tema)
| Token | Uso | Escuro | Claro |
|---|---|---|---|
| `--bg` | fundo da página | `#090B0F` | `#F8FAFC` |
| `--surface` | superfície base | `#12151B` | `#FFFFFF` |
| `--card` | cartões | `#171A21` | `#FFFFFF` |
| `--elevated` | elevado (menus/popovers) | `#1F232D` | `#FFFFFF` |
| `--ink` | texto principal | `#F6F8FA` | `#090D15` |
| `--muted` | texto secundário | `#9CA6B4` | `#525C6B` |
| `--subtle` | texto terciário/discreto | `#808C9A` | `#606C7C` |
| `--line` / `--hairline` | bordas / divisórias finas | grafite | cinza-claro |
| `--ring` | foco / realce | turquesa `#14C8C4` | turquesa |

> **Contraste AA:** `--subtle` foi calibrado para ≥ 4.5:1 em toda superfície escura
> (5.08:1 no `--card`). Texto branco sobre fundo de marca usa `brand-700` (4.54:1), não
> `brand-600`. Ver pendências #9/#13 em `.entrega/PENDENCIAS.md`.

### Rampas de marca (estáticas)
- **Brand — turquesa médica** (primária `#14C8C4`, hover `#00A8A2`):
  `50 #e7fcfb · 100 #c2f6f4 · 200 #8eedea · 300 #52e0dc · 400 #23ccc8 · 500 #14c8c4 ·
  600 #00a8a2 · 700 #0a8480 · 800 #0f6663 · 900 #114f4d · 950 #03302f`
- **Accent — ciano elétrico** (vida/energia): `400 #22d3ee · 500 #06b6d4 · 600 #0891b2 …`
- **Silver — prata cromada** (ícones/detalhes premium): `light #e2e6ec · DEFAULT #c5ccd6 ·
  dark #8a929c`
- **Semânticas:** success `#2ed47a` · warning `#f5a623` · danger `#e5484d` · info `#22d3ee`.

### Tipografia
- **Display:** Sora (`--font-display`) — títulos.
- **Sans:** Inter (`--font-sans`) — corpo.
- **Mono:** JetBrains Mono (`--font-mono`) — números/código.
- Fonte CJK (Noto Sans SC) carrega **só em zh-CN** (`preload:false`).
- Escalas display de `2.5rem` a `6rem` com tracking negativo.

### Texturas & movimento
- **Aurora** (`components/landing/aurora.tsx`): orbes de marca desfocados que derivam e
  reagem ao ponteiro — usado no hero e no painel de login.
- **Gradientes:** `aurora`, `mesh`, `brand-gradient`, `chrome`, `grid`, `shine`.
- **Animações:** `aurora`, `float`, `fade-up/in`, `scale-in`, `shimmer`, `record-pulse`
  (gravação), `eq` (equalizador), `marquee`. **Todas respeitam `prefers-reduced-motion`.**
- **Sombras** em camadas para profundidade sobre o quase-preto; `glow`/`glow-accent` para
  brilho de marca.

---

## 5. O motivo do DNA (assinatura visual)

`components/landing/dna-helix.tsx` — uma **dupla-hélice de DNA viva** desenhada em
`<canvas>`: dois filamentos (turquesa + prata) que giram sozinhos e **viajam conforme o
scroll**, como se você descesse pela molécula. Representa a fusão de **ciência clínica +
inteligência**.

- Renderiza como fundo **fixo** (`fixed inset-0 -z-10`), `aria-hidden`, **atrás** do
  conteúdo. Respeita `prefers-reduced-motion` (frame único, sem loop) e pausa quando a aba
  fica oculta.
- **Presente na landing inteira** e na **tela de login** — um scrim translúcido por cima
  mantém a legibilidade (mais forte perto do hero, mais discreto no conteúdo denso). Ajuste
  de intensidade: o gradiente em `app/[locale]/page.tsx` (`from-bg/50 … to-bg/88`).
- Init dos sprites é blindada (`try/catch`): sendo decorativo, uma falha degrada para
  "sem fundo", nunca derruba a rota.

---

## 6. Como rodar

```bash
npm install
npm run dev            # http://localhost:3000  (roda 100% em memória)
npm run build          # build de produção (standalone)
npm run typecheck      # tsc --noEmit
npm run lint
npm test               # Vitest (unit/rota)
npm run test:e2e       # Playwright (sobe o servidor sozinho)
node scripts/i18n-check.mjs   # paridade dos 4 idiomas
```

Sem variáveis de ambiente o app roda inteiro (store in-memory). Para acessos e segredos
ver **`ACESSOS.md`**; para todas as env vars ver **`.env.example`**; para integrações ver
**`.entrega/INTEGRACOES.md`**.

---

## 7. Mapa de documentos

| Doc | Para quê |
|---|---|
| **`docs/SISTEMA.md`** | **este** — visão canônica do sistema |
| `README.md` | ponto de entrada / start rápido |
| `GETTING-STARTED.md` | setup detalhado |
| `ACESSOS.md` | tipos de acesso e como logar |
| `DEPLOY.md` · `DEPLOY-FLY.md` | deploy (Vercel / Fly) |
| `docs/MARI.md` | a copilota Mari (persona, modelo, permissões) |
| `docs/ARCHITECTURE.md` · `docs/MODULARITY.md` | detalhes de arquitetura/modularidade |
| `.entrega/` | trilha de entrega do pipeline (MAPA, DECISÕES, PENDÊNCIAS, INTEGRAÇÕES, RELATÓRIO-FINAL…) |
