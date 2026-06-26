'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import {
  PenTool,
  ShieldCheck,
  Settings2,
  FileSignature,
  Stamp,
  Hash,
  Info,
  Stethoscope,
  Pill,
  FileCheck2,
  FileCheck,
  type LucideIcon,
} from 'lucide-react';
import { listPatients, getCurrentUser } from '@/lib/data/store';
import { ScreenContainer, ScreenHeader, SectionTitle, Table, Th, Td } from './_kit';
import { Avatar } from '@/components/ui/misc';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/overlay';
import { EmptyState } from '@/components/ui/feedback';
import { toast } from '@/lib/toast';
import { formatDate, formatTime } from '@/lib/utils';

type CertType = 'A1' | 'A3';
type DocKind = 'prontuario' | 'receita' | 'atestado' | 'guiaTiss';

const KIND_META: Record<DocKind, { icon: LucideIcon; tone: React.ComponentProps<typeof Badge>['tone'] }> = {
  prontuario: { icon: Stethoscope, tone: 'brand' },
  receita: { icon: Pill, tone: 'accent' },
  atestado: { icon: FileCheck2, tone: 'success' },
  guiaTiss: { icon: FileCheck, tone: 'info' },
};

interface SignDoc {
  id: string;
  kind: DocKind;
  patientName: string;
  hue: number;
  createdAt: string;
  signedAt?: string;
  hash?: string;
}

/**
 * Deterministic mock fingerprint derived from a stable seed (never Math.random).
 * FNV-1a expanded over several rounds into a SHA-like hex string so the same
 * document always renders the same hash across reloads.
 */
function mockHash(seed: string): string {
  let h = 0x811c9dc5;
  const out: string[] = [];
  for (let round = 0; round < 8; round += 1) {
    for (let i = 0; i < seed.length; i += 1) {
      h ^= seed.charCodeAt(i) + round * 131;
      h = Math.imul(h, 0x01000193);
    }
    out.push((h >>> 0).toString(16).padStart(8, '0'));
  }
  return out.join('').slice(0, 40);
}

export function SignatureScreen() {
  const locale = useLocale();
  const L = (pt: string, en: string, zh: string, fr: string) =>
    locale === 'en' ? en : locale === 'zh-CN' ? zh : locale === 'fr-FR' ? fr : pt;

  const patients = listPatients();
  const user = getCurrentUser();

  /* ----------------------------- certificate ----------------------------- */
  const [cert, setCert] = React.useState(() => ({
    type: 'A1' as CertType,
    name: `e-CPF — ${user.name}`,
    validUntil: new Date(new Date().getFullYear() + 1, 11, 31).toISOString(),
  }));

  /* ------------------------------ documents ------------------------------ */
  const [docs, setDocs] = React.useState<SignDoc[]>(() => {
    const now = new Date();
    const at = (hoursAgo: number) => new Date(now.getTime() - hoursAgo * 3_600_000).toISOString();
    const pick = (i: number) => patients[i];
    // [id, kind, patientIndex, hoursAgo, alreadySigned]
    const seed: Array<[string, DocKind, number, number, boolean]> = [
      ['sig_1', 'prontuario', 0, 1, false],
      ['sig_2', 'receita', 1, 2, false],
      ['sig_3', 'atestado', 2, 4, false],
      ['sig_4', 'guiaTiss', 3, 6, false],
      ['sig_5', 'prontuario', 5, 26, true],
      ['sig_6', 'receita', 4, 52, true],
    ];
    return seed.map(([sid, kind, pi, hrs, signed]) => {
      const pat = pick(pi);
      return {
        id: sid,
        kind,
        patientName: pat?.name ?? '—',
        hue: pat?.hue ?? (pi * 47) % 360,
        createdAt: at(hrs),
        signedAt: signed ? at(hrs - 1) : undefined,
        hash: signed ? `SHA256:${mockHash(sid)}` : undefined,
      };
    });
  });

  const pending = docs.filter((d) => !d.signedAt);
  const history = docs
    .filter((d) => d.signedAt)
    .sort((a, b) => (a.signedAt! < b.signedAt! ? 1 : -1));

  /* ------------------------------- labels -------------------------------- */
  const kindLabel = (k: DocKind) =>
    ({
      prontuario: L('Prontuário', 'Medical record', '病历', 'Dossier médical'),
      receita: L('Receita', 'Prescription', '处方', 'Ordonnance'),
      atestado: L('Atestado', 'Medical certificate', '诊断证明', 'Certificat médical'),
      guiaTiss: L('Guia TISS', 'TISS form', 'TISS 表单', 'Formulaire TISS'),
    })[k];

  const certTypeOption = (ty: CertType) =>
    ty === 'A1'
      ? L('A1 — arquivo (.pfx)', 'A1 — file (.pfx)', 'A1 — 文件 (.pfx)', 'A1 — fichier (.pfx)')
      : L('A3 — token/cartão', 'A3 — token/smartcard', 'A3 — 令牌/智能卡', 'A3 — jeton/carte');

  /* --------------------------- configure cert ---------------------------- */
  const [cfgOpen, setCfgOpen] = React.useState(false);
  const [cfg, setCfg] = React.useState({ type: 'A1' as CertType, name: '', password: '' });

  const openCfg = () => {
    setCfg({ type: cert.type, name: cert.name, password: '' });
    setCfgOpen(true);
  };
  const saveCfg = () => {
    setCert((c) => ({ ...c, type: cfg.type, name: cfg.name.trim() || c.name }));
    setCfgOpen(false);
    toast.success(L('Certificado configurado', 'Certificate configured', '证书已配置', 'Certificat configuré'));
  };

  /* ------------------------------- signing ------------------------------- */
  const [signingId, setSigningId] = React.useState<string | null>(null);
  const signingDoc = docs.find((d) => d.id === signingId) ?? null;
  const [pin, setPin] = React.useState('');

  const openSign = (d: SignDoc) => {
    setPin('');
    setSigningId(d.id);
  };
  const confirmSign = () => {
    if (!signingId) return;
    const id = signingId;
    const stamp = new Date().toISOString();
    setDocs((list) =>
      list.map((d) => (d.id === id ? { ...d, signedAt: stamp, hash: `SHA256:${mockHash(d.id)}` } : d)),
    );
    setSigningId(null);
    setPin('');
    toast.success(L('Documento assinado', 'Document signed', '文档已签名', 'Document signé'));
  };

  /* ----------------------------- doc cell UI ----------------------------- */
  const DocCell = ({ d }: { d: SignDoc }) => {
    const meta = KIND_META[d.kind];
    const Icon = meta.icon;
    return (
      <span className="inline-flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-ink/[0.05]">
          <Icon className="h-4 w-4 text-brand-600" />
        </span>
        <Badge tone={meta.tone}>{kindLabel(d.kind)}</Badge>
      </span>
    );
  };

  return (
    <ScreenContainer>
      <ScreenHeader
        icon={PenTool}
        title={L('Assinatura Digital', 'Digital Signature', '数字签名', 'Signature numérique')}
        subtitle={L(
          'Assine prontuários, receitas e guias com certificado ICP-Brasil e carimbo do tempo.',
          'Sign records, prescriptions and forms with an ICP-Brasil certificate and time-stamp.',
          '使用 ICP-Brasil 证书和时间戳签署病历、处方和表单。',
          'Signez dossiers, ordonnances et formulaires avec un certificat ICP-Brasil et horodatage.',
        )}
      />

      {/* certificate status card */}
      <Card className="mb-4 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-600/10 text-brand-600">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-display text-base font-semibold tracking-tight">{cert.name}</p>
              <Badge tone="brand">{cert.type}</Badge>
              <Badge tone="success" dot>
                {L('Válido', 'Valid', '有效', 'Valide')}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted">
              {L('Titular', 'Holder', '持有人', 'Titulaire')}: <span className="text-ink">{user.name}</span>
            </p>
            <p className="mt-0.5 text-xs text-muted">
              {L('Válido até', 'Valid until', '有效期至', "Valide jusqu'au")}{' '}
              {formatDate(cert.validUntil, locale, { day: '2-digit', month: 'short', year: 'numeric' })} · ICP-Brasil
            </p>
          </div>
        </div>
        <Button variant="outline" leftIcon={<Settings2 className="h-4 w-4" />} onClick={openCfg}>
          {L('Configurar certificado', 'Configure certificate', '配置证书', 'Configurer le certificat')}
        </Button>
      </Card>

      {/* honest note about the external dependency */}
      <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-hairline bg-surface/50 px-4 py-3 text-xs text-muted">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-subtle" />
        <p>
          {L(
            'A assinatura ICP-Brasil real exige um certificado A1/A3 válido e uma Autoridade de Carimbo do Tempo (ACT) credenciada.',
            'Real ICP-Brasil signing requires a valid A1/A3 certificate and an accredited Time-Stamping Authority (TSA).',
            '真实的 ICP-Brasil 签名需要有效的 A1/A3 证书和经认可的时间戳机构（TSA）。',
            'La signature ICP-Brasil réelle exige un certificat A1/A3 valide et une autorité d’horodatage (ACT) accréditée.',
          )}
        </p>
      </div>

      {/* pending documents */}
      <section className="mb-8">
        <SectionTitle
          action={
            <Badge tone={pending.length ? 'warning' : 'neutral'}>
              {pending.length} {L('pendentes', 'pending', '待签', 'en attente')}
            </Badge>
          }
        >
          {L('Documentos para assinar', 'Documents to sign', '待签文档', 'Documents à signer')}
        </SectionTitle>

        {pending.length === 0 ? (
          <EmptyState
            icon={<FileSignature className="h-6 w-6" />}
            title={L('Tudo assinado', 'All signed', '全部已签名', 'Tout est signé')}
            description={L(
              'Não há documentos aguardando assinatura.',
              'No documents awaiting signature.',
              '没有待签名的文档。',
              'Aucun document en attente de signature.',
            )}
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{L('Documento', 'Document', '文档', 'Document')}</Th>
                <Th>{L('Paciente', 'Patient', '患者', 'Patient')}</Th>
                <Th className="hidden sm:table-cell">{L('Emitido', 'Issued', '签发', 'Émis')}</Th>
                <Th className="text-right">{L('Ações', 'Actions', '操作', 'Actions')}</Th>
              </tr>
            </thead>
            <tbody>
              {pending.map((d) => (
                <tr key={d.id} className="transition-colors hover:bg-ink/[0.02]">
                  <Td>
                    <DocCell d={d} />
                  </Td>
                  <Td>
                    <span className="inline-flex items-center gap-2">
                      <Avatar name={d.patientName} hue={d.hue} size={28} />
                      <span className="font-medium">{d.patientName}</span>
                    </span>
                  </Td>
                  <Td className="hidden whitespace-nowrap text-muted sm:table-cell">
                    {formatDate(d.createdAt, locale)}
                  </Td>
                  <Td className="text-right">
                    <Button
                      size="sm"
                      leftIcon={<FileSignature className="h-3.5 w-3.5" />}
                      onClick={() => openSign(d)}
                    >
                      {L('Assinar', 'Sign', '签名', 'Signer')}
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </section>

      {/* signature history */}
      <section>
        <SectionTitle>
          {L('Histórico de assinaturas', 'Signature history', '签名历史', 'Historique des signatures')}
        </SectionTitle>

        {history.length === 0 ? (
          <EmptyState
            icon={<Stamp className="h-6 w-6" />}
            title={L('Sem assinaturas ainda', 'No signatures yet', '暂无签名', 'Aucune signature')}
            description={L(
              'Os documentos assinados aparecerão aqui com hash e carimbo de tempo.',
              'Signed documents will appear here with hash and time-stamp.',
              '已签名文档将在此显示，附哈希与时间戳。',
              'Les documents signés apparaîtront ici avec hash et horodatage.',
            )}
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{L('Documento', 'Document', '文档', 'Document')}</Th>
                <Th>{L('Paciente', 'Patient', '患者', 'Patient')}</Th>
                <Th className="hidden md:table-cell">{L('Assinado em', 'Signed at', '签名时间', 'Signé le')}</Th>
                <Th>{L('Verificação', 'Verification', '验证', 'Vérification')}</Th>
              </tr>
            </thead>
            <tbody>
              {history.map((d) => (
                <tr key={d.id} className="transition-colors hover:bg-ink/[0.02]">
                  <Td>
                    <DocCell d={d} />
                  </Td>
                  <Td>
                    <span className="inline-flex items-center gap-2">
                      <Avatar name={d.patientName} hue={d.hue} size={28} />
                      <span className="font-medium">{d.patientName}</span>
                    </span>
                  </Td>
                  <Td className="hidden whitespace-nowrap text-muted md:table-cell">
                    {formatDate(d.signedAt!, locale)} · {formatTime(d.signedAt!, locale)}
                  </Td>
                  <Td>
                    <div className="flex flex-col gap-1.5">
                      <Badge tone="success">
                        <Stamp className="h-3 w-3" />
                        {L('Carimbo de tempo', 'Time-stamp', '时间戳', 'Horodatage')}
                      </Badge>
                      <span className="inline-flex items-center gap-1 font-mono text-2xs text-muted">
                        <Hash className="h-3 w-3 shrink-0 text-subtle" />
                        <span className="max-w-[12rem] truncate">{d.hash}</span>
                      </span>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </section>

      {/* configure certificate modal */}
      <Modal
        open={cfgOpen}
        onClose={() => setCfgOpen(false)}
        title={L('Configurar certificado', 'Configure certificate', '配置证书', 'Configurer le certificat')}
        description={L(
          'Certificado ICP-Brasil usado para assinar seus documentos.',
          'ICP-Brasil certificate used to sign your documents.',
          '用于签署文档的 ICP-Brasil 证书。',
          'Certificat ICP-Brasil utilisé pour signer vos documents.',
        )}
      >
        <div className="flex flex-col gap-4 p-5">
          <Field label={L('Tipo', 'Type', '类型', 'Type')}>
            <Select value={cfg.type} onChange={(e) => setCfg((c) => ({ ...c, type: e.target.value as CertType }))}>
              <option value="A1">{certTypeOption('A1')}</option>
              <option value="A3">{certTypeOption('A3')}</option>
            </Select>
          </Field>
          <Field label={L('Nome do certificado', 'Certificate name', '证书名称', 'Nom du certificat')}>
            <Input
              value={cfg.name}
              onChange={(e) => setCfg((c) => ({ ...c, name: e.target.value }))}
              placeholder={`e-CPF — ${user.name}`}
            />
          </Field>
          <Field
            label={L('Senha / PIN', 'Password / PIN', '密码 / PIN', 'Mot de passe / PIN')}
            hint={L(
              'Não armazenamos sua senha — ela apenas desbloqueia o certificado.',
              'We never store your password — it only unlocks the certificate.',
              '我们不存储您的密码——它仅用于解锁证书。',
              'Nous ne stockons pas votre mot de passe — il déverrouille seulement le certificat.',
            )}
          >
            <Input
              type="password"
              value={cfg.password}
              onChange={(e) => setCfg((c) => ({ ...c, password: e.target.value }))}
              placeholder="••••••"
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCfgOpen(false)}>
              {L('Cancelar', 'Cancel', '取消', 'Annuler')}
            </Button>
            <Button leftIcon={<ShieldCheck className="h-4 w-4" />} onClick={saveCfg}>
              {L('Salvar', 'Save', '保存', 'Enregistrer')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* sign (PIN) modal */}
      <Modal
        open={!!signingDoc}
        onClose={() => setSigningId(null)}
        title={L('Assinar documento', 'Sign document', '签名文档', 'Signer le document')}
        description={signingDoc ? `${kindLabel(signingDoc.kind)} · ${signingDoc.patientName}` : undefined}
      >
        {signingDoc && (
          <div className="flex flex-col gap-4 p-5">
            <div className="flex items-center gap-3 rounded-xl border border-hairline bg-surface/40 p-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-600/10 text-brand-600">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div className="min-w-0 text-xs">
                <p className="font-medium text-ink">{cert.name}</p>
                <p className="text-muted">
                  {cert.type} · {L('Titular', 'Holder', '持有人', 'Titulaire')}: {user.name}
                </p>
              </div>
            </div>
            <Field
              label={L('PIN do certificado', 'Certificate PIN', '证书 PIN', 'PIN du certificat')}
              hint={L(
                'Digite o PIN para liberar a chave privada e aplicar a assinatura.',
                'Enter the PIN to unlock the private key and apply the signature.',
                '输入 PIN 以解锁私钥并应用签名。',
                'Saisissez le PIN pour déverrouiller la clé privée et appliquer la signature.',
              )}
            >
              <Input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••••"
                autoFocus
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setSigningId(null)}>
                {L('Cancelar', 'Cancel', '取消', 'Annuler')}
              </Button>
              <Button
                leftIcon={<FileSignature className="h-4 w-4" />}
                disabled={!pin.trim()}
                onClick={confirmSign}
              >
                {L('Assinar agora', 'Sign now', '立即签名', 'Signer maintenant')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </ScreenContainer>
  );
}
