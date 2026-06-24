# Deploy — Prontus.ai

App Next.js 14 (App Router) pronto para deploy. **Nenhuma variável de ambiente é obrigatória** — roda 100% com dados mock e copiloto em modo simulado. Defina as variáveis abaixo só se quiser ativar recursos reais.

## Variáveis de ambiente (todas opcionais)
| Variável | Para quê | Padrão |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | URL pública (OG, `sitemap.xml`, `robots.txt`) | `https://prontus.ai` |
| `ANTHROPIC_API_KEY` | Ativa o copiloto Mari com a Claude API de verdade | vazio → fallback inteligente |
| `ANTHROPIC_MODEL` | Modelo do copiloto quando há chave | `claude-sonnet-4-6` |

Copie `.env.example` → `.env.local` (local) ou configure no painel do provedor.

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

## Opção 2 — Docker (Fly.io, Render, AWS ECS, qualquer host)
O `next.config.mjs` usa `output: 'standalone'`, então a imagem fica pequena (~120 MB).

```bash
docker build -t prontus-ai .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SITE_URL=https://seu-dominio.com \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  prontus-ai
```
Acesse http://localhost:3000. Health check em `GET /api/health`.

### Fly.io
```bash
fly launch --no-deploy   # detecta o Dockerfile
fly secrets set ANTHROPIC_API_KEY=sk-ant-...   # opcional
fly deploy
```

### Render
- New → **Web Service** → conecte o repo → Environment: **Docker**.
- Health Check Path: `/api/health`. Adicione variáveis se quiser.

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
- [x] Headers de segurança (`next.config.mjs`).
- [x] `robots.txt` + `sitemap.xml` + PWA (`manifest.webmanifest` + service worker).
- [x] Health check `/api/health`.
- [x] Sem segredos no código; tudo via env.

## Notas
- Dados em memória reiniciam a cada deploy/instância (é um demo). Para persistência real, troque `src/lib/data/store.ts` por Postgres/Prisma — a UI não muda.
- O service worker só registra em produção (`NODE_ENV=production`).
