# Mari — a inteligência clínica da Auronis Health

> *"Inteligência clínica em cada consulta."*

Mari é a IA da Auronis Health. Ela não é um chatbot solto: ela **entende o sistema
inteiro** e aparece em dois lugares, com duas personalidades, para dois públicos —
o **dono da plataforma** e **quem usa o aplicativo**. Este documento explica a
lógica dela para os dois.

Para a arquitetura técnica (como desacoplar a Mari num servidor próprio, contrato
de API, conectores), veja [`ARCHITECTURE.md`](./ARCHITECTURE.md).

---

## 1. Para o dono da SaaS — Mari, o cérebro da operação

No **Console do Dono** (`/owner`), a Mari deixa de falar de pacientes e passa a
falar de **negócio**. Ela é a sua sócia operacional.

### O que ela enxerga
- **Receita & crescimento:** MRR, crescimento de MRR, trials a converter.
- **Risco:** churn, contas em risco, inadimplência.
- **Uso:** organizações (tenants) e médicos ativos, taxa de erro, gasto de IA.
- **Expansão:** contas acima de 80% de uso (candidatas a upgrade/upsell).

### Como ela ajuda a crescer
| Você pergunta… | Mari devolve… |
|---|---|
| "Como está o churn?" | A taxa, **quais contas** estão em risco e uma régua de retenção pronta. |
| "Onde tem upsell?" | As contas de alto uso e uma proposta com ROI por conta. |
| "Como vendo mais rápido?" | Um pitch que lidera pelo número que dói (glosa), com um CTA único. |
| "O que melhorar no produto?" | As 3 alavancas de maior impacto na retenção. |
| "Como está o crescimento?" | MRR, variação, e a maior alavanca do momento. |

### Modelo de acesso, custo e segurança
- **Login separado e fail-closed.** O dono entra por um login próprio; **não há
  atalho de dono dentro do workspace do médico**. O acesso de owner só é honrado
  com `AUTH_SECRET` real configurado (veja [`auth-model`](../README.md)).
- **Dados sensíveis.** O console expõe dados de toda a plataforma — por isso a
  rota `/api/owner/chat` exige sessão **owner** (403 para qualquer outro).
- **Nunca inventa número.** A Mari responde a partir dos dados reais da
  plataforma que o sistema injeta como contexto; ela é instruída a não fabricar.

---

## 2. Para quem usa o app — Mari, a copilota clínica

No workspace do médico/equipe, a Mari é a **copilota clínica**: calorosa,
concisa e precisa. Ela fecha o ciclo da consulta — da fala ao prontuário e à guia.

### O que ela faz
- **Resume o prontuário** estruturado a partir do áudio da consulta.
- **Gera a guia TISS** da consulta a partir da nota aprovada.
- **Explica glosas** e prioriza reenvios de maior valor.
- **Traz a agenda** do dia, pendências e recomendações do agente.
- **Responde pelo WhatsApp** — você pergunta, ela traz.

### Privacidade & confiança (o que faz o médico confiar)
- **LGPD por padrão.** Áudio criptografado, expurgável a qualquer momento; o
  paciente é informado de que a consulta é gravada e transcrita.
- **Human-in-the-loop.** Ações irreversíveis (enviar guia, finalizar nota)
  **sempre pedem confirmação humana**. A Mari sugere, você aprova.
- **Ela respeita o seu papel.** Médico, faturista, gestor — cada um vê o que
  pode ver.
- **Ela não inventa dado clínico.** Se não está no prontuário, ela não afirma.

### Como falar com ela
- Pelo **dock da copilota** (botão Mari no topo, ou `Ctrl/⌘ + J`).
- Por **voz** (ditado por microfone) e ela **fala de volta** (TTS).
- Ela conhece a **tela em que você está** — o contexto entra na conversa.

---

## 3. Como a Mari funciona por baixo (resumo técnico)

A Mari tem **uma porta de entrada** no código — `mariChat()` em
`src/lib/mari/service.ts` — e duas *surfaces* que a chamam:

| Surface | Rota | Persona | Contexto injetado |
|---|---|---|---|
| `clinical` | `POST /api/ai/chat` | copilota clínica | tela atual, dados da clínica |
| `owner` | `POST /api/owner/chat` | cérebro de negócio | MRR, churn, uso, tenants |

Cada pedido passa por **validação + sanitização** (Zod, limite de tamanho,
anti-injeção), é **auditado**, e então a Mari resolve a resposta nesta ordem:

```
1. Cérebro remoto da Mari   (se MARI_API_URL configurado)   → source: "remote"
2. Modelo local (Claude)    (se ANTHROPIC_API_KEY + permitido)→ source: "claude"
3. Mock determinístico       (sempre disponível, ciente dos dados) → "mock"
```

Além de conversar, a Mari **age**: um registro de *tools* (`src/lib/mari/tools.ts`)
deixa ela executar ações reais — puxar a agenda, resumir o prontuário, gerar a guia
e rodar a **verificação pré-glosa** — via `POST /api/ai/action`, com confirmação
humana para o que muda estado. Na tela TISS, o botão **"Pré-glosa (Mari)"** já roda
essa checagem e mostra o score de prontidão.

O passo 3 garante que **a Mari nunca quebra**: mesmo sem nenhum modelo, ela dá
uma resposta útil e ciente dos dados (offline-safe). O passo 1 é o futuro —
**desacoplar a Mari para um servidor próprio**, treiná-la lá, e conectá-la ao
sistema (e a outros sistemas) por API. Isso já está preparado no código; o
contrato e o plano estão em [`ARCHITECTURE.md`](./ARCHITECTURE.md).
