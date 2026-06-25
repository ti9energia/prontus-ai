# 02 — Aureon Health · Documentação Completa da Plataforma

> **Tipo:** AI Agent (escriba clínico) · **Cor primária:** Verde-clínico `#0D9488` · **Acento:** Coral `#FB7185`
> **Referência:** Ambience Healthcare (EUA). **i18n:** pt-BR · en · zh-CN · fr-FR (ver `00-PADRAO`).

---

## 1. Visão geral
Aureon Health escuta a consulta médica e gera automaticamente o **prontuário estruturado** e as **guias TISS** dos convênios, devolvendo horas/dia ao médico e reduzindo **glosas** das operadoras. Diferencial: fecha o ciclo até a guia preenchível, não apenas a transcrição.

## 2. Personas & casos de uso
- **Médico(a):** quer terminar a consulta com prontuário e guia prontos, sem digitar.
- **Secretária/faturista da clínica:** revisa e envia guias, reduz glosa.
- **Gestor da clínica/operadora:** acompanha produtividade e sinistralidade.
- **Admin/compliance:** consentimento do paciente, LGPD, trilha.

JTBD: "transforme o que eu falei na consulta em prontuário + guia corretos"; "reduza minha glosa".

## 3. Arquitetura de informação (abas/telas)
1. **Agenda do dia** — consultas, status (a iniciar / gravando / rascunho / finalizado).
2. **Consulta ao vivo** — captura de áudio + nota clínica em tempo real.
3. **Revisão da nota** — prontuário gerado para conferência/edição.
4. **Guias TISS** — guia preenchida, validação e envio.
5. **Pacientes** — histórico e consentimentos.
6. **Faturamento & glosas** — guias enviadas, status, motivos de glosa.
7. **Modelos & especialidade** — templates de nota por especialidade.
8. **Integrações** — prontuário eletrônico (PEP), operadoras, áudio.
9. **Configurações** — usuários, idioma, consentimento, segurança.

## 4. UX detalhada por tela
**4.1 Agenda.** Lista/calendário das consultas com botão *Iniciar*. *Empty*: "Sem consultas hoje".
**4.2 Consulta ao vivo.** Botão grande **Gravar/Pausar**, indicador de captação, transcrição rolando e, ao lado, a **nota clínica** sendo montada (queixa, HMA, exame, hipóteses, conduta). Aviso de consentimento exibido antes de gravar. Ao finalizar → vai para Revisão.
**4.3 Revisão da nota.** Prontuário estruturado e editável por seção; realces do que foi inferido do áudio; aceitar/ajustar. CTA *Gerar guia TISS*.
**4.4 Guias TISS.** Formulário TISS pré-preenchido (procedimentos, CIDs, códigos), validação de campos obrigatórios, *Enviar à operadora* ou *Exportar*. Mostra pendências que costumam gerar glosa.
**4.5 Pacientes.** Ficha, consultas anteriores, consentimentos assinados.
**4.6 Faturamento & glosas.** Tabela de guias (status: enviada/paga/glosada), motivo da glosa, ação de reenvio.
**4.7 Modelos.** Templates de nota por especialidade, editáveis.

## 5. Front end
- Rotas: `/[locale]/today`, `/encounter/[id]`, `/encounter/[id]/review`, `/tiss/[id]`, `/patients`, `/billing`, `/templates`, `/integrations`, `/settings`.
- Componentes: `AudioRecorder`, `LiveTranscript`, `ClinicalNoteEditor` (seções), `TissForm`, `GlossReasonList`, `ConsentBanner`.
- Áudio capturado no cliente, stream/segmentos enviados ao BE; *optimistic* na edição da nota.
- i18n: rótulos clínicos e mensagens por chave; **conteúdo clínico** (templates, termos) versionado por locale.

## 6. Back end
**Módulos:** `encounters`, `transcription`, `clinical-notes`, `tiss`, `patients`, `billing`, `templates`, `integrations`, `org/auth`, `consent`.

**Modelo de dados:** `Organization`, `User`(médico/secretária, `locale`), `Patient` (com `consent`), `Encounter` (id, patientId, doctorId, status, audioRef, transcriptRef, startedAt), `ClinicalNote` (encounterId, sections{queixa, hma, exame, hipoteses, conduta}, version), `TissGuide` (encounterId, payer, procedures[], cids[], status[draft|sent|paid|glossed], glossReason), `Template` (specialty, locale, content), `AuditLog`, `Consent`.

**Endpoints:** `POST /encounters` · `POST /encounters/:id/audio` (chunks) · `GET /encounters/:id/note` · `PUT /encounters/:id/note` · `POST /encounters/:id/tiss` · `PUT /tiss/:id` · `POST /tiss/:id/submit` · `GET /billing/gloss` · `GET/POST /templates` · `POST /consent`.

**Integrações:** ASR (reconhecimento de fala em português médico e demais idiomas), PEP/prontuário eletrônico, padrão **TISS** das operadoras, storage de áudio (com retenção e criptografia).

**Jobs:** transcrição assíncrona, geração da nota (LLM), mapeamento procedimento→código TISS, verificação pré-glosa, expurgo/retention de áudio.

**IA:** ASR + LLM que estrutura a nota clínica e mapeia para CIDs/procedimentos/guias. **Human-in-the-loop obrigatório**: o médico aprova a nota antes de virar guia. Saída validada por schema.

## 7. Fluxos ponta a ponta
**Consulta → prontuário → guia:** médico inicia consulta (consentimento) → áudio em chunks para `POST /audio` → ASR transcreve → LLM monta `ClinicalNote` por seções → médico revisa/edita → `POST /tiss` gera guia pré-preenchida → validação pré-glosa → envio à operadora → status acompanhado em Faturamento. Tudo em `AuditLog`.

## 8. Internacionalização (deltas)
- **TISS é específico do Brasil** → módulo regional `market: BR`; em en/zh/fr a UI traduz, mas o faturamento por convênio é um plugin de mercado.
- Termos clínicos e templates versionados **por locale**; o LLM responde no idioma do usuário e usa o vocabulário clínico do locale.
- PIPL/GDPR/LGPD: dado de saúde é sensível — consentimento explícito, criptografia e retenção configurável por região.

## 9. Landing page
Herói ("Termine a consulta com o prontuário e a guia prontos"); horas devolvidas ao médico; redução de glosa; como funciona; segurança/LGPD; integrações (PEP/operadoras); preços por médico/mês; depoimentos; CTA "Testar com uma consulta". LP nos 4 idiomas.

## 10. Modelo de negócio & métricas
Assinatura por médico/mês + módulo de faturamento. Métricas: minutos transcritos, tempo economizado/consulta, taxa de glosa antes/depois, guias enviadas/pagas, ativação médico→pagante.

## 11. Roadmap de construção (MVP → v1)
**MVP:** captura de áudio + transcrição + `ClinicalNoteEditor` + aprovação do médico. **v0.5:** guias TISS + validação pré-glosa. **v1:** integrações PEP/operadoras, painel de glosa, templates por especialidade, multi-idioma completo. i18n nos 4 idiomas desde o MVP.

---

## 12. Camada de IA, Agente Autônomo e WhatsApp (específico)
> Herda `0A`, `0B`, `0D`. Dado de saúde é sensível: consentimento, LGPD/GDPR/PIPL e human-in-the-loop reforçados.

**Copiloto (entende o sistema):** "resuma o prontuário do paciente X", "quais guias estão glosadas e por quê?", "qual minha taxa de glosa no mês?", "gere a guia TISS desta consulta". Ações: gerar guia, abrir/editar nota (com aprovação do médico).

**Agente Autônomo (decisão):** monitora guias; recomenda correção **pré-glosa** antes do envio; prioriza o reenvio das glosadas; sugere o template de nota por padrão de consulta; alerta consultas sem prontuário finalizado.

**Tools:** `encounters:read`, `notes:read`, `notes:update` (exige aprovação médica), `tiss:create`, `tiss:submit`, `billing:gloss:read`.

**Connectors relevantes:** PEP/prontuário eletrônico, operadoras (padrão TISS), motor de ASR.

**Comandos de WhatsApp (exemplos):** "me traga as guias glosadas da semana" · "qual minha agenda de amanhã?" · "reenviar a guia do paciente X? responda SIM". (Conteúdo clínico sensível só para usuário vinculado; ações confirmadas.)

## 13. Papéis específicos desta plataforma
**médico(a)** (manager: aprova nota/guia) · **faturista/secretária** (member: revisa e envia guias) · **gestor da clínica** (manager) · **compliance** (configura consentimento/retenção) · **viewer**.
