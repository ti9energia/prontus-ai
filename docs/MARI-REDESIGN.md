# Mari — Redesign & Roadmap (tracker)

> Documento vivo. Serve para **retomar o trabalho da Mari em qualquer sessão nova**:
> o que já foi feito, o que falta, e a estratégia. Atualizado a cada bloco (PR+merge).
> Contexto de produto/persona: [`MARI.md`](./MARI.md). Sistema: [`SISTEMA.md`](./SISTEMA.md).

## Objetivo
Dar à Mari uma identidade **premium, clínica e tecnológica** e evoluir a UX/produto em torno
dela — sem arte por CSS e respeitando a arquitetura modular. A identidade partiu dos renders
photoreal do dono e **evoluiu para um mascote-prontuário não-humano** (arte de campanha), mais
memorável e neutro para software clínico. O `MariFace` code-native foi **redesenhado** para
espelhar o mascote e segue como fallback resiliente (nunca "imagem de IA genérica").

## Assets
Arte de campanha do mascote (não-humano) commitada em **`public/assets/mari/`**. Os renders
photoreal antigos (`mari-avatar/full/favicon.png`, gerados por `scripts/process-mari.mjs`) foram
**removidos** — o script sharp segue no repo caso se queira reprocessar renders no futuro.

| Arquivo | Caminho no código | Uso |
|---|---|---|
| `mari-mascot-avatar.png` | `/assets/mari/mari-mascot-avatar.png` | chat, dock, FAB, cards, console, avatares, favicon |
| `mari-mascot.png` (1122×1402) | `/assets/mari/mari-mascot.png` | landing, onboarding, empty states, institucional |
| `/brand/symbol.png` | `MARI_ASSETS.reference` | guia de design (arco Auronis) |

Fonte única de identidade/cópia: **`src/lib/mari/design.ts`** (`mariDesign`, `mariAlt`, `mariCopy`, `MARI_ASSETS`).
Componente único de render: **`src/components/brand/mari-assistant.tsx`** (`MariAssistant`); fallback
code-native em **`src/components/brand/mari.tsx`** (`MariFace`, redesenhado como o mascote).
Alt padrão: “Mari, copilota clínica de IA do Auronis Health”.

## Regras de arquitetura (sempre)
Tailwind-only (keyframes no `tailwind.config.ts`, não `.css` avulso) · barrel `@/lib/mari` (sem deep import) ·
telas novas → `registry` · tipos → `types.ts` · dados → `store.ts`/adapter · tools → `mari/tools.ts` ·
permissões → `permissions.ts` · flags → `entitlements.ts` · integrações → `connectors` · sem `process.env`
fora de `lib/config` · não quebrar i18n (927×4) / testes / a11y / tema · manter mock/sandbox e revisão humana.

## Etapas
- **0 — Assets** · script sharp → `public/assets/mari/`.
- **1 — Núcleo** · `design.ts` + `MariAssistant` + keyframes tailwind + a11y.
- **2 — Reskin** · trocar o SVG antigo pela nova Mari em todas as superfícies existentes.
- **3 — UX** · states (listening/thinking/warning) + empty states narrados + apresentação na landing/onboarding.
- **4 — Segurança & revisão** · banner “precisa de revisão médica”, destaque de medicações, alertas clínicos separados.
- **5 — Features** · incremental, 1 PR/flag por item, mais seguras/modulares primeiro.
- **6 — Qualidade** · typecheck · lint · testes · i18n · a11y · responsividade (após cada bloco).

## Progresso
- [x] **Bloco 1 — Identidade visual** (Etapas 0–2) — _branch `feat/mari-visual-identity`_
  - [x] Etapa 0: `scripts/process-mari.mjs` + `public/assets/mari/{avatar,full,favicon}`
  - [x] Etapa 1: `src/lib/mari/design.ts`, `src/components/brand/mari-assistant.tsx`, keyframes `mari-*`
  - [x] Etapa 2: `MariPortrait` → novo avatar (atualiza FAB, dock, owner console); login/signup; WhatsApp
  - Diferido p/ etapas seguintes: top-bar (ícone Sparkles), onboarding (ícone Bot), rename legado `iris→mari`
- [x] **Bloco 2 — UX** (Etapa 3) — 2a+2b+2c concluídos
  - [x] 2a — `MariAssistant` adotado no **FAB** (floating) e no **dock** com status ao vivo (ouvindo/pensando/falando); removido o overlay manual de barras _(PR #71)_
  - [x] 2b — Mari na **landing** (seção "Conheça a Mari" com `mari-full`, `meet-mari.tsx`) + **onboarding** (ícone Bot → rosto da Mari no card "sua copilota") _(PR #72)_
  - [x] 2c — **empty states narrados pela Mari** (#17): novo componente cliente `MariEmptyState` (`src/components/brand/mari-empty-state.tsx`) + falas centralizadas em `mariEmptyLines()` (`lib/mari/design.ts`, 6 chaves × 4 idiomas). Adotado em **today**, **agent** (status `success` = "tudo em dia"), **patients** (busca), **documents**, **faturamento** (glosa) e **exams**. Tabelas admin neutras (billing, agenda, equipe, marketplace, signature, requisicao, templates, reports) seguem com o `EmptyState` genérico — presença da Mari é intencional, não ruído _(branch `feat/mari-empty-states`)_
- [x] **Revisão de identidade — mascote** — a identidade migrou dos renders photoreal para um
  **mascote-prontuário não-humano** (novos `mari-mascot*.png`; `design.ts`/`MariAssistant`
  repontados; `MariFace` redesenhado; hero/`meet-mari`/`dna-helix` afinados). Feito junto do
  **upgrade de plataforma Next 15 · next-intl 4 · vitest 4 · Node 22** _(branch `feat/next15-mari-mascot`)_
- [ ] **Bloco 3 — Segurança/revisão** (Etapa 4) — _PRÓXIMO: basta dizer "continue bloco 3"_
  - **Objetivo:** tornar visível e auditável que a nota gerada pela Mari **precisa de revisão médica** antes de assinar, e destacar medicações/pontos sensíveis. Cobre features #1 (ambient) e #12 (safety layer).
  - **Plano acionável:**
    1. **`MariReviewBanner`** (novo, client, `src/components/brand/mari-review-banner.tsx`) — usa `mariCopy(locale).review` (fala já existente: "Revise os pontos destacados antes de assinar. A decisão final continua sendo médica.") + `MariAssistant status="attention"`. Aviso **não-bloqueante**, `role="status"`, motion auto-stilled.
    2. **Adotar o banner** antes do CTA de assinar/finalizar em `review.tsx` e na nota gerada em `encounter.tsx` (ambient mode).
    3. **Destaque de medicações** — realçar termos de medicação no texto clínico (helper determinístico em `lib/mari/` + render com tom `warning`); não inventar dose, só sinalizar para conferência.
    4. **Diff auditável (#12)** — separar visualmente "sugerido pela Mari" vs "confirmado pelo médico"; alertas clínicos em bloco próprio.
  - **Regras:** Tailwind-only · cópia nova (se houver) em `lib/mari/design.ts` · i18n 927×4 intacto · a11y (status/alert) · manter revisão humana · PR+merge próprio (sugestão de branch `feat/mari-safety-review`).
- [ ] **Bloco 4+ — Features** (Etapa 5), na ordem da triagem abaixo

## Triagem das 20 features (build vs polish)
🟢 **Já existe — só ganha o visual novo:** 1 ambient mode (`encounter.tsx`, falta banner de revisão) · 11 owner Mari (`mari-console.tsx`) · 16 ROI (`reports.tsx`) · 19 demo mode (`DEMO_MODE`+seed) · 20 mobile/PWA (falta indicador global de gravação).

🟡 **Parcial — trabalho real:** 4 pré-glosa (`tiss.tsx`+`tools.ts`; falta sugestões+risco R$) · 5 SOAP (`review.tsx`; falta S/O/A/P+diff) · 6 templates por especialidade (falta aplicar no `encounter`) · 8 timeline (`patients.tsx`; simulada, falta resumo Mari) · 9 inbox de resultados (falta unificar+alerta crítico) · 10 command palette (falta expor `tools.ts`) · 12 safety layer (falta banners/diff auditável) · 13 learning center (`owner AiSection`; falta tom/regras/frases proibidas) · 14 feedback de nota (avalia chat, não a nota) · 15 before/after (só agregado) · 17 empty states (genérico) · 18 integrations assist (falta narração+testar conexão).

🔴 **Ausente — net-new:** 2 nota com evidência/proveniência · 3 painel de incerteza clínica · 7 checklist pós-consulta.
