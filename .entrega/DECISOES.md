# DECISÕES

## 2026-07-02 — Incidente: 3 agentes de UI em paralelo retornaram sem produzir arquivos
- Delegados 3 agentes em background para construir UI de signup/onboarding/checkout (specs completas, contratos de API prontos). Os três voltaram com mensagem atípica: "You've hit your session limit · resets 5am (America/Fortaleza)" e, em dois casos, aviso de que o classificador de segurança não pôde revisar o trabalho.
- **Verificação:** `git status` após os três terminarem mostrou ZERO arquivos novos/alterados além dos meus próprios — nenhuma das três frentes produziu qualquer artefato persistido, apesar de reportarem 62–91 chamadas de ferramenta cada. Conclusão: o limite de sessão interrompeu os agentes antes de qualquer escrita durável (ou o trabalho não foi persistido por algum outro motivo) — não confiei no "resultado" reportado, tratei como se nada tivesse sido feito.
- **Decisão:** não tentei novos agentes em background (risco de bater no mesmo limite outra vez, desperdiçando mais). Constatei que o reset (5h em Fortaleza, UTC-3) já tinha passado no horário corrente (~14h UTC) — o próximo reset ficaria a ~17-18h de distância. Passei a construir as três telas (signup, onboarding, checkout) diretamente eu mesmo, sequencialmente, reaproveitando o mesmo contexto/specs que dei aos agentes. Terminado com sucesso: build de produção com exit code 0 (confirmado via Bash — o PowerShell reportou 255 por engano, interpretando uma linha de warning do Next.js como erro), typecheck/lint limpos, 349 testes de backend seguem verdes.
- **Aprendizado registrado:** ao delegar tarefas grandes (>10min) em paralelo, verificar sempre `git status`/diff real após a conclusão antes de confiar no texto do resultado — especialmente quando a mensagem final foge do padrão esperado.

## 2026-07-02 — Demo button: não reintroduzir na UI de signup
- Ao construir `signup-form.tsx`, notei que `login-form.tsx` não tem mais botão de demo visível (embora `DEMO_MODE`/`demoIdentity()` sigam funcionais no backend, e `auth.demoNote`/`auth.enterDemo` sigam nos catálogos de i18n, agora órfãos). Confirmado na minha memória persistente (`landing-design-directives`): o dono já pediu explicitamente a remoção do botão de demo em sessão anterior — não é bug, é decisão de produto. Não adicionei nenhum atalho de demo na tela de cadastro nem reintroduzi o botão no login.
- As chaves i18n órfãs (`auth.demoNote`, `auth.enterDemo`) e o `GETTING-STARTED.md` (que ainda descreve o botão de demo) ficam para a FASE 11 (limpeza/documentação) — fora do escopo desta fase.

## 2026-07-02 — FASE 5: escopo do signup/onboarding frente ao modelo de dados atual
- **Achado:** todo o núcleo clínico (`listPatients/listEncounters/notes/guides/labOrders`) é um dataset global único, não segmentado por `orgId` — é assim para TODAS as identidades hoje (owner, médico-teste, demo), não é uma lacuna introduzida pelo signup. Só as entidades voltadas ao dono (`tenants`, `users` via `orgId`, `apiKeys`) já são multi-tenant de verdade.
- **Decisão:** o signup cria Tenant + User REAIS (persistidos, aparecem no painel do dono, login funciona de verdade); o onboarding persiste progresso REAL por org; o checkout cria Order/Subscription REAIS por tenant. Ao entrar em `/app`, o novo usuário vê o mesmo workspace clínico de demonstração compartilhado que médico-teste/demo já veem hoje — isso é consistente com o produto atual, não uma mentira nova.
- **Por que não isolar dados clínicos por tenant agora:** exigiria re-arquitetar dezenas de funções do store (patients/encounters/notes/guides/labs) que hoje assumem um único contexto — uma migração de arquitetura própria, desproporcional ao pedido desta fase (integrações pré-prontas). Registrado como fronteira consciente em `PENDENCIAS.md`, candidato a uma fase própria se o dono priorizar multi-tenancy clínica completa.
- A sessão (`useSession()`) já reflete a identidade real de quem logou (nome/e-mail) na top-bar — só o *conteúdo clínico* de demonstração é compartilhado, a identidade de quem está logado é sempre verdadeira.

## 2026-07-02 — FASE 5: Mercado Pago como provedor de referência do checkout
- Adapter real implementado contra a API do Mercado Pago (PIX + boleto + cartão nativos em uma API só, documentação estável, mais usado no Brasil) — mesmo padrão dos demais seams (Memed/ICP/WhatsApp): só ativa com `MERCADOPAGO_ACCESS_TOKEN`; sem a chave, cai no mock em sandbox determinístico. Nenhuma chamada real ocorre sem credencial (princípio 5 — pré-pronto é honesto).

## 2026-07-02 — FASE 4: `screens/integrations.tsx` fica session-only (decisão consciente, não lacuna)
- Considerei ligar o toggle conectar/desconectar e o modal de config ao `upsertTenantConnector` real (o mesmo usado pela `AiSection` do owner) para sobreviver a reload.
- Decidi NÃO fazer isso: dos 20 provedores listados nessa tela (Tasy, MV Soul, iClinic, Feegow, Unimed, Bradesco, SulAmérica, Amil, Hapvida, Auronis ASR, Whisper, Azure Speech, Google Speech, WhatsApp Business, Telegram), nenhum tem conector real implementado em `lib/connectors` — os conectores reais do produto são Memed, ICP-Brasil e WhatsApp Cloud (documentados via env var, `INTEGRACOES.md` virá na fase 5). Persistir esse toggle no servidor seria "persistência-teatro": sobreviveria a reload sem passar a fazer nada a mais.
- A tela já rotula honestamente "Superfície de demonstração — as credenciais ficam apenas neste navegador, nesta sessão" — mover para o store do servidor tornaria essa frase falsa.
- Registrado como ⚠️ justificado em `INVENTARIO.md`, não como pendência.

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
