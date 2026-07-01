# DECISÕES

## 2026-07-01 — FASE 1: entradas públicas por módulo com split de runtime
- Cada módulo de `lib/` expõe barrel `index.ts` (isomórfico) e, quando preciso, `server.ts` (Node-only) / `client.tsx` (hooks React). Motivo: um barrel único puxaria `node:crypto`/SDKs para o client e React para o edge middleware.
- `src/lib/auth.ts` (hooks client) movido para `src/lib/auth/client.tsx` para o diretório `lib/auth/` virar o módulo canônico.
- Import profundo cruzado agora é **erro de lint** (`no-restricted-imports`); testes internos do módulo são isentos.
- `lib/config` é a única porta para `process.env` (getters lazy — testes que mutam env seguem funcionando; `NEXT_PUBLIC_*` com acesso literal para inline no client).
- `.env.example` passou a documentar TODAS as vars (DB, ASR, Memed, ICP, WhatsApp) — antes só existiam em comentários de código.

## 2026-07-01 — Convenção de entrega
- Pipeline de 13 fases (0–12) com portões duros; estado em `.entrega/`.
- Cada fase fecha em feature branch → PR → merge (preferência durável do dono), commit atômico conforme ANEXO C.
- Trabalho em PT-BR.
