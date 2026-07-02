# FASE 9 — Auditoria de eficiência de servidor & requisições — 2026-07-02

Auditoria honesta: o que foi verificado, o que já estava enxuto (sem inventar
otimização — "sem teatro"), e as 2 melhorias reais aplicadas.

## Corrigido (melhorias reais, com prova)

### 1. Listas da API v1 sem paginação → paginação por offset
**Antes:** `GET /api/v1/patients`, `/api/v1/encounters` e `/api/v1/guides`
retornavam a coleção INTEIRA (`return json(listPatients())` etc.) — tamanho de
resposta e trabalho do servidor cresciam sem limite com os dados. Para uma API
REST pública, isso é falta de item básico.
**Depois:** helper compartilhado `paginate()`/`jsonPage()` (`src/lib/api/pagination.ts`),
`?limit=&offset=` com default 50 / máximo 200, envelope retrocompatível
(`{ data: [...], pagination: { limit, offset, total, hasMore } }` — leitores
existentes de `data` seguem funcionando, agora recebendo a 1ª página).
**Prova:** `src/lib/api/__tests__/pagination.test.ts` (8 testes: default, limit/
offset explícitos, clamp no máximo, params inválidos → default, hasMore,
offset além do fim, coleção vazia) + `src/app/api/v1/patients/__tests__/route.test.ts`
(4 testes: 401 sem chave, envelope paginado, limite respeitado, offset caminha).

### 2. Polling do checkout sem limite superior → capado + re-checagem manual
**Antes:** `checkout-flow.tsx` fazia `setInterval` a cada 2,5s enquanto pendente,
SEM teto — uma aba de checkout pendente abandonada fazia ping no
`/api/checkout/session/:id` para sempre.
**Depois:** cap de `MAX_POLLS = 48` (~2min a 2,5s — cobre o settle de ~8s do
sandbox e uma confirmação real de PIX típica). Ao atingir o teto, para o poll
automático e mostra "Ainda processando… / Verificar novamente" (fetch único +
retoma o poll capado). Reduz requisições desperdiçadas de abas abandonadas.
**Prova:** typecheck ✅ (o `waitingIndicator` compartilhado cobre PIX e boleto);
novas chaves i18n `checkout.stillProcessing`/`checkout.recheck` nos 4 catálogos
(929 chaves, paridade ✅).

## Auditado e já enxuto (nenhuma mudança — documentar, não inventar)

- **Fetch de sessão (`useSession`)**: `SessionProvider` já compartilha UM fetch
  de `/api/auth/session` por carga de `/app` e `/owner` (verificado:
  `app/[locale]/{app,owner}/page.tsx` envolvem em `<SessionProvider>`). Os
  demais chamadores (login/signup) usam o fallback de um fetch. Sem chattiness.
- **Middleware**: o `matcher` exclui `api`, `_next`, `_vercel` e arquivos com
  extensão — `verifySession` (HMAC) NÃO roda em assets estáticos, só nas rotas
  protegidas onde é necessário. Eficiente.
- **"N+1" no store**: `ownerInsights()` faz 4 `.filter()` + 1 sort sobre
  `tenants`; as listas usam `.filter()`/`.find()` O(n). Sobre o dataset
  in-memory de dezenas de registros isso é microssegundos — indexar seria
  otimização prematura de um caminho que nunca verá escala (o caminho real de
  produção é o adapter Postgres, onde viram queries SQL). Deixado como está de
  propósito.
- **Telas do workspace**: leem o store hidratado no cliente (sem fetch por
  tela) — sem waterfalls de requisição.
- **Compressão**: `next.config` usa o default `compress: true` (gzip on).
- **Cache de assets estáticos**: `/_next/static/*` recebe
  `Cache-Control: immutable` automático do Next. Rotas de API dinâmicas
  (`dynamic = 'force-dynamic'`) não são cacheadas pelo Next.

## Revalidação sob carga (k6) — números reais (run 28627265952)
Disparei o workflow k6 na branch da FASE 9 (`workflow_dispatch`). Verde — a
paginação não regride, na verdade melhorou levemente (menos dados por resposta):

| cenário | p95 (FASE 8) | p95 (FASE 9, paginado) | erros |
|---|---|---|---|
| smoke | 15.26ms | **14.19ms** | 0% (0/120) |
| load  | 8.5ms   | **8.11ms**  | 0% (0/5008) |
| spike | 383.69ms| **332.87ms**| 0% (0/10072) |

checks 100% em todos (210 / 8764 / 20144). Confirma que trocar "coleção inteira"
por "página de até 200" não custa latência e reduz `data_received` por chamada.

## Prova local
typecheck ✅ · lint ✅ · 361 testes vitest ✅ (+12 novos) · i18n 929 chaves,
paridade nos 4 catálogos ✅
