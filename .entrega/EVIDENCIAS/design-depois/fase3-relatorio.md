# FASE 3 — Elevação executada (antes × depois por código)

**Data:** 2026-07-02 · Diff: 43 arquivos, +3322/−996 · Prova: typecheck ✅ · lint ✅ · i18n 837 chaves em paridade (4 idiomas) ✅ · 271 testes ✅ · build prod ✅

Referência "antes": `.entrega/EVIDENCIAS/design-antes/*.md` (auditorias FASE 2). Cobertura por achado:

## Landing + Login
| Antes (achado) | Depois |
|---|---|
| Preços divergentes Pricing 99/199/349 × ROI 97/197/397 | Fonte única `landing/plans-data.ts`; ROI usa `planForDoctors()`; teste do ROI atualizado |
| privacy/terms/lgpd/contact → `href="#"` | Páginas reais em `[locale]/{privacy,terms,lgpd,contact}` (4 idiomas, server-rendered, conteúdo específico LGPD/saúde); sitemap atualizado; links mortos restantes REMOVIDOS do footer |
| Scale "Fale com vendas" → /login | → `/contact` (3 canais: vendas/suporte/DPO) |
| Violeta off-brand no DNA (`167 140 252`…) | Strand B prata cromada; rungs na rampa brand/accent/silver — zero roxo |
| Landing invisível sem JS (`.rv{opacity:0}`) | reduced-motion força visível + `<noscript>` no layout |
| CTA do hero invisível até hidratar | animação CSS `animate-fade-up` (sem framer initial) |
| Cards triplicados | `<FeatureCard>` com 3 variantes diferenciadas (features/role/security) |
| ROI com botão à mão + número em gradient | `buttonVariants` + `text-brand-600` sólido |
| aria: estrelas PT fixo, FAQ sem aria-controls, menu mobile sem foco preso, pricing sem aria-live | Tudo corrigido (role=img i18n, id/aria-controls/region, dialog+trap+restauração, aria-live+transição) |
| hero-demo ignora reduced-motion | `useReducedMotion` → estado final estático, sem loop/ping |
| Contraste text-subtle ≤12px; ritmo py-20; reveals idênticos centralizados; fontes mágicas | text-muted; py-24; Features/FAQ à esquerda + Reveal `fade` sem slide em LogoCloud/Stats; degrau `xs+` no config |
| Olho-de-senha dentro de `<label>` | Field com htmlFor/id via useId + FieldIdContext (compat com todos os usos) |

## Workspace (23 telas + shell)
| Antes | Depois |
|---|---|
| 8+ destrutivas sem confirmação; `window.confirm` cru | `ConfirmDialog` único (novo primitivo em ui/overlay) em: revogar key (requireText p/ produção), remover membro, excluir documento, remover procedimento TISS, negar autorização, desconectar integração, remover alergia, desligar 2FA, cancelar consulta |
| TISS descartava edição (defaultValue nunca lido) | Campos controlados + `syncHeader()` persiste na guia antes de submit/pré-glosa |
| Async sem feedback (agent/billing/documents); mic falha silenciosa | `loading` no Button; toast.info no fallback de mic |
| 5 telas sem EmptyState | EmptyState com CTA em today/faturamento/requisicao/equipe/reports |
| Primitivos reinventados (select/input/chips) | Select/Input/Textarea/SegmentedControl de ui/ |
| Tooltip Recharts fixo escuro | tokens `rgb(var(--card))`/`--ink`/`--line` (billing/reports/faturamento) |
| Modal integração fingia salvar | Controlado + salva em sessão + nota honesta de demo + badge "Configurado" |
| Enums crus; % inconsistente; tablist sem setas; gráficos sem alternativa | Traduzidos; formatPercent; ArrowLeft/Right WAI-ARIA; role=img + tabela sr-only |
| whatsapp catch vazio; agents sem caminho de erro | toast.error + tratamento de !res.ok; try/catch com reset |
| **Top-5 sem vida** | contratos: cards c/ glosa real do payer + sparkline + ação abrir guia · equipe: StatCards por papel + Avatar + permissões + status · requisicao: pipeline agrupado + stepper + tempo em fila · faturamento: valor em risco + mini-gráfico + Progress de motivos · integrations: health dot + última sync + eventos/24h |

## Painel do Dono
| Antes | Depois |
|---|---|
| Suspender/impersonar sem confirmação | ConfirmDialog (suspender c/ requireText = nome do tenant) |
| Chat engolia erro em '…' | Bolha de erro role=alert + toast + "Tentar de novo" |
| Tabelas sem empty state | EmptyRow em tenants/flags/access/audit |
| Gráfico #0d9488 + tooltip fixo; sem a11y | Tokens CSS vars + role=img + aria-label + série sr-only |
| 1ª coluna não-sticky; deny invisível (subtle/50) | sticky left-0; PermIcon text-muted + aria-label/title por célula |
| aria-label cru na flag; labels não associados; toast do WhatsApp mentia | tm(f.module)+toast; aria-label no Switch; comandos entram no save |
| CMS perdia edição ao trocar seção/locale; badges fake | Dirty guard + snapshots por seção:idioma + badges derivados + publish rotulado demo |
| KPIs planos; sem busca/filtro; "+7" truncado mudo | KPIs clicáveis (drill-down) + Δ MRR + churn por limiar; busca/filtros em tenants/audit; "+N outros" com title |
| Banner com button cru; impersonating por nome; mic sem tratamento | Button primitivo; {id,name}; getUserMedia com toast + estado micBlocked |

## Pendências conscientes desta fase (→ FASE 4)
- Persistência real do owner (tenants/plans/access/whatsapp/CMS publish) — UI agora é honesta sobre o mock.
- Consolidação i18n L()/COPY → messages/*.json.
- Funil de cadastro/onboarding (CTAs ainda → /login) — FASE 5.
