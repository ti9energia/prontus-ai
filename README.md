# Auronis Health

**Escriba clínico de IA.** O médico atende; a **Mari** (copiloto de IA) ouve a consulta e
devolve o **prontuário estruturado** e a **guia TISS** prontos para revisão e assinatura —
recuperando horas de documentação e reduzindo glosa.

> App Next.js 14 (App Router), TypeScript estrito, 4 idiomas, PWA. Front e back são **o
> mesmo app**. Roda **100% em memória** sem nenhuma variável de ambiente.

**Produção:** [prontus-ai.vercel.app](https://prontus-ai.vercel.app) · Espelho Fly:
[auronis-health.fly.dev](https://auronis-health.fly.dev)

```
fala da consulta → transcrição (ASR) → Mari estrutura → prontuário + guia TISS
                                                       → revisão → assinatura (ICP) → convênio
```

---

## Início rápido

```bash
npm install
npm run dev          # http://localhost:3000  (sem env vars: store 100% em memória)
```

| Comando | O quê |
|---|---|
| `npm run build` | build de produção (standalone) |
| `npm run typecheck` · `npm run lint` | tipos · lint |
| `npm test` | Vitest (unit/rota) |
| `npm run test:e2e` | Playwright (sobe o servidor sozinho) |
| `node scripts/i18n-check.mjs` | paridade dos 4 idiomas |

Para logar e testar (owner / médico / cadastro / demo) → **[`ACESSOS.md`](ACESSOS.md)**.

---

## O que tem dentro

- **Landing** (4 idiomas) com calculadora de ROI/glosa, preços, FAQ, legal — fundo vivo de **DNA**.
- **Workspace clínico** (`/app`) — 23 telas: consulta/gravação, prontuário, guias TISS,
  pacientes, exames, receituário, assinatura, agente, automações, configurações…
- **Painel do dono** (`/owner`) — MRR, tenants, planos, feature flags, console da Mari.
- **Checkout** PIX/boleto/cartão (Mercado Pago + sandbox), **API pública v1** paginada, **PWA**.

## Pronto vs pré-pronto (honesto)

| Camada | Estado |
|---|---|
| Front, auth (HMAC/scrypt), API v1, PWA, CI | **Pronto** |
| Pagamentos, ASR, Memed, ICP, WhatsApp, Mari/Claude, Postgres | **Pré-pronto** — seam real + mock/sandbox; ativa com credencial |
| Persistência entre restarts | precisa `DATABASE_URL` (sem ele, store in-memory) |

Nenhuma integração finge estar viva sem credencial. Detalhe em [`.entrega/INTEGRACOES.md`](.entrega/INTEGRACOES.md).

---

## Deploy

- **Vercel** (produção): `vercel --prod` → `prontus-ai.vercel.app`
- **Fly.io** (container): `flyctl deploy` → `auronis-health.fly.dev` (ver [`DEPLOY-FLY.md`](DEPLOY-FLY.md))
- Deploy é **manual** (não é auto-deploy por git). Variáveis: [`DEPLOY.md`](DEPLOY.md) · [`.env.example`](.env.example)

---

## Documentação

| Doc | Para quê |
|---|---|
| **[`docs/SISTEMA.md`](docs/SISTEMA.md)** | **visão canônica** — o que é, arquitetura, **cores/design**, o motivo do DNA |
| [`GETTING-STARTED.md`](GETTING-STARTED.md) | setup detalhado + tour |
| [`ACESSOS.md`](ACESSOS.md) | tipos de acesso e como logar |
| [`docs/MARI.md`](docs/MARI.md) · [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · [`docs/MODULARITY.md`](docs/MODULARITY.md) | Mari · arquitetura · modularidade |
| [`.entrega/`](.entrega/) | trilha de entrega do pipeline (MAPA, DECISÕES, PENDÊNCIAS, RELATÓRIO-FINAL…) |
