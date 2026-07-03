# Acessos — como logar e testar

> **Os valores das senhas/segredos NÃO ficam aqui** (isto é versionado no git).
> Eles estão: (1) nas env vars de **produção do Vercel** (encriptados) e
> (2) no arquivo local **`.acessos.local.txt`** (gitignored) gerado no deploy.
> Se precisar, `vercel env pull` traz os valores para um `.env.local` local.

**Produção:** https://prontus-ai.vercel.app

## Tipos de acesso

| Tipo | Como entra | Cai em | Credenciais |
|---|---|---|---|
| **Dono (owner)** | tela de login (email + senha) | `/owner` — painel da plataforma (MRR, tenants, planos, feature flags, console da Mari) | `OWNER_EMAIL` / `OWNER_PASSWORD` (env Vercel + `.acessos.local.txt`) |
| **Médico de teste** | tela de login (email + senha) | `/app` — workspace clínico (23 telas, Mari copiloto) | `TEST_DOCTOR_EMAIL` / `TEST_DOCTOR_PASSWORD` |
| **Cadastro real** | `/signup` → "Criar conta grátis" | onboarding → `/app` | cria tenant+usuário reais (você escolhe email/senha) |
| **Demonstração** | atalho via API (sem botão) | `/app` sobre a clínica exemplo | `POST /api/auth/login {"demo":true}` (habilitado por `DEMO_MODE=true`) |

## Notas
- O login de **owner** exige `AUTH_SECRET` no ambiente (fail-closed — sem ele, é
  recusado por segurança). Já configurado na produção do Vercel.
- O app roda **100% com store in-memory** (dá pra logar e testar tudo já). Para
  persistência entre restarts, ligar `DATABASE_URL` (Postgres) — ver `DEPLOY-FLY.md`.
- Integrações reais (Mercado Pago, Memed, ICP, WhatsApp, Mari/Anthropic) ativam ao
  setar as chaves; sem elas, mock/sandbox honesto (ver `INTEGRACOES.md`).
- Todas as env vars possíveis: `.env.example`.
