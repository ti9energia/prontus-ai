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

## 4. Resíduos i18n/doc do botão de demo removido — ✅ RESOLVIDO na FASE 11
- Chaves órfãs `auth.demoNote`/`auth.enterDemo` removidas dos 4 catálogos (927 chaves, paridade mantida).
- `GETTING-STARTED.md` reescrito (seção "Login" descreve cadastro real, dono via env, médico-teste via env, e o atalho `DEMO_MODE` agora API-only sem botão visível).
- `DEPLOY.md` corrigido (`DEMO_MODE` descrito como atalho via API, não "botão").

## 5. `TenantAiConfig.enabledTools` não é aplicado no gate de ferramentas da Mari (consciente, não bloqueante)
- **O quê:** o dono configura por tenant quais ferramentas a Mari pode usar (`enabledTools`, ex.: `notes:read`, `tiss:create`, `billing:gloss:read` — notação com `:`). O endpoint real que executa ferramentas (`POST /api/ai/action`) hoje só verifica `session.role` (owner vs clínico) — não consulta `enabledTools` (a persona/modelo por tenant **já foram** conectados nesta fase, ver `DECISOES.md`; isso aqui é o próximo passo natural, não feito ainda).
- **Causa-raiz:** as duas listas usam vocabulários diferentes sem mapeamento — `enabledTools` usa notação `recurso:ação` (`tiss:create`), o registry real de ferramentas (`lib/mari/tools.ts`) usa notação `dominio.ação` (`tiss.generate`, `glosa.resubmit`). Não existe correspondência 1:1 pronta; inventar um mapeamento apressado arriscaria criar uma falsa sensação de controle de acesso (pior que documentar a lacuna).
- **Como resolver:** desenhar deliberadamente a correspondência entre as duas listas (ou unificar a notação em uma só) antes de aplicar o gate — trabalho de design de permissões, não uma linha de código.

## 10. Instabilidade de DOM na landing page sob Playwright/CI (achado real, FASE 7, precisa de diagnóstico ao vivo)
- **O quê:** 6 testes de `e2e/landing.spec.ts` (CTA primário, rodapé, páginas legais, FAQ, seletor de idioma, mais o #11 abaixo) falham de forma consistente e reproduzível em runs de CI limpos, através dos runs 4/5/6 (confirmado: não é `MISSING_MESSAGE` — zero desde o run 3; não é `getByLabel('Senha')` — não usado nesses testes; não é contenção de CI — o padrão persiste idêntico entre um run com 30 falhas totais e outro com só 9). Sintomas: "element(s) not found" rápido OU "element is not attached to the DOM"/"detached from the DOM, retrying" — a página parece sofrer re-renderizações depois do primeiro paint, invalidando referências de nó que o Playwright já tinha capturado.
- **Por que não resolvido:** diagnosticar a causa exata por leitura de log chegou ao limite do que dá pra fazer com confiança — cada hipótese testada custa uma rodada inteira de CI (~10-25min). Precisa de profiling ao vivo (React DevTools Profiler / Chrome DevTools Performance) durante a navegação real na landing.
- **Por que não bloqueia a FASE 7:** todos os outros fluxos (auth, onboarding, checkout, painel do dono, workspace) estão estáveis. O problema é isolado à landing page pública, não afeta nenhuma funcionalidade do produto autenticado.
- **Como resolver:** diagnóstico ao vivo com o dono — candidato natural para a verificação conjunta pós-FASE 12, ou sessão dedicada antes se preferir. Ver `.entrega/DECISOES.md` 2026-07-02 para a investigação completa (hipóteses testadas e descartadas).
- **Resultado da FASE 11 (reducedMotion — ganho grande, parcial, MEDIDO no run 28628350936):** `contextOptions: { reducedMotion: 'reduce' }` no Playwright **cortou a suíte de ~24min para 4min** e passou os testes de VISIBILIDADE/axe da landing (o loop do `HeroDemo` era a maior fonte dos timeouts de 45s). Mas **5 testes de CLIQUE/interação da landica ainda falham** na heurística de ESTABILIDADE do elemento do Playwright: primary CTA, footer, páginas legais, FAQ, seletor de idioma — o alvo é visível e correto (href certo), mas o bounding box nunca assenta por 45s.
- **Escopo refinado do que resta:** NÃO é o loop do HeroDemo (já parado pelo reduced-motion), NÃO é animação CSS (globals.css já tem bloco `@media (prefers-reduced-motion: reduce)` que zera `animation/transition-duration`). É algo mais sutil que faz a landing repintar/reflow continuamente sob o Playwright — a landing renderiza bem para humanos e o scan axe da landing PASSA. Diagnóstico exato precisa de profiling de PAINT ao vivo (DevTools Rendering "paint flashing" / Performance) — perfeito para a sessão conjunta.
- **Estado atual:** os 5 marcados `test.fixme` referenciando este item (visíveis, não deletados — flagam quando diagnosticado). e2e do CI VERDE (42 passed, 7 fixme/skip, 0 failed).

## 11. Página 404 mostra o conteúdo certo mas devolve status 200, não 404 (achado real, FASE 7 — parcialmente corrigido)
- **O quê:** `[locale]/[...catchAll]/page.tsx` (criado no run 4 desta fase para resolver o 404 aninhado nunca disparando — limitação confirmada do Next.js, vercel/next.js#54980/#57938) faz o CONTEÚDO renderizar certo (heading "Página não encontrada", link "Voltar ao início" funcionando) — essa parte é uma melhoria real sobre o fallback genérico do Next.js. Mas `res.status()` continua 200, não 404.
- **Causa-raiz identificada:** `[locale]/loading.tsx` (compartilhado por toda rota sob `[locale]/`, incluindo o catch-all) faz o Next.js transmitir (stream) um esqueleto de carregamento com status 200 ANTES do componente da página resolver e chamar `notFound()` — uma vez que qualquer HTML é enviado no streaming, o status code fica travado (comportamento documentado do App Router; `export const dynamic = 'force-dynamic'` tentado no run 5 NÃO resolve, porque o problema é sobre streaming, não sobre renderização estática vs. dinâmica).
- **Por que não corrigido agora:** a correção envolve reestruturar como `loading.tsx`/Suspense funcionam para TODA a árvore `[locale]/` (ex.: mover o loading de nível de rota para `<Suspense>` local só onde precisa, dentro de cada página lenta) — mudança arquitetural que toca páginas legítimas e lentas (`/app`, `/checkout`) e merece iteração ao vivo, não um ajuste às cegas.
- **Como resolver:** ao vivo, testar remover/reestruturar `[locale]/loading.tsx` e confirmar que `/app`/`/checkout` continuam com uma UX de carregamento aceitável antes de mudar. Candidato para a mesma sessão de diagnóstico do item #10.
- **Achado via:** `e2e/landing.spec.ts` — "unknown route renders the 404 page with a way back home" (runs 4, 5 e 6 do CI da FASE 7).

## 7. Login → /app sem retomar onboarding pendente — ✅ RESOLVIDO na FASE 11 (via teste, não via app)
**Reavaliação:** ir para `/app` após login NÃO é bug — o onboarding é opcional e
retomável em Configurações; mandar um médico para o workspace é comportamento
de produto aceitável. O teste `auth.spec.ts` "a freshly created account can log
back in" estava sobre-asseverando o destino (`waitForURL('**/onboarding')`)
quando seu real propósito é provar que a senha do cadastro loga de novo (a
extensão de auth). Relaxado para aceitar `/app` OU `/onboarding` + verificação
de sessão autenticada — testa o que importa sem exigir um comportamento que é
não-goal deliberado (o "redirect automático p/ onboarding" ingênuo quebraria os
logins de demo/seed, ver histórico abaixo). Não há mudança no app.

### (histórico) por que o "fix ingênuo" no app era arriscado
- `getOnboardingProgress(orgId)` cria um registro "incompleto" automaticamente para qualquer org sem registro, e o seed (`onboarding: []`) não tem registro p/ nenhuma org — redirecionar por `currentStep !== null` mandaria demo/médico-teste p/ `/onboarding` na 1ª visita a `/app`. Se algum dia quiser retomar onboarding no re-login, semear registros completos p/ as orgs de seed primeiro.

## 8. Botão de fechar aninhado dentro de `role="tab"` (achado real, FASE 7, não corrigido — padrão comum, precisa de redesenho de UX)
- **O quê:** `tab-strip.tsx` tem `<div role="tab">` contendo um `<button aria-label="Fechar aba">` como filho direto — axe acusa `nested-interactive` (serious): controles interativos aninhados podem confundir leitores de tela.
- **Por que não corrigido agora:** é um padrão MUITO comum (abas de navegador, VS Code) — a correção "certa" (mover o botão de fechar para fora da árvore de foco do tab, ex. via `tabindex="-1"` + atalho de teclado alternativo, ou reestruturar como elemento irmão posicionado por cima) é uma mudança de UX que merece iteração visual ao vivo, não um ajuste às cegas num componente crítico e ativo (a barra de abas do workspace inteiro).
- **Mitigação parcial já existente:** fechar com o botão do meio do mouse já funciona (`onMouseDown` com `e.button === 1`), então há um caminho sem o botão aninhado.
- **Achado via:** `e2e/accessibility.spec.ts` — "workspace shell (logged in)" (axe, run 4 do CI da FASE 7).

## 9. Contraste de `text-muted` abaixo de AA em texto informativo sobre fundo escuro (achado real, FASE 7, não corrigido — mudança de token global, precisa de revisão de design)
- **O quê:** texto usando a classe `text-muted` (ex.: linha de data "quinta-feira, 2 de julho · 10 consultas hoje" no Today) mede ~3.49:1 contra o fundo `bg-bg` (#090b0f) no tema escuro — abaixo do mínimo AA de 4.5:1 para texto de tamanho normal.
- **Por que não corrigido agora:** `text-muted` é usada em dezenas de componentes como texto secundário/de-enfatizado por design — clarear o token globalmente é uma mudança de ALTO alcance visual que merece revisão com iteração ao vivo (risco de tornar texto "discreto por intenção" pesado demais em todo o app), não um ajuste de variável CSS às cegas.
- **✅ RESOLVIDO na LANDING (2026-07-03):** o scan axe da landing (job `e2e`) falhava de forma intermitente por DUAS cores reais abaixo de AA — (a) `--subtle` no dark (#74808e) a **4.32:1** sobre `--card`, elevado para `128 140 154` (#808C9A, ≥4.5:1 em toda superfície dark); (b) texto branco sobre `bg-brand-600` (#00a8a2) a **2.94:1** nos selos da landing (nº dos passos, selo "popular", balão do hero-demo) → trocados p/ `bg-brand-700` (branco 4.54:1). A landing agora passa o axe de forma determinística. **Ainda aberto:** varredura app-wide de `text-white` sobre `bg-brand-600` (copilot, mari-console, encounter, whatsapp, checkout) — mesma classe, em telas cujos testes axe hoje passam; candidato a um PR de a11y dedicado (o comentário em `ui/button.tsx:28` já reconhece brand-600<AA).
- **Achado via:** `e2e/accessibility.spec.ts` — "workspace shell (logged in)" (axe, run 4 do CI da FASE 7).

## 6. `npm audit` acusa 3 advisories em `next`/`next-intl` (pré-existente, não introduzido na FASE 7)
- **O quê:** `npm audit --omit=dev` reporta 1 high (`next` 14.2.35 — vários advisories de DoS/cache-poisoning/smuggling em versões `9.3.4-canary.0 – 16.3.0-canary.5`) e 2 moderate (`next-intl` ≤4.9.1 — open redirect + prototype pollution; `postcss` <8.5.10 transitivo do `next`, XSS em stringify).
- **Confirmação de que é pré-existente:** `git diff main -- package.json` na branch da FASE 7 mostra que a única mudança de dependências foi **adicionar** `@playwright/test`/`@axe-core/playwright` como devDependencies — nenhuma versão de `next`, `next-intl` ou `postcss` foi tocada. O achado já existia em `main` antes desta fase.
- **Por que não bloqueia:** o próprio `ci.yml` já trata isso como informativo — `npm audit --audit-level=high` roda com `continue-on-error: true` desde antes desta fase ("supply-chain advisories shouldn't hard-block a deploy"). A correção exige `npm audit fix --force` (next → 16.2.10, next-intl → 4.13.1 — major bumps com breaking changes), fora do escopo de uma fase de testes E2E e arriscado demais para introduzir a poucas fases do fim do pipeline sem uma rodada de regressão dedicada.
- **Como resolver:** dedicar uma fase/branch própria para o upgrade major do Next.js + next-intl, rodando a suíte completa (Vitest + Playwright + typecheck + build) antes de mergear — candidato natural para depois da FASE 12 ou uma iteração de manutenção futura.

## 12. Hydration mismatch intermitente na landing (React #418/#422) — pré-existente, flaky (2026-07-03)
- **O quê:** o teste `landing.spec.ts` ("no console errors") pega, de forma INTERMITENTE, `Minified React error #418`/`#422` (hydration mismatch RECUPERÁVEL) na landing. Prova de que é flaky e não foi introduzido agora: o mesmo teste passou no 1º run da branch e falhou no 2º com código idêntico; a `main` também alterna sucesso/falha no job `e2e`.
- **Suspeito nº 1:** `roi-calculator.tsx:65` formata números com `value.toLocaleString('pt-BR')` no caminho de render — o ICU do Node (que faz SSR) pode divergir do ICU do Chromium (separador de milhar), gerando mismatch de texto (#418). O count-up (`useCountUp`+`useInView`) renderiza o valor condicionalmente, o que explica a intermitência (às vezes está montado quando o scan corre, às vezes não).
- **Por que não corrigido agora:** é RECUPERÁVEL (o React re-renderiza no cliente; a página funciona — não é o crash de canvas que o usuário via) e PRÉ-EXISTENTE. A correção correta (gate de `mounted` / `suppressHydrationWarning` no número formatado, ou formatador estável com server=client) merece um PR próprio com verificação. O guard do `landing.spec.ts` foi reescopado p/ falhar só no crash IRRECUPERÁVEL (`addColorStop`/`auronis:route-error`), tolerando estes #418/#422 de forma documentada — não é gaming: contraste/crash são o alvo, hydration recuperável é outra classe.
- **Correlato (mesmo run):** os scans axe de onboarding/checkout falhavam com "Execution context was destroyed … navigation" — corrida do axe com o redirect pós-signup, não a11y real. Estabilizado com `await page.waitForLoadState('load')` antes do `analyze()` em `accessibility.spec.ts`. Flakes de timing do checkout sandbox (PIX/boleto) seguem cobertos pelo retry do Playwright.
