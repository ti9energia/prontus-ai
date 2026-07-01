# ESTADO DA ENTREGA

- **Fase atual:** FASE 1 — Arquitetura & desacoplamento (próxima)
- **Última atualização:** 2026-07-01
- **Portões concluídos:** PORTÃO 0 ✅ (mapa completo em MAPA.md, baseline em EVIDENCIAS/fase0/baseline.txt: typecheck ✅ lint ✅ 271 testes ✅, app sobe com `npm run dev`)

## Prova de execução (FASE 0)
- App sobe com `npm run dev` → http://localhost:3000
- Rotas verificadas por curl (2026-07-01):
  - `/pt-BR` → 200 · `/pt-BR/login` → 200 · `/en` → 200
  - `/pt-BR/app` → 307 (redirect p/ login, gate de auth) · `/pt-BR/owner` → 307
  - `/api/health` → 200 · rota inexistente → 404 (tratado)

## Próximo passo
- FASE 1: avaliar fronteiras de módulo (screens já registrados via registry; seams de dados/IA/connectors já em ports/adapters), fechar gaps: config tipada central, feature flags, barrels, doc ARQUITETURA.md com módulo extraível.

## Convenção de trabalho
- Preferência durável do dono: cada fase/bloco em feature branch → PR → merge em main.
- Deploy é manual via `vercel --prod` (não é auto-deploy por git).
