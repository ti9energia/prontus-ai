# Alvos de deploy parqueados

A produção do Auronis Health roda em **duas frentes ativas**: **Vercel** (manual: `vercel --prod`,
região `gru1`) e **Fly.io** (`flyctl deploy` → `auronis-health.fly.dev`) — o `fly.toml` **ativo**
fica na **raiz** do repo (ver [`DEPLOY-FLY.md`](../../DEPLOY-FLY.md)). O `Dockerfile` na raiz é
mantido para portabilidade / auto-hospedagem em qualquer host Node.

Esta pasta guarda manifestos **alternativos/inativos**, para não serem detectados nem ativados
por acidente:

- `render.yaml` — **Render (parqueado).** Estava na raiz com `autoDeploy: true` e região `oregon`,
  o que criaria uma segunda produção em região errada a cada push. Para reativar, mova o arquivo de
  volta à raiz e **antes** revise: região (`gru`/São Paulo, não `oregon`), `autoDeploy` e as
  variáveis de ambiente (`AUTH_SECRET`, `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SITE_URL`).
- `fly.toml` — **cópia histórica.** O Fly.io agora é uma frente ativa cujo `fly.toml` canônico está
  na **raiz** do repo. Esta cópia é mantida só como referência e **não deve ser usada** (o manifesto
  válido é o da raiz).
