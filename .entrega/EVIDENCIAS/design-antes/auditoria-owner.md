# Auditoria "antes" — Painel do Dono (FASE 2, 2026-07-01)

> Evidência por análise de código (sem servidor, diretiva do dono). Veredito: camada visual coesa
> (tokens, primitivos ui/, Modal com foco-trap real), mas painel largamente **funcional-de-mentira**
> — maioria das seções muta useState local sem persistir no store, sem auditar, sem confirmar destrutivas.

## P0
1. **Destrutivas sem confirmação; não existe ConfirmDialog no projeto.** Suspender/reativar tenant (`sections.tsx:256-258` → `toggleStatus :197-200`) e **impersonar** (`:248-255`, maior privilégio do painel) rodam com 1 clique, sem registro de audit.
2. **Estado que não persiste** (funcional-de-mentira), por seção:
   - Tenants: `addTenant`/`toggleStatus` em useState local (`:167,173-200`); store tem `setTenantStatus` c/ persist+audit (`store.ts:1047`) — ignorado; `addTenant` não existe no store.
   - Plans: save/openAdd só useState (`:318-355`); sem `upsertPlan` no store.
   - Access: matriz base `boolean[]` hardcoded (`:922-929`); roles custom evaporam no reload (`:931,938-946`); sem editar/excluir role.
   - WhatsApp: toggles de comandos e templates são estado local/estático (`:849,851-854`); `save` ignora os toggles (`:838-841`) → **toast mente**.
   - Só **Flags** e **AI** persistem de verdade (2 de 8 seções configuráveis).
3. **Landing CMS mock:** publish = toast (`:531`); title semeado com placeholder `${sec} · ${loc}` (`:510`); useEffect reseta os campos ao trocar seção/locale → **perde o que digitou** (`:516-520`); badges published/draft hardcoded (`:547`). Para ser real: modelo (section, locale) draft/published no store + get/save/publish + dirty guard + preview do bloco real.
4. **4 estados quase inexistentes:** tabelas com tbody vazio sem empty-state; único async (chat Mari) engole erro em `'…'` (`mari-console.tsx:176-178`); `ScreenSkeleton` nunca importado no owner.

## P1
5. i18n com 3 sistemas: useTranslations + helper `L()` redefinido 3× (`sections.tsx:62`, `mari-console.tsx:137`, `owner/chat/route.ts:39`) + hardcoded (AiSection `:696,719,777,785,804-810`; WhatsApp `:843-854`; Access `:922-929`; Audit `:1071-1076`; modais `:270-276,417-423,1004-1010`).
6. Recharts sem a11y/fallback textual (`sections.tsx:95-114`); `mrrSeries()` **estática hardcoded** (`store.ts:982-986`) pode contradizer o KPI MRR real (`:970`).
7. Cores mágicas: `#0d9488` no gráfico (`:100-111`), tooltip `rgb(16 22 33)`/`#fff` fixo → escuro no tema claro; hue de avatar duplicado (`:138,226`); defaults de IA duplicados do store (`:671-677` vs `store.ts:1065-1070`).
8. Tabelas largas sem 1ª coluna sticky (matriz de acessos, tenants 7 col, audit 6 col) — ilegível no mobile (`_kit.tsx:128`).
9. A11y: deny da matriz em `text-subtle/50` (`:982,991`) — contraste reprovável, sem aria-label; Switch de flag com aria-label de chave crua (`:647`); `<label>` embrulhando `<button role="switch">` não associa (`:876-893,789-796`).
10. Feedback: toggleFlag silencioso (`:643-646`).

## P2
11. Overview: 6 StatCards planos, só MRR tem gráfico; tons arbitrários (churn sempre warning); sem drill-down.
12. Headers inconsistentes (overview/tenants sem subtitle; `_kit.tsx:41`).
13. Tenants/Audit sem busca/filtro/ordenação/paginação; `plan.modules.slice(0,7)` trunca sem "+N" (`:383`).
14. Preview da landing e palco Mari centralizados com muito chrome p/ pouco dado; card "Mari" decorativo (`:799-812`).
15. `ImpersonationBanner` com `<button>` cru (`owner-panel.tsx:76-81`); `impersonating` guarda nome, não id (`context.tsx:6`); modo reunião liga mic sem tratamento de negação (`mari-console.tsx:198-205`).

## Pontos fortes (honestos)
Modal com foco-trap/Escape/restauração (`overlay.tsx:15-63`); Switch com role/aria-checked (`misc.tsx:72-74`); sombras contidas (smell "sombra exagerada" NÃO ocorre); chat com loading/greeting decentes.
