# Alvos de deploy inativos (parqueados)

O deploy de produção do Auronis Health é a **Vercel** (manual: `vercel --prod`, região `gru1`).
O `Dockerfile` na raiz é mantido para portabilidade / auto-hospedagem em qualquer host Node.

Estes manifestos foram **parqueados** aqui para não serem detectados/ativados acidentalmente
(ex.: o `render.yaml` tinha `autoDeploy: true` na raiz, o que criaria uma segunda produção a
cada push, em região errada). Para reativar um deles, mova o arquivo de volta à raiz do repo e
**antes** revise: região (`gru`/São Paulo, não `oregon`), `autoDeploy`, e as variáveis de
ambiente (`AUTH_SECRET`, `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SITE_URL`).

- `fly.toml` — Fly.io (região `gru`)
- `render.yaml` — Render (atenção: estava com `autoDeploy: true` e região `oregon`)
