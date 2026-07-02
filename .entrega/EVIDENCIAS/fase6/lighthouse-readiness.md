# Prontidão para Lighthouse PWA (FASE 6)

**Data:** 2026-07-02. Por diretiva do dono ("quando todas as fases tiverem feitas, a gente sobe para verificar e testar" — registrado em `.entrega/DECISOES.md` na FASE 2), a execução AO VIVO do Lighthouse (exige servidor rodando) fica para a verificação conjunta final. Esta é a checklist de prontidão — cada critério real do Lighthouse PWA/Installable, verificado por código/build.

| Critério (Lighthouse Installable/PWA) | Status | Evidência |
|---|---|---|
| Manifest válido com `name`/`short_name` | ✅ | `src/app/manifest.ts` |
| Manifest com ícone ≥192px | ✅ | `icon-192.png` (novo nesta fase) |
| Manifest com ícone ≥512px | ✅ | `icon-512.png` |
| Ícone `purpose:maskable` com safe-zone real | ✅ | `icon-maskable-{192,512}.png` gerados com 62% de escala (antes: mesma arte do "any", sem padding — glifo seria cortado pela máscara) |
| `display: standalone/fullscreen/minimal-ui` | ✅ | `standalone` |
| `start_url` responde (mesma origem) | ✅ | `/pt-BR/app` — confirmado 307→login sem sessão, 200 com sessão (fase 0) |
| Service worker registrado, controla `start_url` | ✅ | `pwa-register.tsx` registra `/sw.js` (scope raiz cobre `/pt-BR/app`) |
| `<meta name="viewport">` com width/initial-scale | ✅ | `layout.tsx` → `export const viewport` |
| `theme_color` (manifest + meta) | ✅ | manifest `#14c8c4` + `viewport.themeColor` (claro/escuro) |
| `background_color` (splash básica) | ✅ | manifest `#090b0f` |
| `apple-touch-icon` válido | ✅ | `src/app/apple-icon.png` (convenção Next, 180×180) regenerado nesta fase |
| HTTPS / redirect HTTP→HTTPS | 🔲 nível de deploy | Vercel serve HTTPS por padrão; CSP já tem `upgrade-insecure-requests` em produção (`next.config.mjs`) — verificável só com deploy real |
| SW não quebra em rede offline (fallback) | ✅ | `sw.js` — navegação offline cai no shell cacheado do MESMO idioma do visitante (antes: hardcoded `/pt-BR`), com fallback final para pt-BR |
| Fluxo de atualização sem travar em cache velho | ✅ | `sw.js` não faz mais `skipWaiting()` automático; `pwa-register.tsx` detecta update real (`controller` já existia) → prompt "Nova versão disponível" → só ativa com confirmação do usuário |

## O que fica fora (documentado, não bloqueante)
- Splash screens `apple-touch-startup-image` por resolução de dispositivo iOS — dezenas de tamanhos, não é critério do Lighthouse, só relevante para App Store real (documentado em `ARQUITETURA.md`).
- Auditoria HTTPS real — só possível contra um deploy, não contra `localhost`.

## Como rodar quando formos verificar juntos
```bash
npm run build && npm run start   # produção local, porta 3000
npx lighthouse http://localhost:3000/pt-BR --only-categories=pwa --view
```
