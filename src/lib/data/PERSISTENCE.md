# Persistência de dados — Auronis Health

O repositório de dados vive em `src/lib/data/store.ts` (`db()` → `globalThis.__auronis__`).
Há **duas camadas** de persistência:

## 1. Client-side (ativa, sem configuração) — localStorage

No navegador, o store é hidratado de `localStorage` na primeira leitura (`hydrate()`) e
salvo automaticamente (`persist()`):

- snapshot completo sob a chave `auronis:store:v1`;
- auto-save a cada **4 s**, em `beforeunload` e quando a aba fica oculta;
- `resetStore()` limpa o snapshot e volta ao seed.

Isso dá **persistência real entre reloads** no mesmo navegador, sem banco. No servidor
(API routes / RSC) não há `localStorage`, então cai no seed em memória por runtime.

## 2. Server-side (produção, multi-device) — Postgres

Para dados compartilhados entre dispositivos/usuários, ligue um Postgres gerenciado
(**Neon** ou **Supabase** via Vercel Marketplace — Vercel Postgres/KV foram descontinuados).

### Passo a passo
1. Provisione o banco e copie a connection string.
2. Defina `DATABASE_URL` nas variáveis de ambiente (local em `.env.local`, na Vercel em
   *Project → Settings → Environment Variables*).
3. Instale o cliente: `npm i @vercel/postgres` (ou `pg`).
4. Implemente o adapter abaixo e chame `loadSnapshot()` na inicialização do `db()`
   server-side e `saveSnapshot()` após mutações nas rotas `/api/v1/*`.

### Esqueleto do adapter (`src/lib/data/db-postgres.ts`)
```ts
import { sql } from '@vercel/postgres'; // npm i @vercel/postgres
import type { DB } from './store';

const ENABLED = !!process.env.DATABASE_URL;

export async function ensureTable() {
  if (!ENABLED) return;
  await sql`CREATE TABLE IF NOT EXISTS auronis_snapshot (
    id text PRIMARY KEY, data jsonb NOT NULL, updated_at timestamptz DEFAULT now()
  )`;
}

export async function loadSnapshot(): Promise<DB | null> {
  if (!ENABLED) return null;
  await ensureTable();
  const { rows } = await sql`SELECT data FROM auronis_snapshot WHERE id = 'main'`;
  return rows[0]?.data ?? null;
}

export async function saveSnapshot(data: DB): Promise<void> {
  if (!ENABLED) return;
  await ensureTable();
  await sql`INSERT INTO auronis_snapshot (id, data) VALUES ('main', ${JSON.stringify(data)}::jsonb)
            ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`;
}
```

> O snapshot JSON é o caminho mais rápido para persistência real. Para um schema
> relacional por entidade (consultas, guias, pacientes…) — necessário para queries e
> escala — migre o repositório para Drizzle/Prisma sobre o mesmo `DATABASE_URL`. As
> rotas `/api/v1/*` já expõem o contrato; é o ponto natural para essa evolução.
