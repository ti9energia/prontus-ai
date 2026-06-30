# Persistência de dados — Auronis Health

O repositório de dados vive em `src/lib/data/store.ts` (`db()` → `globalThis.__auronis__`).
O ponto de troca único é **`src/lib/data/index.ts`** — todo o código de app importa de `@/lib/data`
e nunca de `@/lib/data/store` diretamente.

## 1. Client-side (ativa, sem configuração) — localStorage

No navegador, o store é hidratado de `localStorage` na primeira leitura (`hydrate()`) e
salvo automaticamente (`persist()`):

- snapshot completo sob a chave `auronis:store:v1`;
- auto-save a cada **4 s**, em `beforeunload` e quando a aba fica oculta;
- `resetStore()` limpa o snapshot e volta ao seed.

Isso dá **persistência real entre reloads** no mesmo navegador, sem banco. No servidor
(API routes / RSC) não há `localStorage`, então cai no seed em memória por runtime.

## 2. Server-side (produção, multi-dispositivo) — Postgres (Block 10) ✅

O adapter completo já está em `src/lib/data/postgres.ts` (write-through cache sobre Prisma).
O `index.ts` ativa-o automaticamente quando `DATABASE_URL` está presente.

**Para ativar (ações do dono):**

1. Provisione o banco: **Neon** ou **Supabase** via Vercel Marketplace.
   (Vercel Postgres/KV foram descontinuados — use os marketplaces.)
2. Copie a connection string e defina `DATABASE_URL`:
   - Local: `DATABASE_URL="postgresql://..."` em `.env.local`
   - Produção: *Project → Settings → Environment Variables* no painel Vercel.
3. Instale e gere o cliente Prisma (já incluído no package.json desde B10):
   ```bash
   npm install              # instala prisma, @prisma/client, tsx
   npm run db:generate      # gera o PrismaClient tipado
   npm run db:migrate       # cria as tabelas
   npm run db:seed          # popula o banco com dados de demonstração
   ```
4. Deploy: `vercel --prod` (o app detecta `DATABASE_URL` e usa o adapter Postgres).

**Sem `DATABASE_URL`:** o app continua 100% funcional via in-memory + localStorage —
comportamento idêntico ao de antes do B10.

## 3. Arquitetura do adapter (para desenvolvedores)

```
src/lib/data/
  index.ts       ← ÚNICO ponto de troca (importar daqui sempre)
  store.ts       ← in-memory + localStorage (sempre disponível, sem deps)
  postgres.ts    ← write-through cache sobre Prisma (carregado só com DATABASE_URL)
  PERSISTENCE.md ← este arquivo
  __tests__/     ← testes de contrato (importam de ./store diretamente — ok)

prisma/
  schema.prisma  ← 12 modelos relacionais (Tenant, User, Patient, Encounter, ...)
  seed.ts        ← seed idempotente espelhando os dados de demonstração do store
```

### Padrão write-through

- **Leituras** (`listPatients`, `getEncounter`, etc.): síncronas, do cache `globalThis.__auronis__`.
  Após a hidratação inicial do Postgres, o cache reflete os dados do banco.
- **Escritas** (`addPatient`, `approveNote`, etc.): síncronas no cache + fire-and-forget assíncrono
  para o Postgres. Nunca bloqueiam a resposta ao usuário.
- **Hidratação**: triggered na primeira chamada `db()` em contexto servidor (sem `window`).
  Popula `globalThis.__auronis__` com todos os dados do banco.

### Segurança

- Segredos de connector (`ConnectorSecret.config`) e hashes de senha (`User.passwordHash`)
  vivem **somente no banco**, nunca no snapshot localStorage.
- `pgFire()` engole erros de escrita (loga, não joga exceção) — o usuário nunca vê erro
  de banco em operações de UI; as escritas falhas são registradas no log do servidor.

## 4. Schema Prisma (12 modelos)

`Tenant · User · Plan · Subscription · FeatureFlag · Patient · Encounter · ClinicalNote
TissGuide · Template · AuditLog · ConnectorSecret`

Provider: `postgresql` — URL via `env("DATABASE_URL")`.
