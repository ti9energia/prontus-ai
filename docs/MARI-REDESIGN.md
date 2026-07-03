# Mari — Redesign & Roadmap (tracker)

> Documento vivo. Serve para **retomar o trabalho da Mari em qualquer sessão nova**:
> o que já foi feito, o que falta, e a estratégia. Atualizado a cada bloco (PR+merge).
> Contexto de produto/persona: [`MARI.md`](./MARI.md). Sistema: [`SISTEMA.md`](./SISTEMA.md).

## Objetivo
Substituir a identidade visual antiga da Mari (SVG desenhado à mão, `MariFace`) por uma
identidade **premium, clínica e tecnológica** usando os renders reais fornecidos pelo dono, e
evoluir a UX/produto em torno dela — **sem** redesenhar a Mari no código, sem arte por CSS, e
respeitando a arquitetura modular.

## Assets
Renders do dono (locais) em `C:\Users\engen\OneDrive\Desktop\mari\` → otimizados por
`scripts/process-mari.mjs` (sharp) → **`public/assets/mari/`** (commitado):

| Arquivo | Caminho no código | Uso |
|---|---|---|
| `mari-avatar.png` (512²) | `/assets/mari/mari-avatar.png` | chat, dock, FAB, cards, console, avatares |
| `mari-full.png` (768×1024) | `/assets/mari/mari-full.png` | landing, onboarding, empty states, institucional |
| `mari-favicon.png` (64²) | `/assets/mari/mari-favicon.png` | área/PWA da Mari (opcional) |
| `mari-referencia.png` | `/assets/mari/mari-referencia.png` | **ausente** — só guia de design (opcional) |

Fonte única de identidade/cópia: **`src/lib/mari/design.ts`** (`mariDesign`, `mariAlt`, `mariCopy`).
Componente único de render: **`src/components/brand/mari-assistant.tsx`** (`MariAssistant`).
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
- [~] **Bloco 2 — UX** (Etapa 3)
  - [x] 2a — `MariAssistant` adotado no **FAB** (floating) e no **dock** com status ao vivo (ouvindo/pensando/falando); removido o overlay manual de barras _(branch `feat/mari-live-presence`)_
  - [ ] 2b — empty states narrados pela Mari (#17) · Mari na landing/onboarding (`mari-full`) · onboarding troca ícone Bot
- [ ] **Bloco 3 — Segurança/revisão** (Etapa 4): banner de revisão (#1/#12) · destaque de medicações
- [ ] **Bloco 4+ — Features** (Etapa 5), na ordem da triagem abaixo

## Triagem das 20 features (build vs polish)
🟢 **Já existe — só ganha o visual novo:** 1 ambient mode (`encounter.tsx`, falta banner de revisão) · 11 owner Mari (`mari-console.tsx`) · 16 ROI (`reports.tsx`) · 19 demo mode (`DEMO_MODE`+seed) · 20 mobile/PWA (falta indicador global de gravação).

🟡 **Parcial — trabalho real:** 4 pré-glosa (`tiss.tsx`+`tools.ts`; falta sugestões+risco R$) · 5 SOAP (`review.tsx`; falta S/O/A/P+diff) · 6 templates por especialidade (falta aplicar no `encounter`) · 8 timeline (`patients.tsx`; simulada, falta resumo Mari) · 9 inbox de resultados (falta unificar+alerta crítico) · 10 command palette (falta expor `tools.ts`) · 12 safety layer (falta banners/diff auditável) · 13 learning center (`owner AiSection`; falta tom/regras/frases proibidas) · 14 feedback de nota (avalia chat, não a nota) · 15 before/after (só agregado) · 17 empty states (genérico) · 18 integrations assist (falta narração+testar conexão).

🔴 **Ausente — net-new:** 2 nota com evidência/proveniência · 3 painel de incerteza clínica · 7 checklist pós-consulta.
