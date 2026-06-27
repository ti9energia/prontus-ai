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
| Transcrição ambiente real (ASR clínico) | ✅ produção | ⚠️ simulada (script demo) |
| Nota estruturada por especialidade | ✅ | ✅ |
| Sugestão/auto-código (CID/TUSS) | ✅ | ✅ (parcial) |
| **TISS + verificação pré-glosa** | ⛔ (global não tem) | ✅ **(moat)** |
| Prescrição eletrônica (Memed/SNGPC) | ✅ (BR) | ❌ stub |
| Pedido de exame → resultado (ciclo) | ✅ | ❌ |
| Timeline/histórico do paciente | ✅ | ⚠️ raso |
| Telemedicina / vídeo | ✅ | ❌ |
| Assinatura ICP-Brasil (A1/A3) | ✅ (BR) | ⚠️ stub |
| App mobile + ditado offline | ✅ | ❌ |
| Integração EHR/FHIR/HL7/PACS | ✅ | ⚠️ contrato pronto, sem conectores reais |
| Pagamentos (gateway) | ✅ | ⚠️ stub |
| WhatsApp Business real | parcial | ⚠️ simulado |
| Multi-dispositivo (banco) | ✅ | ⚠️ schema pronto (Bloco 8), falta provisionar |
| Copiloto + agente autônomo | emergente | ✅ **(à frente)** |
| RBAC + multi-tenant + painel do dono | ✅ | ✅ |
| i18n (4 idiomas) | raro | ✅ **(diferencial)** |
| Arquitetura modular/desacoplável | varia | ✅ |

## 3. Lacunas para virar referência (priorizado por ROI)

1. **Transcrição ambiente REAL** — trocar o script demo por ASR clínico (Whisper/Azure/
   provedor BR) com diarização. É a promessa central; hoje é o maior gap percebido.
2. **Prescrição eletrônica (Memed)** — receituário + SNGPC + assinatura; alto valor diário
   para o médico e ponto de retenção.
3. **Ciclo de exames** — pedido → autorização → resultado, ligado à requisição (Bloco 5).
4. **Assinatura ICP-Brasil real** — exigência legal para documentos; hoje stub.
5. **Multi-dispositivo (provisionar o Postgres do Bloco 8)** — sem banco, hospital com
   vários médicos não funciona de verdade entre dispositivos.
6. **WhatsApp Cloud API real** + número verificado — transformar o simulador em canal real.
7. **App mobile + ditado offline** — médicos querem gravar no celular à beira-leito.
8. **Timeline do paciente** (histórico de consultas/notas/documentos/exames) — profundidade.
9. **Integrações EHR/FHIR/HL7/PACS reais** — conectar onde o hospital já vive.
10. **Telemedicina/vídeo** + portal do paciente — expandir o ciclo de atendimento.

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
