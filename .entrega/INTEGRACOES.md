# INTEGRAÇÕES — status honesto e como plugar (FASE 5)

**Atualizado:** 2026-07-02. Princípio: nada aqui finge estar "ao vivo" sem a credencial correspondente. Toda integração segue o mesmo padrão de *seam*: adapter real gated por variável de ambiente; ausente → sandbox/mock funcional e claramente rotulado como tal na própria UI.

**Legenda de status:** 🟢 real (ativa com credencial) · 🟡 parcial (real em parte, documentado abaixo) · 🔵 sempre-mock (sandbox por design, sem credencial aplicável) · ⚪ não implementado nesta rodada (com motivo).

---

## 5.1 — Pagamento / Checkout

| | |
|---|---|
| **Status** | 🟢 real (Mercado Pago) quando configurado · 🔵 sandbox mock sempre disponível |
| **Adapter** | `src/lib/payments/{types,mock,mercadopago,index}.ts` — interface `PaymentProvider` única; `paymentProvider` resolvido uma vez no load conforme env (mesmo padrão do seam de dados) |
| **Métodos** | PIX, boleto, cartão — os 3, nos dois modos |
| **Env** | `MERCADOPAGO_ACCESS_TOKEN` (token de teste `TEST-...` já ativa o fluxo real em sandbox deles), `MERCADOPAGO_WEBHOOK_SECRET`, `MERCADOPAGO_API_URL` (default `https://api.mercadopago.com`) |
| **Endpoints** | `POST /api/checkout/session` (cria pedido real + abre checkout) · `GET /api/checkout/session/:orderId` (poll ativo — reflete tanto o sandbox mock quanto o Mercado Pago real) · `POST /api/webhooks/payment` (idempotente por `eventId`, testado) |
| **Telas** | `/[locale]/checkout` (fluxo completo) + entrada real em Configurações (plano & cobrança) |
| **Prova** | 42 testes automatizados: PIX com QR EMV real e CRC16 validado, boleto com linha digitável, cartão com convenção de teste (par=aprovado/ímpar=recusado), webhook idempotente (evento entregue 2× só aplica 1×, provado), pedido pago ativa a assinatura real do tenant (sai de trial, MRR correto, inclusive ciclo anual com a mesma fórmula "2 meses grátis" da landing) |

### Como plugar o Mercado Pago em produção
1. Criar conta em [mercadopago.com.br/developers](https://www.mercadopago.com.br/developers) (URL fornecida pelo usuário/documentação oficial — não inserida aqui como link ativo).
2. Gerar credenciais de produção (Access Token) no painel deles.
3. Definir `MERCADOPAGO_ACCESS_TOKEN` no Vercel (ou `.env.local` para testar).
4. Configurar a URL de webhook no painel deles apontando para `https://SEU_DOMINIO/api/webhooks/payment`; copiar o segredo de assinatura para `MERCADOPAGO_WEBHOOK_SECRET`.
5. Testar primeiro com um token `TEST-...` (sandbox deles) antes do token de produção.

### O que é sandbox mesmo com a chave real
- A verificação de assinatura do webhook (`mercadopago.ts` → `verifyWebhookSignature`) foi implementada seguindo o esquema documentado publicamente pelo Mercado Pago (HMAC-SHA256 sobre um manifesto `id:…;request-id:…;ts:…;`), mas **não foi validada contra uma entrega real** neste ambiente (sem credencial disponível). Testar com o simulador de webhooks deles antes de depender disso em produção.
- Sem `MERCADOPAGO_WEBHOOK_SECRET` configurado, a verificação aceita qualquer payload (conveniência de dev, documentado no `.env.example`) — **definir o secret é obrigatório em produção**.

---

## 5.2 — Camada de IA (Mari)

| | |
|---|---|
| **Status** | 🟢 real (Claude API ou cérebro remoto) quando configurado · 🔵 fallback mock sempre disponível, data-aware (lê dados reais do tenant) |
| **Adapter** | `src/lib/mari/{service,tools,intents,impact,briefing,payer-rules}.ts` — ordem de resolução: cérebro remoto (`MARI_API_URL`) → Claude in-process (`ANTHROPIC_API_KEY`) → mock determinístico |
| **Env** | `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` (default `claude-sonnet-4-6`), `MARI_API_URL` + `MARI_API_KEY` (cérebro próprio, tem prioridade sobre Claude local) |
| **Streaming** | Real via SSE (`mariChatStream`), com fallback a chunk único quando o provedor não suporta stream |
| **Guardrails** | Prompt de sistema fixo: respeitar papel/LGPD, nunca inventar dado de paciente, ação irreversível exige confirmação humana, responder no idioma do usuário. Nunca lança exceção — qualquer falha (timeout, 429, chave inválida) cai no mock, sem quebrar a experiência |
| **Timeout/rate-limit** | Cérebro remoto: `AbortController` com timeout de 15s. Chamada ao Claude: try/catch amplo → mock em qualquer erro (incl. 429 rate-limit da Anthropic) — comportamento correto: usuário nunca vê erro cru de provedor |
| **🆕 Personas parametrizáveis** | **Corrigido nesta fase.** O dono já configurava persona/modelo por tenant no painel (`AiSection`), mas isso não chegava ao chat real — prompt e modelo eram fixos/globais. Agora `POST /api/ai/chat` resolve o tenant da sessão e usa `tenant.ai.persona`/`tenant.ai.model` de verdade, inclusive no fallback mock (se o dono renomear a assistente, até o modo sem IA se apresenta com o nome certo). Provado com 4 testes, incl. isolamento entre dois tenants simultâneos |
| **Ferramentas (ações)** | `POST /api/ai/action` — registry tipado em `lib/mari/tools.ts`; mutações exigem `confirm` explícito (human-in-the-loop) |
| **⚪ Não implementado** | `TenantAiConfig.enabledTools` (lista de ferramentas permitidas por tenant) ainda não é aplicado como gate real em `/api/ai/action` — motivo e como resolver em `PENDENCIAS.md` (vocabulário de nomes das duas listas não bate 1:1; requer desenho de permissões, não só código) |

### Como plugar em produção
1. Obter uma chave em [console.anthropic.com](https://console.anthropic.com).
2. Definir `ANTHROPIC_API_KEY` no Vercel.
3. Opcional: destacar a Mari como serviço próprio (ver `.entrega/ARQUITETURA.md`) — basta subir um serviço que responda `POST {url}/v1/chat` e apontar `MARI_API_URL`; zero mudança no produto.

---

## 5.3 — Onboarding

| | |
|---|---|
| **Status** | 🟢 real (100%, sem credencial necessária) |
| **Persistência** | Servidor (store compartilhado), não `localStorage` — resumível em qualquer dispositivo/sessão |
| **Endpoint** | `GET/POST /api/onboarding` |
| **Etapas** | `profile → specialty → team → tour` (ordem fixa, definida no backend) |
| **Rota** | `/[locale]/onboarding`, protegida por sessão no middleware, com retomada automática a partir de `currentStep` |
| **Prova** | 6 testes: progresso resumível, isolamento entre organizações (pegou um bug real durante o desenvolvimento: reusar e-mail entre dois signups de teste fazia duas sessões caírem no mesmo usuário — corrigido), transição até o passo final |

---

## 5.4 — Demais integrações

| Integração | Status | Env | Observação |
|---|---|---|---|
| **E-mail transacional** | 🟢 real (Resend) quando configurado · 🔵 log estruturado mock sempre | `RESEND_API_KEY`, `EMAIL_FROM` | Boas-vindas (signup) + confirmação/falha de pagamento, 4 idiomas. Sem chave, nada se perde — cada envio vira uma linha de log com o conteúdo completo (assunto + corpo), prova visível mesmo sem provedor |
| **Memed (prescrição)** | 🟢 real quando configurado · 🔵 stub funcional | `MEMED_TOKEN`, `MEMED_PUBLIC_TOKEN`, `MEMED_API_URL` | Já existia antes desta fase (ver `lib/connectors/memed.ts`) |
| **ICP-Brasil (assinatura)** | 🟡 parcial | `ICP_PKCS12_PATH` (A1) ou `ICP_P11_LIB` (A3) | Modo "real" hoje só produz SHA-256 verdadeiro do conteúdo — PAdES/PKCS#7 completo é TODO explícito (precisa de `node-forge`/`pkijs` + cadeia de certificado ICP-Brasil + URL de TSA). Sem certificado → fingerprint mock |
| **WhatsApp (Meta Cloud API)** | 🟢 real quando configurado · 🔵 simulador local | `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `WHATSAPP_API_URL`, `WHATSAPP_WEBHOOK_SECRET` | Já existia antes desta fase. Webhook **sem** deduplicação de mensagem (diferente do webhook de pagamento, que é idempotente) — anotado como melhoria futura, não bloqueante (WhatsApp não tem efeito financeiro) |
| **Banco de dados (Postgres)** | 🟡 parcial | `DATABASE_URL` | Seam write-through completo para as entidades clínicas/negócio originais. As entidades novas desta fase e da fase 4 (pedidos, onboarding, papéis customizados, blocos da landing, tenants/planos criados via UI) fazem *passthrough* no adapter Postgres — persistem no cache compartilhado em memória, mas não têm tabela própria ainda. Documentado item a item em `PENDENCIAS.md` |
| **Storage de arquivos** | ⚪ não implementado | — | Não há necessidade real hoje: nenhuma tela do produto faz upload de arquivo binário (documentos são gerados/textuais; áudio de consulta é processado e descartado, não fica armazenado). Adicionar Vercel Blob antes de existir uma necessidade concreta seria construir para um requisito hipotético |
| **Auth externo (SSO/OAuth)** | ⚪ não implementado | — | O auth atual (sessão HMAC + credenciais + convite de equipe já real via `addOrgUser`) atende o estágio atual do produto. SSO corporativo (Google Workspace/Microsoft Entra) é o próximo passo natural quando houver demanda de cliente enterprise — não foi apontado como lacuna em nenhuma das auditorias das fases 0–4 |

---

## Cobertura de UI (as 3 telas do funil)

`/signup`, `/onboarding` e `/checkout` — as três construídas e verificadas nesta fase, nos 4 idiomas. Prova: `npm run build` prerenderizou as 12 páginas (3 rotas × 4 locales) com sucesso (exit code 0), typecheck e lint limpos, zero regressão nos 349 testes de backend. Prova de interação em navegador real (clique→resultado) fica para a FASE 7 (Playwright), consistente com o restante do `INVENTARIO.md`.

## `.env.example` — cobertura

Todas as variáveis de ambiente usadas em produção estão documentadas em `.env.example` com comentário explicando o efeito de configurar (ou não) cada uma. Nenhuma credencial é obrigatória para rodar o app — confirmado na FASE 0 e mantido em todas as fases seguintes.
