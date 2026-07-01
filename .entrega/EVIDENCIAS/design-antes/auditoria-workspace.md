# Auditoria "antes" — Workspace (shell + 23 telas) (FASE 2, 2026-07-01)

> Evidência por análise de código (sem servidor, diretiva do dono).
> Shell e primitivos de alto nível (foco-trap/inert/aria-live, error boundary por pane, toasts, ⌘K).
> Telas clínicas centrais maduras (encounter, review, tiss, patients, signature, documents, marketplace).
> Falhas concentradas em: confirmação de destrutivas, i18n fragmentado, telas administrativas chapadas.

## Tabela tela × 4 estados (✅ ok · ◐ parcial · ❌ ausente · — n/a)

| Tela | Loading | Vazio | Erro | Sucesso |
|---|:--:|:--:|:--:|:--:|
| today | ✅ | ❌ | ◐ | ✅ |
| agenda | ✅ | ✅ | ◐ | ✅ |
| encounter | ◐ | ✅ | ◐ | ✅ |
| review | ✅ | ◐ | ◐ | ✅ |
| tiss | ✅ | ◐ | ✅ | ✅ |
| requisicao | ✅ | ❌ | ◐ | ✅ |
| patients | ✅ | ✅ | ◐ | ✅ |
| exams | ✅ | ✅ | ◐ | ✅ |
| billing | ◐ | ✅ | ✅ | ✅ |
| faturamento | ✅ | ❌ | ◐ | ✅ |
| reports | ✅ | ❌ | ◐ | — |
| templates | ✅ | ✅ | ◐ | ✅ |
| documents | ✅ | ✅ | ✅ | ✅ |
| signature | ✅ | ✅ | ✅ | ✅ |
| agent | ◐ | ✅ | ✅ | ✅ |
| agents | ✅ | — | ❌ | ✅ |
| whatsapp | ◐ | — | ❌ | ✅ |
| automations | ✅ | — | ◐ | ✅ |
| integrations | ✅ | — | ◐ | ✅ |
| marketplace | ✅ | ✅ | ✅ | ✅ |
| equipe | ✅ | ❌ | ◐ | ✅ |
| contratos | ✅ | ❌ | — | — |
| settings | ✅ | — | ✅ | ✅ |

## P0
1. **Destrutivas sem confirmação** (não existe ConfirmDialog): revogar API key de produção (`marketplace.tsx:345-348`), remover membro (`settings.tsx:498-501`), excluir documento clínico (`documents.tsx:393-396`), remover procedimento TISS (`tiss.tsx:140-145`), negar autorização (`requisicao.tsx:103`), desconectar integração (`integrations.tsx:183`), remover alergia (`patients.tsx:479-482`). `window.confirm` cru em `agenda.tsx:173`.
2. **Perda silenciosa de dados no TISS:** campos Operadora/Carteirinha/Profissional/Conselho/CBO com `defaultValue` nunca lidos no submit (`tiss.tsx:254,265-278`) — edição descartada sem aviso.

## P1
3. **i18n bifurcado:** metade das telas com `L()` inline / `COPY` (agenda, reports, faturamento, requisicao, contratos, equipe, agents, automations, marketplace, signature, settings, whatsapp; review/agent/integrations híbridas).
4. **Tooltip Recharts com cor fixa** quebra tema claro (`billing.tsx:176`, `reports.tsx:79-86`).
5. **Async sem feedback no controle:** `agent.tsx:335`, `billing.tsx:85`, `documents.tsx:564`; falha de mic cai silenciosa p/ demo (`encounter.tsx:198-201`).
6. **EmptyState faltando** em today (`:193`), faturamento (`:86`), requisicao (`:54`), equipe (`:75`), reports.
7. **Primitivos reinventados:** `<select>` cru (`exams.tsx:183-190`), input/textarea crus (`agent.tsx:302-320`), chips à mão (`faturamento.tsx:72-83`, `documents.tsx:167-181`).
8. **Modal de integração finge salvar:** campos sem value/onChange + toast de sucesso (`integrations.tsx:110-127`).

## P2
9. Enums crus na UI (`patients.tsx:634` "ordered"/"resulted"); formatação % inconsistente (`faturamento.tsx:67` vs `billing.tsx:107`); listas sem paginação (patients/documents/billing/exams); tablist sem ArrowLeft/Right (`tab-strip.tsx:70-87`); gráficos sem alternativa textual; 2FA off sem confirmação/toast (`settings.tsx:618`); agents/whatsapp sem caminho de erro (`whatsapp.tsx:156-161` catch vazio); truncate sem title.

## Top-5 telas sem vida (+elevação)
1. **contratos** — cards gêmeos, leitura pura → card de contrato c/ anel de saúde do payer, sparkline 30d (reusar billingStats), badge vigência, ação "abrir guia-padrão".
2. **equipe** — cards sem avatar/ações → Avatar + permissões por papel + contadores; unificar com UsersPanel de settings (duas implementações do mesmo conceito).
3. **requisicao** — lista chapada → stepper visual (Solicitada→Em análise→Autorizada/Negada), SLA/tempo em fila, agrupamento por status, EmptyState.
4. **faturamento** — billing empobrecido → mini-gráfico de glosa + Progress de motivos + barra "valor em risco" + SegmentedControl.
5. **integrations** — grade plana → status por provedor (última sync, health dot, contagem de eventos) + modal funcional.

Padrão transversal: reaproveitar StatCard, Progress, Avatar, sparklines e billingStats já existentes.
