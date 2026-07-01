# Auditoria "antes" — Landing + Login + 404 + Loading (FASE 2, 2026-07-01)

> Evidência por análise de código (sem servidor, diretiva do dono).

## P0
1. **Preços divergentes na mesma página:** Pricing R$99/199/349 (`pricing.tsx:13-15`) × ROI calculator 97/197/397 (`roi-calculator.tsx:35`); nomes de plano hardcoded no cálculo. Corrigir com fonte única `PLANS` importada pelos dois.
2. **Links legais/institucionais mortos:** `HREF` só mapeia features/pricing/security; changelog, about, careers, contact, docs, api, status, **privacy, terms, lgpd** caem em `href="#"` (`sections.tsx:416,438`) — produto que vende LGPD/GDPR com link de Privacidade morto.

## P1
3. **Landing invisível sem JS:** `.rv { opacity:0 }` só vira visível via IntersectionObserver (`globals.css:268-278`, `reveal.tsx:25-35`) — todas as seções abaixo do hero somem sem JS/observer. Precisa fallback (noscript/reduced-motion/estado inicial visível).
4. **Violeta off-brand no hero:** dna-helix strand B/halos usam `167 140 252`/`180 160 255`/`162 132 250` (`dna-helix.tsx:78,141,144`) — roxo não existe nos tokens; é o gradiente cyan-violeta do ANEXO B. Trocar por brand-300/accent-400/silver.
5. **Botão reconstruído à mão no ROI** (`roi-calculator.tsx:143-148`) em vez de `buttonVariants` — radius/sombra/foco divergem.
6. **Card triplicado:** Features/ForWhom/Security com o mesmo markup de card (`sections.tsx:174,260,301`) — extrair `<FeatureCard>` e diferenciar.
7. **Funil sem cadastro:** todos os CTAs "Teste grátis" → `/login`, que só tem sign-in (sem criar conta, sem esqueci-senha, sem rota de registro). Beco sem saída de conversão.
8. **Plano Scale "Fale com vendas" → /login** (`pricing.tsx:14-15,91-95`) e features idênticas ao Pro.

## P2
9. Contraste AA no limite: `text-2xs text-subtle` sobre surface/card translúcidos ~4.3:1 (`hero.tsx:75`, `sections.tsx:80,85,430,434,447`) — usar text-muted em ≤12px.
10. `aria-label="5 estrelas"` hardcoded PT nas testemunhas (`sections.tsx:335`).
11. Hero-demo ignora reduced-motion (loop JS `hero-demo.tsx:79-111`, ping `:139`).
12. CTAs do hero em `initial={{opacity:0}}` do framer — ação primária invisível até hidratar (`hero.tsx:47-69`).
13. Botão olho-de-senha aninhado no `<label>` do Field (`input.tsx:74` + `login-form.tsx:193-201`).
14. Valores mágicos: `text-[0.8rem]`/`text-[0.78rem]`/`text-[0.8125rem]`/`text-[0.95rem]` (hero-demo:175,210; button.tsx:41,43; misc.tsx:111); loading.tsx com z-[200]/drop-shadow arbitrários.
15. Ritmo: Stats `sm:py-20` vs padrão `sm:py-24` (`sections.tsx:134`).
16. Fade+slide idêntico em toda seção + tudo centralizado (ANEXO B "monótono/indeciso") — variar entrada e ancorar 1-2 seções à esquerda.
17. Número principal do ROI em text-gradient com contraste fraco no claro (`roi-calculator.tsx:213`).
18. Toggle mensal/anual sem aria-live nem transição no preço (`pricing.tsx:22,58,77`).
19. Menu mobile sem foco preso/aria-modal; aria-label não alterna abrir/fechar (`landing-nav.tsx:117-154`).
20. FAQ sem `aria-controls`/`id` ligando botão↔painel (`faq.tsx:34-55`).

## Pontos fortes (não retrabalhar)
LogoCloud honesto (padrões reais, sem logos-fantasma); zero emoji (lucide); estados do login completos (alert/loading/429); ROI com aria-live e labels; loading/404 vivos e on-brand; FAQ com JSON-LD; foco global visível; reduced-motion global no CSS.
