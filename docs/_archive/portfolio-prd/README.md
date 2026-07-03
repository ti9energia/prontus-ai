# Arquivo — PRD original do portfólio (superado)

Estes documentos são a **especificação original de um PORTFÓLIO de IA** (9 plataformas),
anterior ao foco exclusivo no **Auronis Health**. Estão aqui só como **registro histórico**.

Por que saíram da raiz:
- Descrevem uma arquitetura que **nunca foi construída** neste repo — monorepo NestJS +
  pnpm/Turborepo (`apps/web`+`apps/api`+`packages/*`), Redis, BullMQ, NextAuth, tRPC, etc.
- Usam a **marca antiga** ("Aureon") e a **paleta antiga** (verde `#0D9488`).
- O repo hoje contém **apenas o Auronis Health**, com arquitetura concreta diferente.

**O sistema real** está documentado em:
- [`docs/SISTEMA.md`](../../SISTEMA.md) — visão canônica (o que é, arquitetura, cores, DNA)
- [`docs/`](../../) — arquitetura, Mari, modularidade, blueprint do copiloto
- [`.entrega/`](../../../.entrega/) — trilha de entrega do pipeline

Conteúdo ainda útil que foi preservado no sistema real: a disciplina de **i18n nos 4
idiomas** (§6 do `00-PADRAO`) vive em `messages/*.json` + `scripts/i18n-check.mjs`; o
padrão de **copiloto desacoplado** (`0A`) virou `docs/AI-COPILOT-BLUEPRINT.md`; a
**modularidade** (`0D`) virou `docs/MODULARITY.md`.

> Podem ser apagados de vez a qualquer momento — o `git` preserva o histórico.
