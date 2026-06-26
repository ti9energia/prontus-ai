# Auronis Health — Public REST API (`/api/v1`)

A small, read-mostly REST surface over the application's server-side store.

## Authentication

Every endpoint requires an API key, sent as either header:

```
Authorization: Bearer sk_live_xxx
x-api-key: sk_live_xxx
```

Demo-grade: any token starting with `sk_` is accepted. In production this must be
validated against stored, **hashed** keys scoped to a tenant
(see `src/lib/api/auth.ts`).

Missing/invalid keys return `401`:

```json
{ "error": { "code": "unauthorized", "message": "Missing or invalid API key. ..." } }
```

## Envelopes

- Success: `{ "data": <payload> }`
- Error: `{ "error": { "code": "...", "message": "..." } }`

Status codes: `200` ok, `201` created, `400` invalid body, `401` unauthorized,
`404` not found, `405` method not allowed (returned automatically by Next for
unsupported verbs).

## Endpoints

| Method | Path                     | Description                                  |
| ------ | ------------------------ | -------------------------------------------- |
| GET    | `/api/v1/patients`       | List patients.                               |
| POST   | `/api/v1/patients`       | Create a patient. Body: `{ name, payer }`.   |
| GET    | `/api/v1/patients/:id`   | Get one patient (`404` if unknown).          |
| GET    | `/api/v1/encounters`     | List encounters.                             |
| GET    | `/api/v1/guides`         | List TISS guides.                            |
| GET    | `/api/v1/guides/:id`     | Get one TISS guide (`404` if unknown).       |
| GET    | `/api/v1/stats`          | Billing + business summary rollup.           |

### Example

```bash
curl https://prontus-ai.vercel.app/api/v1/patients \
  -H "Authorization: Bearer sk_live_demo"

curl -X POST https://prontus-ai.vercel.app/api/v1/patients \
  -H "Authorization: Bearer sk_live_demo" \
  -H "Content-Type: application/json" \
  -d '{ "name": "Marina Albuquerque", "payer": "Unimed" }'
```

## Data persistence

Data is backed by the **in-memory store** (`src/lib/data/store.ts`), persisted on
`globalThis` for the lifetime of the server runtime. Writes (e.g. creating a
patient) survive within a running instance but reset on cold start / redeploy and
are **not** shared across serverless instances. Production needs a provisioned
Postgres (Neon / Supabase) behind this same repository layer.
