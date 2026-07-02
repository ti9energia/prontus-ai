# PENDÊNCIAS

Itens só saem daqui resolvidos com prova.

## 1. Postgres write-through para entidades novas do owner (consciente, não bloqueante)
- **O quê:** `addTenant`, `upsertPlan`, `listCustomRoles`/`addCustomRole`/`removeCustomRole`, `listLandingBlocks`/`getLandingBlock`/`publishLandingBlock` (adicionadas na FASE 4) persistem no adapter in-memory (`store.ts`) mas o adapter Postgres (`postgres.ts`) só faz *passthrough* — não escreve nessas tabelas quando `DATABASE_URL` está configurado.
- **Causa-raiz:** essas entidades não têm modelo no `prisma/schema.prisma`; criar um exigiria migração real contra um Postgres vivo, indisponível neste ambiente (nenhuma credencial de banco está configurada — condição normal do projeto, confirmada no `.env.example`).
- **Por que não bloqueia:** o adapter ativo em 100% dos ambientes hoje (dev e o deploy atual) é o in-memory — é ele quem atende o usuário de verdade. Postgres é infraestrutura opcional documentada como upgrade futuro.
- **Como resolver quando houver banco:** adicionar `Tenant.customRoles`/`LandingBlock` (ou tabela própria) ao schema, `npm run db:generate && npm run db:migrate`, mover as 8 funções de `postgres.ts`'s passthrough para write-through (mesmo padrão de `setTenantStatus`/`toggleFlag` no mesmo arquivo).

## 2. Prova de acionamento em navegador real (E2E) — resolvida na FASE 7 (via CI)
- **O quê:** o `INVENTARIO.md` da FASE 4 usa prova por código/teste/build (diretiva do dono: sem subir servidor nesta rodada). Clique-e-veja-o-resultado em navegador real ainda não tinha sido executado.
- **Como resolveu:** FASE 7 escreveu 49 testes Playwright (8 specs, cobrindo a jornada completa) e criou um job `e2e` no GitHub Actions — o `webServer` do Playwright sobe/derruba o `next start` sozinho DENTRO do runner da nuvem, nunca na máquina local (ver DECISOES.md 2026-07-02). Prova de execução real em `EVIDENCIAS/fase7/verificacao.txt`, seção "Execução real via GitHub Actions".
- **O que ainda falta:** FASE 12 (smoke final ponta a ponta, verificação conjunta ao vivo com o dono na própria máquina — Lighthouse com Chrome real, sensação de uso). Não é uma lacuna funcional — é a ordem natural do pipeline.

## 3. `screens/integrations.tsx` — estado de sessão por decisão consciente
- Ver `.entrega/DECISOES.md` (2026-07-02). Não é pendência — é ⚠️ justificado em `INVENTARIO.md`.

## 4. Resíduos i18n/doc do botão de demo removido (rastreado para FASE 11)
- Chaves órfãs `auth.demoNote`/`auth.enterDemo` nos 4 catálogos (`messages/*.json`) — nenhum componente as referencia mais.
- `GETTING-STARTED.md` ainda descreve o fluxo "clique em Entrar na demonstração", que não existe mais na UI.
- Não é bug — é a decisão registrada do dono. Remover/atualizar na limpeza de documentação da FASE 11.

## 5. `TenantAiConfig.enabledTools` não é aplicado no gate de ferramentas da Mari (consciente, não bloqueante)
- **O quê:** o dono configura por tenant quais ferramentas a Mari pode usar (`enabledTools`, ex.: `notes:read`, `tiss:create`, `billing:gloss:read` — notação com `:`). O endpoint real que executa ferramentas (`POST /api/ai/action`) hoje só verifica `session.role` (owner vs clínico) — não consulta `enabledTools` (a persona/modelo por tenant **já foram** conectados nesta fase, ver `DECISOES.md`; isso aqui é o próximo passo natural, não feito ainda).
- **Causa-raiz:** as duas listas usam vocabulários diferentes sem mapeamento — `enabledTools` usa notação `recurso:ação` (`tiss:create`), o registry real de ferramentas (`lib/mari/tools.ts`) usa notação `dominio.ação` (`tiss.generate`, `glosa.resubmit`). Não existe correspondência 1:1 pronta; inventar um mapeamento apressado arriscaria criar uma falsa sensação de controle de acesso (pior que documentar a lacuna).
- **Como resolver:** desenhar deliberadamente a correspondência entre as duas listas (ou unificar a notação em uma só) antes de aplicar o gate — trabalho de design de permissões, não uma linha de código.

## 6. `npm audit` acusa 3 advisories em `next`/`next-intl` (pré-existente, não introduzido na FASE 7)
- **O quê:** `npm audit --omit=dev` reporta 1 high (`next` 14.2.35 — vários advisories de DoS/cache-poisoning/smuggling em versões `9.3.4-canary.0 – 16.3.0-canary.5`) e 2 moderate (`next-intl` ≤4.9.1 — open redirect + prototype pollution; `postcss` <8.5.10 transitivo do `next`, XSS em stringify).
- **Confirmação de que é pré-existente:** `git diff main -- package.json` na branch da FASE 7 mostra que a única mudança de dependências foi **adicionar** `@playwright/test`/`@axe-core/playwright` como devDependencies — nenhuma versão de `next`, `next-intl` ou `postcss` foi tocada. O achado já existia em `main` antes desta fase.
- **Por que não bloqueia:** o próprio `ci.yml` já trata isso como informativo — `npm audit --audit-level=high` roda com `continue-on-error: true` desde antes desta fase ("supply-chain advisories shouldn't hard-block a deploy"). A correção exige `npm audit fix --force` (next → 16.2.10, next-intl → 4.13.1 — major bumps com breaking changes), fora do escopo de uma fase de testes E2E e arriscado demais para introduzir a poucas fases do fim do pipeline sem uma rodada de regressão dedicada.
- **Como resolver:** dedicar uma fase/branch própria para o upgrade major do Next.js + next-intl, rodando a suíte completa (Vitest + Playwright + typecheck + build) antes de mergear — candidato natural para depois da FASE 12 ou uma iteração de manutenção futura.
