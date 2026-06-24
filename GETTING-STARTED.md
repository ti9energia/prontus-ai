# Prontus.ai — Aplicação (guia de execução)

Escriba clínico de IA: da fala da consulta ao **prontuário estruturado** e à **guia TISS** — sem digitar.
Esta é a implementação **full-stack, premium e executável** das specs deste repositório (`00`, `0A`–`0D`, `02-Prontus-ai`).

> **Stack:** Next.js 14 (App Router) · React 18 · TypeScript · Tailwind · next-intl (4 idiomas) · Recharts · Framer Motion · Claude API (opcional).

---

## 🚀 Como rodar

```bash
npm install        # já instalado
npm run dev        # desenvolvimento  → http://localhost:3000
# ou
npm run build && npm run start   # produção
```

Abra **http://localhost:3000** — você cai na landing (`/pt-BR`). Troque o idioma no topo a qualquer momento.

### Login (demo)
Clique em **Entrar** ou **Testar grátis** → na tela de login clique em **Entrar** (campos já preenchidos) ou **Entrar na demonstração**. Não há backend de senha: é um gate de demonstração (flag local). Para sair, use o menu do avatar → Sair.

---

## 🧭 O que explorar

- **Landing premium** (`/pt-BR`): hero com consulta acontecendo ao vivo, aurora reativa ao mouse, stats com contagem, bento de recursos, pricing mensal/anual, FAQ, depoimentos — tudo nos 4 idiomas.
- **Workspace com abas estilo navegador** (`/pt-BR/app`):
  - Abas (abrir, fechar, trocar) + **dividir a tela** (botão ⫶ "dividir") em até **3 painéis** lado a lado.
  - **⌘K / Ctrl+K** → paleta de comandos (navegar + ações rápidas).
  - **⌘J / Ctrl+J** ou o botão **Mari** → copiloto de IA em toda tela.
  - Barra lateral de ícones para abrir qualquer módulo como aba.
- **Fluxo clínico ponta a ponta:** Agenda → **Consulta ao vivo** (consentimento → gravação simulada → transcrição em streaming → nota se montando) → **Revisão da nota** (editar/aprovar) → **Guia TISS** (validação pré-glosa → enviar) → **Faturamento & glosas** (gráficos).
- **Demais telas:** Pacientes, Modelos por especialidade, Integrações, Configurações, **Agente autônomo** (recomendações), **WhatsApp** (simulação de chat com a Mari).
- **Painel do Dono** (`/pt-BR/owner` ou ícone 👑): visão geral (MRR), organizações + impersonação, planos & entitlements, **editor de landing (CMS 4 idiomas)**, feature flags, IA & Agente, WhatsApp, acessos (matriz) e auditoria.
- **PWA:** instalável (manifest + service worker), responsivo, tema claro/escuro.

---

## 🌍 4 idiomas (i18n desde o dia 1)
`pt-BR` (fonte) · `en` · `zh-CN` · `fr-FR`. Rotas com prefixo de locale, troca preserva a rota, datas/números/moeda via `Intl`, e o **copiloto responde no idioma do usuário**. Catálogos em `messages/*.json`.

---

## 🤖 Copiloto (Mari)
- **Sem chave de API:** responde com um fallback que **lê os dados reais** do app (ex.: "sua taxa de glosa é 37,5%…").
- **Com chave:** usa a Claude API de verdade. Copie `.env.example` → `.env.local` e defina `ANTHROPIC_API_KEY` (e opcionalmente `ANTHROPIC_MODEL`).
- Endpoint: `POST /api/ai/chat`.

---

## 🏗️ Arquitetura (resumo)

```
src/
├─ app/[locale]/         landing · login · app (workspace) · owner   + /api/ai/chat + manifest
├─ components/
│  ├─ landing/           hero, seções, pricing, faq, aurora…
│  ├─ workspace/         abas + split + rail + ⌘K + copilot (registry modular de telas)
│  ├─ screens/           as 11 telas do produto (cada "aba" = um módulo — ver 0D)
│  ├─ owner/             painel do dono (0C) + 9 seções
│  └─ ui/                design system (button, card, badge, input, overlay…)
├─ i18n/                 routing + request (next-intl)
├─ lib/
│  ├─ data/store.ts      "back end" em memória (repositórios + seed + auditoria)
│  ├─ workspace/store.ts gerenciador de abas/painéis (split)
│  └─ types.ts utils.ts hooks.ts auth.ts
└─ messages/             pt-BR · en · zh-CN · fr-FR
```

**Modular (0D):** cada tela é registrada em `components/workspace/registry.tsx` (ícone, título, lazy-load) — ligar/desligar é trivial.
**Design system:** tokens em `tailwind.config.ts` + `globals.css` (tema claro/escuro, aurora, grão, sombras refinadas).

---

## ⚠️ O que é real x simulado
Por pedido ("foco em codar e performar, sem pesar"), o app é **leve e mockado**: dados em memória (`src/lib/data/store.ts`), captura de áudio/ASR **simulada**, TISS/WhatsApp/integrações **demonstrativos**. A estrutura (telas, funções, API, contratos, RBAC, i18n) está toda codada e pronta para plugar serviços reais (Postgres/Prisma, ASR, Meta WhatsApp, gateways) trocando a camada de dados — sem mexer na UI.
```
