# PENDÊNCIAS

Itens só saem daqui resolvidos com prova.

## 1. Postgres write-through para entidades novas do owner (consciente, não bloqueante)
- **O quê:** `addTenant`, `upsertPlan`, `listCustomRoles`/`addCustomRole`/`removeCustomRole`, `listLandingBlocks`/`getLandingBlock`/`publishLandingBlock` (adicionadas na FASE 4) persistem no adapter in-memory (`store.ts`) mas o adapter Postgres (`postgres.ts`) só faz *passthrough* — não escreve nessas tabelas quando `DATABASE_URL` está configurado.
- **Causa-raiz:** essas entidades não têm modelo no `prisma/schema.prisma`; criar um exigiria migração real contra um Postgres vivo, indisponível neste ambiente (nenhuma credencial de banco está configurada — condição normal do projeto, confirmada no `.env.example`).
- **Por que não bloqueia:** o adapter ativo em 100% dos ambientes hoje (dev e o deploy atual) é o in-memory — é ele quem atende o usuário de verdade. Postgres é infraestrutura opcional documentada como upgrade futuro.
- **Como resolver quando houver banco:** adicionar `Tenant.customRoles`/`LandingBlock` (ou tabela própria) ao schema, `npm run db:generate && npm run db:migrate`, mover as 8 funções de `postgres.ts`'s passthrough para write-through (mesmo padrão de `setTenantStatus`/`toggleFlag` no mesmo arquivo).

## 2. Prova de acionamento em navegador real (E2E) — planejada, não pendente
- **O quê:** o `INVENTARIO.md` da FASE 4 usa prova por código/teste/build (diretiva do dono: sem subir servidor nesta rodada). Clique-e-veja-o-resultado em navegador real ainda não foi executado.
- **Quando resolve:** FASE 7 (Playwright E2E cobre a jornada completa) e FASE 12 (smoke final ponta a ponta). Não é uma lacuna funcional — é a ordem natural do pipeline.

## 3. `screens/integrations.tsx` — estado de sessão por decisão consciente
- Ver `.entrega/DECISOES.md` (2026-07-02). Não é pendência — é ⚠️ justificado em `INVENTARIO.md`.

## 4. `TenantAiConfig.enabledTools` não é aplicado no gate de ferramentas da Mari (consciente, não bloqueante)
- **O quê:** o dono configura por tenant quais ferramentas a Mari pode usar (`enabledTools`, ex.: `notes:read`, `tiss:create`, `billing:gloss:read` — notação com `:`). O endpoint real que executa ferramentas (`POST /api/ai/action`) hoje só verifica `session.role` (owner vs clínico) — não consulta `enabledTools` (a persona/modelo por tenant **já foram** conectados nesta fase, ver `DECISOES.md`; isso aqui é o próximo passo natural, não feito ainda).
- **Causa-raiz:** as duas listas usam vocabulários diferentes sem mapeamento — `enabledTools` usa notação `recurso:ação` (`tiss:create`), o registry real de ferramentas (`lib/mari/tools.ts`) usa notação `dominio.ação` (`tiss.generate`, `glosa.resubmit`). Não existe correspondência 1:1 pronta; inventar um mapeamento apressado arriscaria criar uma falsa sensação de controle de acesso (pior que documentar a lacuna).
- **Como resolver:** desenhar deliberadamente a correspondência entre as duas listas (ou unificar a notação em uma só) antes de aplicar o gate — trabalho de design de permissões, não uma linha de código.
