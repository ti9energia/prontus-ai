# Auronis Health — Estudo de mercado (Bloco 9)

> Objetivo: mapear **o que falta para ser referência** e **o que precisamos melhorar**.
> Base de conhecimento do setor (clinical-AI scribe + SaaS de saúde) — pode ser
> aprofundado com pesquisa web ao vivo (skill `deep-research`).

## 1. Panorama competitivo

**Scribes ambientais / copilotos clínicos (global):**
- **Abridge**, **Nuance DAX Copilot** (Microsoft), **Suki**, **Nabla**, **DeepScribe**,
  **Ambience** — geram nota clínica a partir do áudio da consulta, com integração a EHRs
  (Epic, Cerner). Foco: reduzir tempo de documentação, ambient listening real, sugestão de
  códigos (ICD/CPT), integração nativa ao prontuário do hospital.

**Brasil (contexto regulatório/fluxo):**
- O fosso local é **TISS/ANS + glosa** (não existe nos players globais). Concorrentes/
  adjacentes: **iClinic, Feegow, Tasy (Philips), MV** (prontuário/gestão), **Memed**
  (prescrição eletrônica + SNGPC), **Nina/CMtech, Laura** (IA assistencial), telemedicina
  (Conexa, etc.). Poucos juntam **escriba de IA + TISS + glosa + WhatsApp** num produto só.

## 2. O que define um produto "referência" (checklist)

| Capacidade | Referência faz | Auronis hoje |
|---|---|---|
| Transcrição ambiente real (ASR clínico) | ✅ produção | ✅ **seam real** (`ASR_PROVIDER`) · fallback demo sem credencial |
| Nota estruturada por especialidade | ✅ | ✅ |
| Sugestão/auto-código (CID/TUSS) | ✅ | ✅ (parcial, via Mari) |
| **TISS + verificação pré-glosa** | ⛔ (global não tem) | ✅ **(moat)** |
| Prescrição eletrônica (Memed/SNGPC) | ✅ (BR) | ✅ **seam real** (`MEMED_*`) · stub funcional sem credencial |
| Pedido de exame → resultado (ciclo) | ✅ | ✅ **real** (sem credencial — ciclo completo + timeline) |
| Timeline/histórico do paciente | ✅ | ✅ **real** (encontros + notas + guias + exames unificados) |
| Telemedicina / vídeo | ✅ | ❌ fase futura |
| Assinatura ICP-Brasil (A1/A3) | ✅ (BR) | ✅ **seam real** (`ICP_*`) · fingerprint mock sem credencial |
| App mobile + ditado offline | ✅ | ❌ fase futura; PWA instalável cobre caso básico |
| Integração EHR/FHIR/HL7/PACS | ✅ | ⚠️ contratos prontos, conectores reais ficam para fase futura |
| Pagamentos (gateway) | ✅ | ⚠️ stub |
| WhatsApp Business real | parcial | ✅ **seam real** (`WHATSAPP_*`) · simulador sem credencial |
| Multi-dispositivo (banco) | ✅ | ✅ **seam real** — Postgres/Prisma quando `DATABASE_URL` presente; in-memory fallback |
| Chaves de API públicas | ✅ | ✅ **real** — SHA-256 hasheadas, geração/revogação via painel do dono |
| Copiloto + agente autônomo | emergente | ✅ **(à frente)** · streaming real com `ANTHROPIC_API_KEY` |
| RBAC + multi-tenant + painel do dono | ✅ | ✅ |
| i18n (4 idiomas) | raro | ✅ **(diferencial)** · 750+ chaves, paridade em CI |
| Arquitetura modular/desacoplável | varia | ✅ |

## 3. Lacunas para virar referência (estado atual pós-Blocos 10-21)

**Fechadas (B10–B21):**
- ✅ **Multi-dispositivo / Postgres** (B10) — seam Prisma ativo por `DATABASE_URL`; in-memory fallback.
- ✅ **ASR real em streaming** (B12) — seam `ASR_PROVIDER` com fallback demo; nota gerada via Mari streaming.
- ✅ **Ciclo de exames** (B13) — pedido → coletado → resultado → laudo; timeline unificada.
- ✅ **Prescrição Memed** (B15) — seam `MEMED_*`; stub funcional sem credencial.
- ✅ **Assinatura ICP-Brasil** (B16) — seam `ICP_*` PAdES/PKCS#7; fingerprint mock sem credencial.
- ✅ **WhatsApp Cloud real** (B17) — seam `WHATSAPP_*`; simulador sem credencial.
- ✅ **Chaves de API hasheadas** (B18) — SHA-256, nunca a chave bruta persistida.
- ✅ **Performance landing** (B11/B19) — framer-motion removido, reveal CSS+IO, LCP visível.
- ✅ **Acessibilidade AA** (B21) — token `--subtle` 4.6:1 / 5.1:1, `aria-hidden` em ícones decorativos.

**Restam (fase futura, documentadas):**
1. **App mobile nativo + ditado offline** — codebase separada; PWA instalável cobre o básico.
2. **Telemedicina / vídeo** — WebRTC + infra de mídia; fase futura.
3. **Integrações EHR/FHIR/HL7/PACS reais** — contratos prontos; conectores reais quando houver parceiro.
4. **Gateway de pagamento real** — Stripe/Pagar.me; seam já documentado.
5. **Credenciais** — cada seam acima ativa sozinho quando o dono provisionar; ver `DEPLOY.md`.

## 4. Forças a manter e amplificar (vantagem competitiva)

- **TISS + glosa + recuperação** (fosso BR que os globais não têm) — vender o resultado
  financeiro (glosa −X%, R$ recuperados).
- **Copiloto que opera o sistema + agente autônomo** — à frente da curva; aprofundar
  navegação, ações e o agente agendado.
- **4 idiomas** — destrava expansão LatAm/EU/China.
- **Painel do dono + RBAC + multi-tenant + modularidade** — pronto para hospital/rede e
  para vender white-label / extrair módulos.

## 5. Pricing & GTM (notas)

- Manter ancoragem no **ROI de glosa** (paga o plano sozinho) — já no copy da landing.
- Planos por papel/uso (Starter/Pro/Scale já existem) + **add-on hospital** (multi-médico,
  faturamento/requisição — Bloco 5).
- Wedge: clínicas que sofrem com glosa → expandir para prontuário/escriba → rede/hospital.

## 6. Recomendação de roadmap (pós-escopo atual)

**Curto:** ASR real · Memed · provisionar Postgres (Bloco 8) · ICP-Brasil real.
**Médio:** ciclo de exames · timeline do paciente · WhatsApp Cloud real · app mobile.
**Longo:** integrações EHR/FHIR/HL7/PACS · telemedicina · portal do paciente · agente
agendado (cron) + treino do AI Core em servidor próprio (a base já é desacoplável).
