# Blueprint — Copiloto de IA embarcado + cérebro desacoplável + conectores

Um padrão **genérico e niche-agnóstico** para colocar uma IA ("copiloto") dentro
de qualquer SaaS, de um jeito que: (a) funciona desde o dia 1, (b) pode ser
**desacoplada para um servidor próprio** depois sem reescrever o produto, e (c)
**conecta com sistemas externos** por um contrato único. Foi extraído da
Auronis Health, mas serve para qualquer nicho — jurídico, financeiro, logística,
educação, etc.

> Substitua "Mari" pelo nome do seu copiloto e "clínica" pelo seu domínio. A
> estrutura não muda.

---

## A ideia em uma frase

> **Uma porta de entrada no código, várias surfaces que a chamam, e o cérebro
> mora onde você quiser (in-process hoje, servidor próprio amanhã) — com
> degradação graciosa para nunca quebrar.**

---

## As 4 camadas

```
┌────────────┐   ┌────────────┐   ┌────────────┐   ┌────────────┐
│ 1. SURFACE │──►│ 2. SEAM    │──►│ 3. BRAIN   │   │ 4. CONNECTORS│
│  (onde a   │   │  (1 função │   │  remoto /  │   │  sistemas    │
│   IA aparece)  │   única)   │   │  local /   │   │  externos    │
│            │   │            │   │  mock)     │◄──┤  (ferramentas)│
└────────────┘   └────────────┘   └────────────┘   └────────────┘
```

### 1. Surface — onde a IA aparece
Cada lugar do produto onde a IA fala é uma *surface* com **persona** e
**contexto** próprios (ex.: um copiloto para o usuário final; um "cérebro de
operação" para o dono). A surface só **monta o contexto e chama a seam**.

### 2. Seam — a porta única (o segredo do desacoplamento)
**Uma só função** que todo o produto chama. Ela esconde *onde* a inteligência
roda. Trocar in-process por servidor remoto é mudar **ambiente, não código**.

```ts
type Source = 'remote' | 'local' | 'mock' | 'mock-fallback';

interface CopilotRequest {
  surface: string;                       // qual contexto/persona
  system: string;                        // persona + contexto montados
  messages: { role: 'user'|'assistant'; content: string }[];
  locale: string;
  context?: Record<string, unknown>;     // estruturado, p/ o cérebro remoto
  allowModel: boolean;                   // gate de custo/auth do chamador
  maxTokens?: number;
  fallback: () => string;                // resposta determinística sem modelo
}

async function copilotChat(req: CopilotRequest): Promise<{ reply: string; source: Source }> {
  if (req.allowModel) {
    const remote = await callRemote(req);          // 1) servidor próprio (env BRAIN_URL)
    if (remote) return { reply: remote, source: 'remote' };
    if (process.env.MODEL_API_KEY) {               // 2) modelo local
      const local = await callLocalModel(req);
      return local ? { reply: local, source: 'local' }
                   : { reply: req.fallback(), source: 'mock-fallback' };
    }
  }
  return { reply: req.fallback(), source: 'mock' }; // 3) sempre responde
}
```

### 3. Brain — onde a inteligência roda
Resolução **na ordem** (o primeiro que responde vence):
1. **Remoto** (`BRAIN_URL`) — o cérebro desacoplado: memória, treino/fine-tuning,
   ferramentas e RAG próprios; multi-tenant e multi-app.
2. **Local** (`MODEL_API_KEY`) — chamada direta a um LLM, in-process.
3. **Mock** — resposta determinística ciente dos dados. Garante **offline-safe**
   e ótimo para demos, testes e degradação.

Contrato do cérebro remoto (estável dos dois lados):
```jsonc
POST {BRAIN_URL}/v1/chat   Authorization: Bearer {BRAIN_KEY}
// req:  { surface, system, messages, locale, context, maxTokens }
// res:  { reply }
```

### 4. Connectors — falar com sistemas externos
A IA e o app alcançam terceiros por **um contrato único**, nunca contra o SDK do
fornecedor. Capabilities viram **ferramentas** que o cérebro pode descobrir e usar.

```ts
interface Connector {
  id: string; name: string; category: string;
  check(ctx: ConnectorContext): Promise<'connected'|'disconnected'|'error'>;
  capabilities: Record<string, {
    id: string;
    invoke(input: unknown, ctx: ConnectorContext): Promise<{ ok: boolean; data?: unknown; error?: {code:string;message:string} }>;
  }>;
}
interface ConnectorContext { orgId: string; config: Record<string,string>; locale?: string }
interface ConnectorRegistry { get(id:string): Connector|undefined; list(cat?:string): Connector[]; register(c:Connector): void }
```

---

## Princípios transversais (valem para qualquer nicho)

| Princípio | Por quê |
|---|---|
| **Rotas finas** | validar → montar contexto → chamar a seam → responder. Zero regra no handler. |
| **Validação na borda** | todo input por um schema (Zod/equivalente), com limites e sanitização. |
| **Gate de custo/auth** | `allowModel` decide quem alcança modelo pago / cérebro remoto. |
| **Degradação graciosa** | remoto → local → mock. A IA **nunca** derruba uma requisição. |
| **Timeout no remoto** | um cérebro lento não pode travar o produto. |
| **Multi-tenant** | `orgId` em todo connector; nada cruza tenants. |
| **Segredos via env** | nunca hard-coded; o host injeta config. |
| **Auditoria** | toda ação da IA é registrada. |
| **Human-in-the-loop** | ações irreversíveis pedem confirmação humana. |
| **Nunca inventar dado** | a IA responde do contexto injetado; não fabrica. |

---

## Como adaptar para outro nicho (checklist)

1. **Defina as surfaces.** Quem fala com a IA? (usuário final, admin, dono…)
   Para cada uma: persona + que contexto injetar.
2. **Escreva o `fallback()` de cada surface.** Respostas determinísticas e
   cientes dos dados — isso te dá demo e offline desde o dia 1, sem custo de LLM.
3. **Implemente a seam** (`copilotChat`) com a resolução remoto→local→mock.
4. **Exponha as rotas finas** por surface, com validação e gate de custo/auth.
5. **Modele os connectors** do seu nicho (ex.: ERP, gateway de pagamento, CRM,
   transportadora…) atrás do contrato único.
6. **Decouple quando fizer sentido:** suba o cérebro, set `BRAIN_URL`, migre sem
   tocar no produto. Conecte outros sistemas pelo mesmo contrato (`surface`).

---

## Variáveis de ambiente (padrão)

| Var | Para quê |
|---|---|
| `AUTH_SECRET` | assina sessões (fail-closed em produção) |
| `MODEL_API_KEY` / `MODEL_NAME` | modelo local |
| `BRAIN_URL` / `BRAIN_KEY` | cérebro remoto desacoplado |
| *(por connector)* | credenciais de cada sistema externo |

---

## Mapa de arquivos de referência (na Auronis Health)

| Camada | Arquivo |
|---|---|
| Seam + brain | `src/lib/mari/service.ts` |
| Surfaces | `src/app/api/ai/chat/route.ts`, `src/app/api/owner/chat/route.ts` |
| Connectors | `src/lib/connectors/types.ts` |
| Auth/sessão | `src/lib/auth/session.ts`, `src/middleware.ts` |
| Produto da IA | [`MARI.md`](./MARI.md) · arquitetura: [`ARCHITECTURE.md`](./ARCHITECTURE.md) |
