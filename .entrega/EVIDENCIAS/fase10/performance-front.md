# FASE 10 — Performance front — 2026-07-02

Auditoria honesta de performance de front-end + as melhorias reais. Medição ao
vivo de Core Web Vitals (Lighthouse com Chrome real) fica para a verificação
conjunta da FASE 12 — mesma diretiva do dono da FASE 6 (não fingir número de
laboratório sem o ambiente real).

## Corrigido (melhorias reais)

### 1. Fonte CJK só carrega em zh-CN (win customer-facing, toda página)
**Antes:** `fontVariables` incluía as 4 fontes (Sora, Inter, JetBrains Mono,
Noto Sans SC) e era aplicado no `<html>` de TODA rota. Mas o Noto Sans SC (3
pesos) só é *usado* quando `locale === 'zh-CN'` (font-family aplicada no body
só nesse locale). Ou seja, ~99% dos visitantes (pt-BR/en/fr-FR) baixavam/
preload de uma 4ª família de fonte que nunca viam.
**Depois:** `fontCJK` com `preload: false`, removida de `fontVariables`, e sua
variável CSS aplicada condicionalmente no `[locale]/layout.tsx` só quando
`locale === 'zh-CN'`. Não-CJK não preload nem baixa a fonte (nada referencia
`--font-cjk` nessas páginas). Arquivos: `src/app/fonts.ts`,
`src/app/[locale]/layout.tsx`.

### 2. recharts fora do bundle inicial do /owner (lazy-load do gráfico)
**Antes:** `owner/sections.tsx` importava recharts direto, e o gráfico de MRR
está dentro da `OverviewSection` (a seção PADRÃO, renderizada de imediato) — o
recharts (~90KB) entrava no bundle inicial do `/owner` (~293KB first load).
**Depois:** gráfico extraído para `owner/mrr-chart.tsx` e carregado via
`next/dynamic` (`ssr: false`) com skeleton — recharts vira um chunk separado
que carrega após a hidratação; os KPIs e o shell pintam na hora. Mesmo padrão
já usado nas telas do workspace (`registry.tsx`).
**Números reais (build local, medido):**
| rota /owner | page | First Load JS |
|---|---|---|
| antes (baseline FASE 7) | 124 kB | **293 kB** |
| depois (gráfico lazy) | 23 kB | **192 kB** |

**−101 kB no First Load JS do /owner** — exatamente o peso do recharts, agora
num chunk carregado sob demanda. (Confirmação: o `optimizePackageImports` já
ajudava o tree-shaking, mas não tira recharts de um bundle que o importa
eagerly — só o `dynamic(ssr:false)` faz isso.)

## Auditado e já ótimo (documentado, sem inventar)

- **Imagens:** ZERO `<img>` raster renderizado na UI (só um QR code PIX que é
  data-URL — `next/image` não ajudaria) e ZERO `next/image` no código todo. Os
  assets de marca (logo, Mari, DNA helix) são SVG/inline. Nada a otimizar aqui.
- **Telas do workspace:** billing/reports/faturamento (que usam recharts) já
  são lazy via `registry.tsx` (`dynamic`, `ssr: false`) — recharts NÃO está no
  bundle inicial do `/app`.
- **Tree-shaking:** `next.config` já tem `optimizePackageImports` para
  lucide-react, recharts e framer-motion.
- **Fontes:** `next/font/google` (self-hosted, `display: 'swap'`, sem CLS de
  fonte) — ótimo. Sora/Inter/JetBrains Mono com subsets `latin`/`latin-ext`.
- **Reveals sem JS / reduced-motion:** landing tem `<noscript>` que força `.rv`
  visível e o hero respeita `useReducedMotion` (fase 3) — sem conteúdo preso
  atrás de animação.
- **Compressão + cache de estáticos:** gzip default on; `/_next/static/*` com
  `Cache-Control: immutable` automático.

## Core Web Vitals / Lighthouse — deferido para FASE 12 (verificação conjunta)
Como na FASE 6, a medição ao vivo (LCP/CLS/INP/TBT com Chrome real) precisa de
um servidor de pé e Chrome — fica para a sessão conjunta. O que dá para afirmar
estaticamente sem servidor está acima. Prontidão:
- LCP: hero é o elemento LCP e renderiza sem JS (SSR + CSS fade como
  enhancement) — bom candidato a LCP rápido.
- CLS: `display: 'swap'` + reserva de altura nos containers de gráfico
  (skeleton com a mesma altura) evitam shift.
- Bundle: shared First Load 88.1KB; rotas customer-facing saudáveis (tabela).

## Tabela de bundle (build local desta branch)
| rota | page | First Load JS |
|---|---|---|
| `/[locale]` (landing) | 54.9 kB | 188 kB |
| `/[locale]/app` (workspace) | 29.6 kB | 199 kB |
| `/[locale]/signup` | 6.0 kB | 138 kB |
| `/[locale]/login` | 5.5 kB | 137 kB |
| `/[locale]/onboarding` | 5.1 kB | 134 kB |
| `/[locale]/checkout` | 13.2 kB | 133 kB |
| `/[locale]/privacy` | 151 B | 134 kB |
| `/[locale]/owner` | 23 kB | **192 kB (era 293)** |
| shared by all | — | 88.1 kB |

Landing (188KB) e workspace (199KB) carregam framer-motion (animações do hero /
reveals) — peso inerente e aceitável para superfícies ricas; comprime bem no
fio. recharts está fora de ambos (telas do workspace são lazy). Não há alvo
de lazy-load de alto valor restante nas rotas customer-facing sem arriscar as
animações polidas.

## A confirmar ao vivo na FASE 12 (network tab / Lighthouse)
- 0 requisições da fonte Noto Sans SC em `/pt-BR`, `/en`, `/fr-FR`; presente só
  em `/zh-CN` (prova de rede do fix #1 — o mecanismo `preload:false` + variável
  condicional é padrão do next/font, mas a confirmação byte-a-byte é no browser).
- Números reais de LCP/CLS/INP/TBT com Chrome real.

## Prova local
typecheck ✅ · lint ✅ · build exit 0 (52/52 páginas) · vitest (sem regressão)
