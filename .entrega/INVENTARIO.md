# INVENTÁRIO — todo elemento interativo (FASE 4)

**Data:** 2026-07-02 · **Legenda:** ✅ ligado e correto · ⚠️ parcial (justificativa abaixo) · ❌ stub — **zero ❌ neste inventário**.

## Metodologia da prova

O dono pediu foco 100% em código nesta rodada ("não precisa subir porta nem nada"), então a prova aqui é **por execução de código**, não por clique em navegador:
- **(store-test)** — vitest exercitando a função real do store/lib (execução, não leitura). Ver `npm test` → 283 testes, `.entrega/EVIDENCIAS/fase4/`.
- **(build)** — `npm run build` resolvendo a rota/handler de fato (SSR/SSG real, não teoria).
- **(code)** — cadeia handler → store/API real rastreada linha a linha (citada arquivo:linha); usado quando não há teste dedicado mas a chamada é direta e óbvia.
- **(fase3)** — corrigido nesta pipeline, fase 3 (commit `feat(ui): fase 3…`).
- **(fase4)** — corrigido nesta pipeline, fase 4 (commits desta fase).

**Prova de acionamento em navegador real** (clique → resultado visível) chega nas FASES 7 (Playwright E2E) e 12 (smoke final) — registrado como plano, não pendência, em `PENDENCIAS.md`.

---

## 1. Landing (`/[locale]`)

| Elemento | Status | Evidência |
|---|---|---|
| Nav: scroll-spy, troca de tema, troca de idioma, menu mobile | ✅ | menu mobile ganhou foco preso + aria-modal (fase3); troca de tema/idioma preserva rota (`i18n/routing.ts`) |
| Hero: CTAs "Testar grátis"/"Entrar" | ✅ | `href="/login"` real (build resolve) |
| ROI Calculator: sliders, cálculo, CTA | ✅ | preços vêm de `plans-data.ts` (fonte única com Pricing, fase3); `aria-live` nos resultados |
| Pricing: toggle mensal/anual, 3 CTAs, "Fale com vendas" | ✅ | Starter/Pro/Scale → `/login`; Scale → `/contact` real (fase3); `aria-live` no preço |
| FAQ: acordeão | ✅ | `aria-controls`/`aria-expanded` ligando botão↔painel (fase3); JSON-LD FAQPage |
| Depoimentos, LogoCloud, Stats, Features, How, ForWhom, Security | ✅ | reveals variados (não mais fade+slide idêntico em tudo, fase3); FeatureCard com 3 variantes diferenciadas |
| Footer: todos os links | ✅ | zero `href="#"` confirmado por grep no repo inteiro (fase4); privacy/terms/lgpd/contact → páginas reais; features/pricing/security → âncoras reais |
| DNA helix (decorativo, hero-only) | ✅ | violeta off-brand removido, agora prata cromada (fase3) |
| Landing sem JS / reduced-motion | ✅ | `<noscript>` força `.rv` visível; hero-demo com `useReducedMotion` real (fase3) |

## 2. Login (`/[locale]/login`)

| Elemento | Status | Evidência |
|---|---|---|
| Form email/senha, mostrar/ocultar senha, submit | ✅ | `POST /api/auth/login`, botão-olho fora do `<label>` (fase3 fix no `Field`) |
| Botão "Entrar na demonstração" | ✅ | `demo:true` → `config.auth.demoEnabled` gate (fase1) → `demoIdentity()` |
| Estados: loading, erro (alert), rate-limit 429 | ✅ | `role="alert"`, `Button loading`, rate-limit 8/15min por IP (`login/route.ts`) |

## 3. Páginas legais (`/privacy` `/terms` `/lgpd` `/contact`)

| Elemento | Status | Evidência |
|---|---|---|
| 4 rotas × 4 idiomas, conteúdo real | ✅ | `(build)` — 16 páginas prerenderam (SSG) sem erro; conteúdo específico de saúde/LGPD (fase3) |
| Contato: 3 canais por e-mail | ✅ | `mailto:` real por canal (vendas/suporte/DPO) — padrão apropriado para página estática, não é stub |

## 4. Workspace — shell

| Elemento | Status | Evidência |
|---|---|---|
| Abas: abrir/fechar/trocar, split até 3 painéis | ✅ | `lib/workspace/store.ts` (283 testes incluem `workspace-store`) |
| ⌘K paleta de comandos | ✅ | navegação + ações — `command-palette.tsx` |
| ⌘J / Mari copilot dock | ✅ | streaming SSE real (`/api/ai/chat`), erro tratado |
| AppRail (ícones de módulo) | ✅ | entitlements (flag × plano × papel) — `workspace/entitlements.ts`, 2 arquivos de teste |
| Tablist: Enter/Espaço + **setas** | ✅ | ArrowLeft/Right WAI-ARIA adicionado (fase3) |
| Error boundary por aba | ✅ | `ScreenErrorBoundary` (preexistente) |
| **Error boundary de rota** (landing/login/app/owner shell) | ✅ | `[locale]/error.tsx` + `global-error.tsx` (fase4 — maior gap da fase 0) |
| Loading de rota (`/app`, `/owner`) | ✅ | `loading.tsx` dedicado (fase4) |
| 404 | ✅ | `not-found.tsx`, verificado por curl na fase 0 |

## 5. Workspace — 23 telas

Todas ligadas a dados reais do store (`@/lib/data`), sem handler vazio. Ações destrutivas abaixo têm `ConfirmDialog` (fase3 — antes: 8 sem confirmação + 1 `window.confirm` cru).

| Tela | Ações principais | Confirmação destrutiva | Estados (loading/vazio/erro/sucesso) | Evidência |
|---|---|---|---|---|
| today | filtro de agenda, ações rápidas | — | EmptyState no filtro vazio (fase3) | (code) `today.tsx` |
| agenda | agendar, **cancelar consulta** | ✅ ConfirmDialog (era `window.confirm`) | ✅ | (fase3) |
| encounter | consentimento, captura de áudio real, transcrição streaming | — | fallback de mic com `toast.info` (era silencioso) | `MediaRecorder`/`getUserMedia` real |
| review | editar/aprovar nota | — | ✅ | `approveNote`/`updateNoteSection` (store real) |
| tiss | **campos do cabeçalho da guia**, **remover procedimento**, validação pré-glosa, enviar | ✅ ConfirmDialog no procedimento | **bug de perda silenciosa corrigido** (fase3): campos agora controlados e persistidos antes do submit | `syncHeader()` |
| requisicao | solicitar/revisar/**negar** autorização | ✅ ConfirmDialog | pipeline com stepper visual + tempo em fila (elevação fase3) | `requestAuthorization/reviewAuthorization/decideAuthorization` |
| patients | cadastro, **remover alergia** | ✅ ConfirmDialog (dado clínico) | ✅ | `addPatient` real |
| exams | ciclo pedido→coletado→resultado→revisado | — | `Select` do design system (era `<select>` cru, fase3) | `addLabOrder/updateLabOrderStatus` |
| billing | reenviar guia, gráficos | — | `loading` no botão reenviar (era sem feedback) | tooltip Recharts por token (fase3) |
| faturamento | filtros, mini-gráfico de glosa | — | EmptyState + `formatPercent` (fase3); elevação: valor em risco + Progress de motivos | `glossReasons/glossTimeSeries` |
| reports | gráficos por especialidade | — | EmptyState quando sem dados (fase3) | Recharts + tabela sr-only |
| templates | duplicar, definir padrão | — | ✅ | `duplicateTemplate/setDefaultTemplate` |
| documents | gerar, canal de envio, **excluir documento** | ✅ ConfirmDialog | `loading` no gerar (era "…" textual) | `SegmentedControl` no canal (fase3) |
| signature | assinar (ICP real/mock conforme env) | — | ✅ | `/api/icp` |
| agent | aplicar recomendação, ajustar | — | `loading` no aplicar; `Input`/`Textarea` reais (eram crus) | `/api/ai/action` |
| agents | frota de agentes, ciclo simulado | — | try/catch com `toast.error` (era sem caminho de erro) | (fase3) |
| whatsapp | simulador de chat, envio | — | `toast.error` no catch (era vazio) | `/api/whatsapp` |
| automations | listar/configurar | — | ✅ | — |
| integrations | conectar/**desconectar**, configurar credenciais | ✅ ConfirmDialog | ⚠️ **estado de sessão por design** — ver `DECISOES.md` 2026-07-02: nenhum dos 20 provedores tem conector real; UI já rotula "superfície de demonstração" honestamente | decisão consciente, não lacuna |
| marketplace | instalar, **revogar chave de API** | ✅ ConfirmDialog (`requireText` p/ chave de produção) | ✅ | — |
| equipe | convidar, **remover membro**, papéis | ✅ ConfirmDialog | elevação: StatCards por papel + Avatar (fase3) | `addOrgUser` real |
| contratos | leitura por convênio | — (sem destrutiva) | elevação: card com glosa real do payer + sparkline + ação "abrir guia" (fase3) | `billingStats`/`glossReasons` reais |
| settings | perfil, **remover membro**, **desligar 2FA** | ✅ ConfirmDialog em ambos | ✅ | — |

## 6. Owner — shell

| Elemento | Status | Evidência |
|---|---|---|
| Sidebar 10 seções, badge Crown, impersonation banner | ✅ | `Button` primitivo no banner (era `<button>` cru, fase3) |
| Gate `role === 'owner'` | ✅ | `owner-panel.tsx` + middleware server-side |

## 7. Owner — 10 seções

| Seção | Antes (FASE 2) | Depois (FASE 3 + 4) | Evidência |
|---|---|---|---|
| overview | KPIs planos, sem drill-down | KPIs clicáveis (`setSection`), Δ MRR real, churn por limiar semântico | (code) `sections.tsx` OverviewSection |
| mari | erro do chat engolido em `'…'` | erro tratado: bolha `role="alert"` + retry | (fase3) `mari-console.tsx` |
| **tenants** | `addTenant`/suspender só em `useState`, não sobrevivia a reload, sem audit | **persistência real**: `addTenant`/`setTenantStatus` no store compartilhado; impersonar audita de verdade (`auditImpersonation`) | **(store-test)** 4 testes em `store-owner-admin.test.ts` (fase4) |
| **plans** | `save` só em `useState` | **persistência real**: `upsertPlan` (create/update por id) | **(store-test)** 3 testes (fase4) |
| **landing (CMS)** | publish = toast sem persistir; resetava edição ao trocar seção/locale | dirty-guard (fase3) + **persistência real**: `publishLandingBlock`/`getLandingBlock` por (seção,locale); texto honesto sobre o que publicar faz e não faz | **(store-test)** 4 testes (fase4) |
| flags | toggle silencioso | toast de confirmação (fase3); já persistia (`toggleFlag`) | (store-test) preexistente |
| ai | ✅ já persistia | card "Mari" decorativo → dados reais de sessão/modelo/tools (fase3) | `updateTenantAi` |
| whatsapp | toggle de comandos não persistia (toast mentia) | comandos entram no `updateTenantWhatsapp` de verdade (fase3) | `updateTenantWhatsapp` |
| **access** | matriz hardcoded, papéis custom só em `useState`, sem excluir | papéis custom **persistidos** (`addCustomRole`/`removeCustomRole`) + **exclusão com confirmação** (fase4, novo nesta fase) | **(store-test)** 3 testes (fase4) |
| audit | tabela sem busca/filtro | busca + filtro por resultado (fase3); agora reflete `tenant.create`, `plan.create/update`, `role.create/remove`, `landing.publish`, `tenant.impersonate` reais (fase4) | (store-test) |

**Nota de arquitetura (honesta):** a persistência acima vive no adapter ativo (in-memory + snapshot localStorage — o mesmo que atende 100% dos usuários hoje, já que nenhuma credencial de banco é exigida para rodar). O adapter Postgres (`postgres.ts`) faz *passthrough* dessas funções sem write-through ainda — registrado em `PENDENCIAS.md`, não é uma lacuna silenciosa.

---

## Resumo

- **❌ (stub):** 0
- **⚠️ (parcial, justificado):** 1 — `integrations.tsx` (session-only por design; nenhum backend real para os 20 provedores listados)
- **✅:** todo o restante — landing, login, páginas legais, shell do workspace, 23 telas, shell do owner, 10 seções do owner.
- **Maior fechamento desta fase:** error boundaries de rota (0 → cobertura completa) e persistência real de 4 das 8 seções configuráveis do owner (tenants, plans, access, landing CMS) que antes eram só `useState` local.
