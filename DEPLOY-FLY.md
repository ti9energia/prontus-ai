# Deploy no Fly.io — runbook

O Auronis é um app Next.js único (front + API). O `fly.toml` + `Dockerfile` do
repo sobem o app inteiro como container. Isto aqui precisa da SUA autenticação
(login interativo no browser) + uma conta Fly com cartão — por isso não dá para
eu executar sozinho; siga os passos abaixo (ou me passe um token e eu rodo).

## 0. Instalar o flyctl (uma vez)
```powershell
# Windows (PowerShell):
iwr https://fly.io/install.ps1 -useb | iex
# depois abra um terminal novo, ou:  $env:Path += ";$env:USERPROFILE\.fly\bin"
```
```bash
# macOS/Linux:  curl -L https://fly.io/install.sh | sh
```
Login (abre o browser):
```bash
fly auth login
```

---

## Opção A — App no Vercel + **só o Postgres** no Fly (recomendado)
O app já está no Vercel; aqui você só cria o banco no Fly e liga no Vercel.
```bash
# cria um Postgres gerenciado no Fly (região São Paulo)
fly postgres create --name auronis-db --region gru

# ele imprime a DATABASE_URL. Ligue no Vercel (produção):
#   vercel env add DATABASE_URL production   (cole a connection string)
# depois rode a migração e redeploy:
#   npm run db:generate && npm run db:migrate
#   vercel --prod
```
> Sem `DATABASE_URL`, o app roda 100% com o store in-memory (dá pra logar e
> testar tudo já). O Postgres só adiciona persistência entre restarts.

---

## Opção B — App **inteiro** no Fly (container Docker)
```bash
# 1. cria o app (ou ajuste o nome em fly.toml se 'auronis-health' já existir)
fly apps create auronis-health   # ou: fly launch --no-deploy --copy-config

# 2. define os segredos/credenciais (MESMOS valores do Vercel — veja o chat
#    onde te passei, ou o arquivo local .acessos.local.txt gitignored):
fly secrets set \
  AUTH_SECRET="<cole>" \
  OWNER_EMAIL="owner@auronishealth.com" \
  OWNER_NAME="Owner Auronis" \
  OWNER_PASSWORD="<cole>" \
  TEST_DOCTOR_EMAIL="mariana@auronishealth.com" \
  TEST_DOCTOR_PASSWORD="<cole>" \
  DEMO_MODE="true" \
  NEXT_PUBLIC_SITE_URL="https://auronis-health.fly.dev"

# 3. (opcional) Postgres no mesmo Fly:
fly postgres create --name auronis-db --region gru
fly postgres attach auronis-db   # seta DATABASE_URL como secret automaticamente

# 4. deploy (usa o Dockerfile via fly.toml):
fly deploy

# 5. verificar:
fly open /api/health
```

---

## Notas
- `NEXT_PUBLIC_SITE_URL` é inlinado no build — se mudar o domínio, redeploie.
- O `fly.toml` usa `auto_stop_machines` (economiza custo — a máquina hiberna sem
  tráfego e acorda no 1º request; o 1º hit fica ~1-2s mais lento).
- Health check em `/api/health` (sempre 200; ver `src/app/api/health/route.ts`).
- Integrações reais (Mercado Pago, Memed, ICP, WhatsApp, Mari/Anthropic) ativam
  ao setar as chaves via `fly secrets set` — sem elas, mock/sandbox honesto.
