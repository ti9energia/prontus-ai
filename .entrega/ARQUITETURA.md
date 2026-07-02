# ARQUITETURA — modularização, fronteiras e portabilidade

**Atualizado:** 2026-07-01 (FASE 1)

## Visão em camadas

```
UI (components/)          screens/ (22 telas) · workspace/ (shell) · owner/ · landing/ · ui/ (primitivos)
                                   │  cada tela = módulo registrado em workspace/registry.tsx
domínio + dados (lib/)    data/ · mari/ · auth/ · connectors/ · asr/ · events/ · workspace/ · api/ · tuss/ · config/
                                   │  cada módulo expõe API pública via barrel
infra (app/api/)          rotas finas: validação zod → módulo de lib → resposta
```

## Regra de fronteira (enforçada por lint)

Todo módulo de `src/lib/` tem **entradas públicas explícitas**; import profundo (`@/lib/<modulo>/<arquivo>`) é **erro de lint** (`no-restricted-imports` em `.eslintrc.json`) fora do próprio módulo. Testes internos do módulo podem importar fundo.

| Módulo | Entrada isomórfica | Entrada server (Node) | Entrada client |
|---|---|---|---|
| `lib/auth` | `@/lib/auth` (sessão HMAC + matriz de permissões) | `@/lib/auth/server` (credenciais, scrypt) | `@/lib/auth/client` (useSession/SessionProvider) |
| `lib/mari` | `@/lib/mari` (tools, intents, impact, briefing, payer-rules) | `@/lib/mari/server` (mariChat/stream: remote → Claude → mock) | — |
| `lib/connectors` | `@/lib/connectors` (contratos, registry, tipos) | `@/lib/connectors/server` (Memed/ICP/WhatsApp reais ou stub) | — |
| `lib/data` | `@/lib/data` (seam: Postgres write-through ou in-memory) | — | — |
| `lib/events` | `@/lib/events` (bus tipado) | — | — |
| `lib/workspace` | `@/lib/workspace` (abas/split + entitlements) | — | — |
| `lib/api` | `@/lib/api` (auth por API key, envelope v1) | — | — |
| `lib/asr` | `@/lib/asr` (transcrição Whisper/Azure/demo) | — | — |
| `lib/config` | `@/lib/config` (catálogo tipado de env — única porta p/ process.env) | — | — |

**Por que 3 entradas?** Split de runtime: o barrel isomórfico nunca puxa `node:crypto`/SDKs para o bundle do client nem React para o edge middleware. É a mesma disciplina de `pkg/exports` de um pacote npm — o que torna cada módulo extraível como pacote sem mudanças.

## Inversão de dependência (ports & adapters)

- **Dados:** `lib/data/index.ts` resolve o adapter no load — `DATABASE_URL` → Prisma write-through; senão in-memory. ~70 funções, mesma assinatura síncrona. Consumidor nunca sabe qual adapter roda.
- **IA (Mari):** `mariChat()` resolve provedor por prioridade: `MARI_API_URL` (cérebro remoto HTTP) → `ANTHROPIC_API_KEY` (Claude in-process) → mock determinístico que lê dados reais. Contrato único `MariChatRequest/Response`; streaming SSE.
- **Connectors:** contrato `Connector` em `connectors/types.ts`; cada implementação é gated por env (`isXReal()`), com stub funcional idêntico em UX.
- **Config:** `lib/config` é o único ponto que lê `process.env` (getters lazy, edge-safe). Regra: variável nova entra na config + `.env.example`, nunca `process.env.X` solto.
- **Feature flags + entitlements:** módulo aparece na UI se `flag ON ∧ plano concede ∧ papel permite` (`lib/workspace/entitlements.ts` + painel do dono).
- **Tema/tokens:** CSS vars semânticas (`globals.css`) + ramps em `tailwind.config.ts` — outro sistema injeta outra identidade trocando só os tokens.

## Registro de telas (0D)

Cada aba do produto é um módulo de UI registrado em `components/workspace/registry.tsx`: `{ key, título i18n, ícone, grupo, loader lazy }`. Ligar/desligar = flag no painel do dono; adicionar tela = 1 arquivo em `screens/` + 1 entrada no registry.

## Receita: extrair um módulo para outro sistema

### Exemplo provado: módulo TISS/pré-glosa (motor 100% local)
O que sai junto (lista exata):
1. `src/lib/tuss/` — tabela TUSS + validação (sem deps externas)
2. `src/lib/mari/payer-rules.ts` (regras de glosa por convênio) — via `@/lib/mari`
3. `src/components/screens/tiss.tsx` + `screens/billing.tsx` (UI)
4. Tipos de `src/lib/types.ts`: `TissGuide`, `TissIssue`, `Encounter`
5. Contrato de dados: `listGuides/createGuideFromEncounter/submitGuide` (reimplementar sobre o banco do sistema-destino — assinaturas em `lib/data/store.ts`)
6. Tokens de tema (CSS vars) — o destino fornece os seus

Dependências externas do módulo: só React + Tailwind + lucide. Nenhum import profundo — validado por lint.

### Exemplo: extrair a Mari (camada de IA) como serviço próprio
`lib/mari` já fala o contrato do cérebro remoto: suba qualquer serviço que responda `POST /v1/chat` e aponte `MARI_API_URL` — zero mudança no produto. Para levar a Mari a outro sistema, copie `lib/mari/` + `lib/config` (seção `ai`) e forneça um `fallback()` que leia os dados do sistema-destino.

## Skills reutilizáveis

Nenhuma skill nova criada ainda; padrões candidatos a skill (avaliar ao final): scaffold de checkout BR (FASE 5), setup PWA com update-flow (FASE 6). Registrar aqui quando criados.

## Caminho para loja de apps (documentado, não bloqueante)

PWA é a distribuição atual (FASE 6: manifest completo com ícones any+maskable em 192/512, service worker com fluxo de atualização real, offline por idioma). Loja depois, sem mudar código do produto:

- **Android — TWA (Trusted Web Activity):** usar [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) apontando para `https://SEU_DOMINIO/manifest.webmanifest` (já completo). Gera o projeto Android/Gradle pronto para a Play Store. Precisa de: domínio com HTTPS válido (já exigido pelo CSP) + `assetlinks.json` em `/.well-known/` para vínculo de app verificado.
- **iOS/Android — Capacitor:** embrulha o build `output:'standalone'` já existente (`next.config.mjs`) num shell nativo, reaproveitando 100% do PWA. Alternativa quando TWA não é suficiente (ex.: precisa de APIs nativas que o browser não expõe).
- Em ambos os casos: os ícones/splash já gerados (`scripts/process-assets.mjs`) e o manifest cobrem o essencial; splash screens específicas por resolução de dispositivo iOS (Apple `apple-touch-startup-image`, dezenas de tamanhos) ficam para quando houver alvo real de App Store — não são exigidas pelo Lighthouse PWA nem pela instalação via navegador, que já funciona hoje.
