# Testes de carga (k6)

Cenários de carga para as rotas quentes do Auronis Health, sobre o
[k6](https://k6.io) da Grafana. Cada script é independente e lê o alvo de
`BASE_URL` no ambiente, então o mesmo arquivo roda contra um `next start`
local, o servidor efêmero do CI, ou um deploy real — sem edição.

## Cenários

| Script | Perfil | O que responde |
|---|---|---|
| `smoke.js` | 1 VU, 30s | Sanidade: cada endpoint responde certo sob tráfego mínimo? Rode primeiro. |
| `load.js` | ramp → 20 VUs, sustenta 1min | p95 fica aceitável e erro perto de zero sob carga esperada? |
| `stress.js` | ramp → 150 VUs | Degrada com elegância além da capacidade? (ver ⚠️ abaixo) |
| `spike.js` | 5 → 120 VUs súbito → 5 | Sobrevive a um pico repentino e se recupera? |

Alvos exercitados (`k6/lib/config.js`): `GET /api/health` (liveness barato),
`GET /pt-BR` (render da landing), `GET /api/v1/stats` e `GET /api/v1/patients`
(leitura autenticada por chave de API — usa a chave semeada `sk_test_auronis_dev`,
que funciona em modo produção).

## Rodar

Precisa do [k6 instalado](https://grafana.com/docs/k6/latest/set-up/install-k6/)
e do app buildado (`npm run build`).

```bash
# um cenário isolado, contra um servidor já de pé em :3100
k6 run -e BASE_URL=http://localhost:3100 k6/smoke.js

# a suíte completa com ciclo de vida do servidor gerenciado (start→espera→roda→derruba)
npm run build && bash scripts/k6-ci.sh

# escolhendo cenários
K6_SCENARIOS="smoke load spike stress" bash scripts/k6-ci.sh

# contra um deploy real (com uma chave de API real)
k6 run -e BASE_URL=https://prontus-ai.vercel.app -e API_KEY=sk_live_... k6/load.js
```

Via npm:

```bash
npm run k6:smoke     # k6 run k6/smoke.js
npm run k6:load
npm run k6:stress
npm run k6:spike
npm run k6:ci        # a suíte gerenciada (scripts/k6-ci.sh)
```

## No CI

`.github/workflows/k6.yml` builda o app, sobe o `next start` num runner do
GitHub, roda `smoke + load + spike` via `scripts/k6-ci.sh` e derruba o servidor
— nenhum servidor local. Dispara em pushes/PRs que mexem em `k6/**` e em
`workflow_dispatch` manual (onde dá pra escolher os cenários).

## ⚠️ Sobre os números

Os thresholds em `k6/lib/config.js` são **calibrados para o runner
compartilhado de 2 núcleos do CI + o adapter in-memory**, não são um SLO de
produção. O objetivo aqui é "o app se mantém saudável e responsivo sob
concorrência", não latência absoluta.

- `stress.js` fica **fora do CI por padrão**: uma rampa de 150 VUs nos mesmos 2
  núcleos que o gerador de carga mede o runner, não o app. Rode-o contra um
  deploy real para números de estresse que signifiquem algo.
- Para números de produção de verdade, aponte qualquer cenário para um deploy
  real com `-e BASE_URL=...` (e `-e API_KEY=...` para os endpoints autenticados)
  — feito na verificação conjunta final (FASE 12).
