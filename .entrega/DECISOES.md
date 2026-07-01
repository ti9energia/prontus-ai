# DECISÕES

## 2026-07-01 — FASE 2: alvo estético e priorização (auditorias em EVIDENCIAS/design-antes/)

**Alvo estético:** premium clínico dark-first já estabelecido (turquesa #14C8C4 + prata, Sora/Inter, profundidade por sombra contida e aurora) — NÃO trocar a identidade; **remover o que a contradiz** (violeta off-brand no DNA), **dar vida às telas administrativas chapadas** reaproveitando os padrões que as telas clínicas já provam (sparkline, Progress, StatCard, stepper, Avatar), e **fechar os buracos de confiança** (preços divergentes, links mortos, toasts que mentem, formulário que descarta edição).

**Priorização (impacto × esforço) — vira o plano da FASE 3/4:**
- **P0 (confiança/correção):** preços Pricing×ROI divergentes; links legais mortos (privacy/terms/lgpd/contact); perda silenciosa no form TISS; destrutivas sem confirmação (criar ConfirmDialog único); CMS de landing que finge publicar; seções do owner que não persistem (tenants/plans/access/whatsapp); erro do chat Mari engolido em '…'.
- **P1 (sistema):** i18n unificado (eliminar L()/COPY → messages/*.json); FeatureCard único p/ cards triplicados; buttonVariants no ROI; tooltip Recharts por token (tema claro); EmptyState nas 5 telas sem; loading nos botões async; violeta→brand no dna-helix; fallback visível sem JS p/ .rv; funil de conversão (CTA sem cadastro → decidir na FASE 5 com onboarding).
- **P2 (polish):** contraste text-subtle ≤12px → text-muted; aria-label PT fixo; reduced-motion no hero-demo/JS; valores mágicos de fonte; ritmo py; variação de reveals; aria-live no pricing; foco preso no menu mobile; ArrowLeft/Right no tablist; enums crus traduzidos; paginação de listas longas (FASE 10).
- **Top-5 sem vida a elevar (FASE 3):** contratos, equipe, requisicao, faturamento, integrations + overview do owner.

## 2026-07-01 — Evidência sem servidor local (diretiva do dono)
- O dono pediu foco 100% no código, sem subir servidor/porta para não pesar a máquina.
- Consequência: evidências das fases de design (2–3) passam a ser análise de código + diffs antes × depois (em vez de screenshots); validação funcional via typecheck/lint/vitest/build; E2E/k6/Lighthouse (fases 7, 8, 10) precisarão de execução — ao chegar lá, rodar de forma pontual e enxuta ou escalar ao dono.

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
