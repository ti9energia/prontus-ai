# Deploy — Aureon Health

App Next.js 14 (App Router) pronto para deploy. **Nenhuma variável de ambiente é obrigatória** — roda 100% com dados mock e copiloto em modo simulado. Defina as variáveis abaixo só se quiser ativar recursos reais.

## Variáveis de ambiente
Nenhuma é necessária para **rodar o demo** (tudo mock). Para produção real, defina ao
menos `AUTH_SECRET`. Copie `.env.example` → `.env.local` (local) ou configure no painel do provedor.

| Variável | Para quê | Padrão |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | URL pública e canônica (OG, `sitemap.xml`, `robots.txt`) | `https://aureonhealth.com` |
| `ANTHROPIC_API_KEY` | Ativa a Mari com a Claude API de verdade (só p/ autenticados) | vazio → fallback inteligente |
| `ANTHROPIC_MODEL` | Modelo da Mari quando há chave | `claude-sonnet-4-6` |
| `MARI_API_URL` / `MARI_API_KEY` | Cérebro remoto da Mari (prioridade sobre a Claude local) | vazio |
| `AUTH_SECRET` | Assina as sessões — **obrigatória em produção** (sem ela o login é fail-closed) | vazio |
| `OWNER_EMAIL` / `OWNER_NAME` / `OWNER_PASSWORD_HASH` | Login do dono (super-admin) | `owner@aureonhealth.com` / `Owner` / — |
| `TEST_DOCTOR_EMAIL` / `TEST_DOCTOR_PASSWORD` | Conta de teste (lado médico) | `…@aureonhealth.com` / `aureon-demo` |
| `DEMO_MODE` | Botão "Entrar na demonstração"; `false` desativa em produção | habilitado |

---

## Opção 1 — Vercel (recomendado, zero config)
1. Suba o projeto para um repositório Git (GitHub/GitLab/Bitbucket).
2. Em **vercel.com → New Project**, importe o repo. A Vercel detecta Next.js automaticamente.
3. (Opcional) Adicione as variáveis de ambiente em *Settings → Environment Variables*.
4. **Deploy**. Pronto.

Ou via CLI:
```bash
npm i -g vercel
vercel            # preview
vercel --prod     # produção
```
`vercel.json` já define a região **gru1 (São Paulo)** para baixa latência no Brasil.

---

## Opção 2 — Docker (qualquer host Node: AWS ECS, Fly.io, Render…)
O `next.config.mjs` usa `output: 'standalone'`, então a imagem fica pequena (~120 MB).

```bash
docker build -t aureon-health .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SITE_URL=https://seu-dominio.com \
  -e AUTH_SECRET=troque-por-uma-string-longa-e-aleatoria \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  aureon-health
```
Acesse http://localhost:3000. Health check em `GET /api/health`.

> **Fly.io / Render:** os manifestos (`fly.toml`, `render.yaml`) foram **parqueados** em
> `deploy/_inactive/` para evitar deploy acidental (o `render.yaml` tinha `autoDeploy: true`
> em região errada). Para usar um, mova o arquivo de volta à raiz e revise região (São Paulo,
> não Oregon), `autoDeploy` e as variáveis de ambiente. Veja `deploy/_inactive/README.md`.

---

## Opção 3 — Node host tradicional
```bash
npm ci
npm run build
npm run start          # serve na porta 3000 (ou defina PORT)
```

---

## Checklist de produção
- [x] Build de produção passando (`npm run build`) — 4 idiomas, 20 rotas.
- [x] Next 14.2.35 (correção de segurança aplicada).
- [x] `output: standalone` + Dockerfile multi-stage não-root.
- [x] Headers de segurança + **Content-Security-Policy** (`next.config.mjs`).
- [x] Observabilidade: `src/instrumentation.ts` (log estruturado de crashes) + `/api/health` com readiness.
- [x] `robots.txt` + `sitemap.xml` + PWA (`manifest.webmanifest` + service worker).
- [x] `maxDuration` nas rotas de LLM (evita 504 em respostas lentas).
- [x] Sem segredos/PII no código; tudo via env. Demo atrás de `DEMO_MODE`.
- [ ] **Definir `AUTH_SECRET` em produção** (senão o login do dono fica desabilitado).
- [ ] Pós-deploy: `npm run security:scan <url-real>` apontando para o host publicado.

## Notas
- Dados em memória reiniciam a cada deploy/instância (é um demo). Para persistência real, troque `src/lib/data/store.ts` por Postgres/Prisma — a UI não muda.
- O service worker só registra em produção (`NODE_ENV=production`).
