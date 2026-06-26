'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import {
  Store,
  Search,
  Download,
  Check,
  Star,
  KeyRound,
  Plus,
  Copy,
  Trash2,
  Terminal,
  ShieldCheck,
} from 'lucide-react';
import { ScreenContainer, ScreenHeader, SectionTitle, StatCard, Table, Th, Td } from './_kit';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/overlay';
import { SegmentedControl } from '@/components/ui/misc';
import { EmptyState } from '@/components/ui/feedback';
import { toast } from '@/lib/toast';
import { formatDate } from '@/lib/utils';

/** A localized 4-tuple: [pt-BR, en, zh-CN, fr-FR]. */
type Loc = [string, string, string, string];

type Section = 'apps' | 'api';
type CategoryKey = 'telemed' | 'finance' | 'productivity' | 'ai';
type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface AppDef {
  id: string;
  name: string;
  desc: Loc;
  category: CategoryKey;
  rating: number;
}

interface ApiKey {
  id: string;
  name: string;
  value: string;
  created: string;
}

const BASE_URL = 'https://api.auronishealth.com';

const APPS: AppDef[] = [
  /* ---------------------------- Telemedicina ---------------------------- */
  {
    id: 'auronis-telemed',
    name: 'Auronis Telemed',
    category: 'telemed',
    rating: 4.9,
    desc: [
      'Teleconsulta com sala de espera virtual e prontuário ao vivo.',
      'Telehealth with a virtual waiting room and a live record.',
      '具有虚拟候诊室和实时病历的远程会诊。',
      "Téléconsultation avec salle d'attente virtuelle et dossier en direct.",
    ],
  },
  {
    id: 'memed',
    name: 'Memed',
    category: 'telemed',
    rating: 4.7,
    desc: [
      'Prescrição digital integrada à teleconsulta.',
      'Digital prescription integrated into the teleconsultation.',
      '与远程会诊集成的数字处方。',
      'Prescription numérique intégrée à la téléconsultation.',
    ],
  },
  {
    id: 'doctoralia',
    name: 'Doctoralia',
    category: 'telemed',
    rating: 4.5,
    desc: [
      'Publique horários e receba pacientes do marketplace.',
      'Publish slots and receive patients from the marketplace.',
      '发布时段并从市场接收患者。',
      'Publiez des créneaux et recevez des patients du marketplace.',
    ],
  },
  /* ----------------------------- Financeiro ----------------------------- */
  {
    id: 'pix-receba',
    name: 'PIX Receba',
    category: 'finance',
    rating: 4.8,
    desc: [
      'Cobrança automática via PIX com baixa conciliada.',
      'Automatic PIX charges with reconciled settlement.',
      '通过 PIX 自动收费并对账。',
      'Encaissement automatique via PIX avec rapprochement.',
    ],
  },
  {
    id: 'asaas',
    name: 'Asaas',
    category: 'finance',
    rating: 4.6,
    desc: [
      'Gateway de pagamentos, boletos e assinaturas.',
      'Payment gateway, bank slips and subscriptions.',
      '支付网关、账单和订阅。',
      'Passerelle de paiement, factures et abonnements.',
    ],
  },
  {
    id: 'conta-azul',
    name: 'Conta Azul',
    category: 'finance',
    rating: 4.4,
    desc: [
      'Sincronize o faturamento com seu ERP financeiro.',
      'Sync billing with your financial ERP.',
      '将账单与您的财务 ERP 同步。',
      'Synchronisez la facturation avec votre ERP financier.',
    ],
  },
  /* ---------------------------- Produtividade --------------------------- */
  {
    id: 'google-agenda',
    name: 'Google Agenda',
    category: 'productivity',
    rating: 4.7,
    desc: [
      'Sincronize sua agenda em dois sentidos.',
      'Two-way sync for your calendar.',
      '双向同步您的日程。',
      'Synchronisez votre agenda dans les deux sens.',
    ],
  },
  {
    id: 'notion-docs',
    name: 'Notion Docs',
    category: 'productivity',
    rating: 4.3,
    desc: [
      'Exporte resumos e protocolos para o Notion.',
      'Export summaries and protocols to Notion.',
      '将摘要和协议导出到 Notion。',
      'Exportez résumés et protocoles vers Notion.',
    ],
  },
  {
    id: 'drive-backup',
    name: 'Drive Backup',
    category: 'productivity',
    rating: 4.5,
    desc: [
      'Backup automático de documentos assinados.',
      'Automatic backup of signed documents.',
      '已签名文档的自动备份。',
      'Sauvegarde automatique des documents signés.',
    ],
  },
  /* --------------------------------- IA --------------------------------- */
  {
    id: 'auronis-copilot',
    name: 'Auronis Copilot',
    category: 'ai',
    rating: 5.0,
    desc: [
      'Sugestões de conduta baseadas em diretrizes clínicas.',
      'Guideline-based clinical decision suggestions.',
      '基于临床指南的处置建议。',
      'Suggestions de conduite fondées sur les recommandations.',
    ],
  },
  {
    id: 'scribe-ai',
    name: 'Scribe AI',
    category: 'ai',
    rating: 4.8,
    desc: [
      'Transcrição clínica multilíngue em tempo real.',
      'Real-time multilingual clinical transcription.',
      '实时多语言临床转录。',
      'Transcription clinique multilingue en temps réel.',
    ],
  },
  {
    id: 'triagem-gpt',
    name: 'Triagem GPT',
    category: 'ai',
    rating: 4.6,
    desc: [
      'Pré-triagem inteligente por sintomas no WhatsApp.',
      'Smart symptom pre-triage over WhatsApp.',
      '在 WhatsApp 上进行智能症状预检。',
      'Pré-tri intelligent des symptômes sur WhatsApp.',
    ],
  },
];

const ENDPOINTS: { method: Method; path: string; desc: Loc }[] = [
  {
    method: 'GET',
    path: '/v1/patients',
    desc: ['Lista pacientes da clínica.', 'List clinic patients.', '列出诊所患者。', 'Liste les patients de la clinique.'],
  },
  {
    method: 'POST',
    path: '/v1/encounters',
    desc: ['Cria um atendimento.', 'Create an encounter.', '创建一次就诊。', 'Crée une consultation.'],
  },
  {
    method: 'GET',
    path: '/v1/guides',
    desc: ['Consulta guias TISS.', 'List TISS guides.', '查询 TISS 表单。', 'Liste les guides TISS.'],
  },
  {
    method: 'POST',
    path: '/v1/documents',
    desc: ['Gera um documento clínico.', 'Generate a clinical document.', '生成临床文档。', 'Génère un document clinique.'],
  },
  {
    method: 'GET',
    path: '/v1/appointments',
    desc: ['Lista agendamentos.', 'List appointments.', '列出预约。', 'Liste les rendez-vous.'],
  },
  {
    method: 'POST',
    path: '/v1/webhooks',
    desc: ['Registra um webhook de eventos.', 'Register an events webhook.', '注册事件 webhook。', 'Enregistre un webhook d’événements.'],
  },
];

const METHOD_TONE: Record<Method, React.ComponentProps<typeof Badge>['tone']> = {
  GET: 'info',
  POST: 'success',
  PUT: 'warning',
  DELETE: 'danger',
};

const INITIAL_INSTALLED = ['auronis-telemed', 'pix-receba', 'auronis-copilot'];

/** Deterministic hue from a name, so each app tile gets a stable color. */
function hueOf(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

/** Deterministic hex string (FNV-1a, fed back for length) — no Math.random. */
function hashHex(input: string, len = 32): string {
  let h = 0x811c9dc5;
  let out = '';
  let salt = input;
  while (out.length < len) {
    for (let i = 0; i < salt.length; i++) {
      h ^= salt.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    out += (h >>> 0).toString(16).padStart(8, '0');
    salt = out;
  }
  return out.slice(0, len);
}

const maskKey = (v: string) => `${v.slice(0, 11)}${'•'.repeat(8)}${v.slice(-4)}`;

let keySeq = 1;
const nextKeyId = () => `key_${(keySeq += 1)}`;

export function MarketplaceScreen() {
  const locale = useLocale();
  const L = (pt: string, en: string, zh: string, fr: string) =>
    locale === 'en' ? en : locale === 'zh-CN' ? zh : locale === 'fr-FR' ? fr : pt;
  const T = (loc: Loc) => L(loc[0], loc[1], loc[2], loc[3]);

  const [section, setSection] = React.useState<Section>('apps');

  /* ------------------------------- apps ------------------------------- */
  const [installed, setInstalled] = React.useState<Set<string>>(() => new Set(INITIAL_INSTALLED));
  const [query, setQuery] = React.useState('');

  const categoryLabel = (c: CategoryKey) =>
    ({
      telemed: L('Telemedicina', 'Telemedicine', '远程医疗', 'Télémédecine'),
      finance: L('Financeiro', 'Finance', '财务', 'Finance'),
      productivity: L('Produtividade', 'Productivity', '生产力', 'Productivité'),
      ai: L('IA', 'AI', 'AI', 'IA'),
    })[c];

  const toggleInstall = (id: string) => {
    const willInstall = !installed.has(id);
    setInstalled((prev) => {
      const next = new Set(prev);
      if (willInstall) next.add(id);
      else next.delete(id);
      return next;
    });
    toast.success(
      willInstall
        ? L('App instalado', 'App installed', '应用已安装', 'Application installée')
        : L('App removido', 'App removed', '应用已移除', 'Application supprimée'),
    );
  };

  const q = query.trim().toLowerCase();
  const filteredApps = APPS.filter((a) => {
    if (!q) return true;
    return (
      a.name.toLowerCase().includes(q) ||
      T(a.desc).toLowerCase().includes(q) ||
      categoryLabel(a.category).toLowerCase().includes(q)
    );
  });

  /* -------------------------------- api ------------------------------- */
  const [keys, setKeys] = React.useState<ApiKey[]>(() => [
    {
      id: 'key_1',
      name: L('Produção', 'Production', '生产', 'Production'),
      value: `sk_live_${hashHex('seed:production:1')}`,
      created: '2026-01-12T09:00:00.000Z',
    },
  ]);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [keyName, setKeyName] = React.useState('');
  const [revealed, setRevealed] = React.useState<ApiKey | null>(null);

  const generateKey = () => {
    const id = nextKeyId();
    const name =
      keyName.trim() || L('Chave sem nome', 'Untitled key', '未命名密钥', 'Clé sans nom');
    const value = `sk_live_${hashHex(`${name}:${id}`)}`;
    const key: ApiKey = { id, name, value, created: new Date().toISOString() };
    setKeys((k) => [key, ...k]);
    setKeyName('');
    setCreateOpen(false);
    setRevealed(key);
    toast.success(L('Chave gerada', 'Key generated', '密钥已生成', 'Clé générée'));
  };

  const revokeKey = (id: string) => {
    setKeys((k) => k.filter((x) => x.id !== id));
    toast.success(L('Chave revogada', 'Key revoked', '密钥已吊销', 'Clé révoquée'));
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(L('Copiado', 'Copied', '已复制', 'Copié'));
    } catch {
      toast.error(
        L('Não foi possível copiar', 'Could not copy', '无法复制', 'Copie impossible'),
      );
    }
  };

  const curlExample = [
    `curl ${BASE_URL}/v1/patients \\`,
    '  -H "Authorization: Bearer sk_live_•••" \\',
    '  -H "Content-Type: application/json"',
  ].join('\n');

  return (
    <ScreenContainer>
      <ScreenHeader
        icon={Store}
        title="Marketplace"
        subtitle={L(
          'Instale apps e conecte sua clínica à API pública da Auronis.',
          'Install apps and connect your clinic to the Auronis public API.',
          '安装应用并将您的诊所连接到 Auronis 公共 API。',
          "Installez des applications et connectez votre clinique à l'API publique Auronis.",
        )}
        actions={
          <SegmentedControl<Section>
            value={section}
            onChange={setSection}
            options={[
              { value: 'apps', label: L('Apps', 'Apps', '应用', 'Apps') },
              { value: 'api', label: 'API' },
            ]}
          />
        }
      />

      {section === 'apps' ? (
        <div className="flex flex-col gap-5">
          {/* stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard
              label={L('Disponíveis', 'Available', '可用', 'Disponibles')}
              value={APPS.length}
              icon={Store}
            />
            <StatCard
              label={L('Instalados', 'Installed', '已安装', 'Installées')}
              value={installed.size}
              icon={Check}
              tone="success"
            />
            <StatCard
              label={L('Categorias', 'Categories', '类别', 'Catégories')}
              value={4}
              icon={ShieldCheck}
              tone="accent"
              className="hidden sm:block"
            />
          </div>

          {/* search */}
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={L('Buscar apps…', 'Search apps…', '搜索应用…', 'Rechercher des apps…')}
              className="pl-9"
              aria-label={L('Buscar apps', 'Search apps', '搜索应用', 'Rechercher des apps')}
            />
          </div>

          <SectionTitle
            action={
              <Badge tone="brand">
                {installed.size}/{APPS.length} {L('instalados', 'installed', '已安装', 'installées')}
              </Badge>
            }
          >
            {L('Apps e extensões', 'Apps & extensions', '应用与扩展', 'Apps et extensions')}
          </SectionTitle>

          {filteredApps.length === 0 ? (
            <EmptyState
              icon={<Search className="h-6 w-6" />}
              title={L('Nenhum app encontrado', 'No apps found', '未找到应用', 'Aucune app trouvée')}
              description={L(
                'Tente outro termo de busca.',
                'Try another search term.',
                '尝试其他搜索词。',
                'Essayez un autre terme de recherche.',
              )}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredApps.map((app) => {
                const isOn = installed.has(app.id);
                const hue = hueOf(app.name);
                return (
                  <Card key={app.id} hover className="flex flex-col p-4">
                    <div className="flex items-start gap-3">
                      <span
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl font-display text-lg font-bold text-white ring-1 ring-black/5"
                        style={{
                          background: `linear-gradient(135deg, hsl(${hue} 58% 50%), hsl(${(hue + 38) % 360} 62% 40%))`,
                        }}
                        aria-hidden
                      >
                        {app.name.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium leading-tight">{app.name}</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <Badge tone="neutral">{categoryLabel(app.category)}</Badge>
                          <span className="inline-flex items-center gap-1 text-2xs font-medium text-muted">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {app.rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="mt-3 line-clamp-2 min-h-[2.25rem] text-xs text-muted">{T(app.desc)}</p>

                    <div className="mt-4">
                      <Button
                        size="sm"
                        variant={isOn ? 'outline' : 'primary'}
                        className="w-full"
                        leftIcon={
                          isOn ? <Check className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />
                        }
                        onClick={() => toggleInstall(app.id)}
                      >
                        {isOn
                          ? L('Instalado', 'Installed', '已安装', 'Installée')
                          : L('Instalar', 'Install', '安装', 'Installer')}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* honest note */}
          <div className="rounded-xl border border-hairline bg-surface/50 px-4 py-3 text-xs text-muted">
            {L(
              'Superfície da V4 — as chaves abaixo são demonstrativas e ficam apenas neste navegador.',
              'V4 surface — the keys below are demo-only and live only in this browser.',
              'V4 界面 — 以下密钥仅为演示，且仅保存在此浏览器中。',
              'Surface V4 — les clés ci-dessous sont des démos et restent uniquement dans ce navigateur.',
            )}
          </div>

          {/* api keys */}
          <section>
            <SectionTitle
              action={
                <Button
                  size="sm"
                  leftIcon={<Plus className="h-3.5 w-3.5" />}
                  onClick={() => {
                    setKeyName('');
                    setCreateOpen(true);
                  }}
                >
                  {L('Gerar nova chave', 'Generate new key', '生成新密钥', 'Générer une clé')}
                </Button>
              }
            >
              <span className="inline-flex items-center gap-2">
                <KeyRound className="h-3.5 w-3.5 text-brand-600" />
                {L('Chaves de API', 'API keys', 'API 密钥', 'Clés API')}
              </span>
            </SectionTitle>

            {keys.length === 0 ? (
              <EmptyState
                icon={<KeyRound className="h-6 w-6" />}
                title={L('Nenhuma chave', 'No keys yet', '暂无密钥', 'Aucune clé')}
                description={L(
                  'Gere sua primeira chave para começar a integrar.',
                  'Generate your first key to start integrating.',
                  '生成您的第一个密钥以开始集成。',
                  'Générez votre première clé pour commencer.',
                )}
              />
            ) : (
              <div className="flex flex-col gap-2">
                {keys.map((key) => (
                  <Card key={key.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                    <div className="flex flex-1 items-start gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-600/10 text-brand-600">
                        <KeyRound className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium leading-tight">{key.name}</p>
                        <p className="mt-0.5 font-mono text-xs text-muted">{maskKey(key.value)}</p>
                        <p className="mt-1 text-2xs text-subtle">
                          {L('Criada em', 'Created', '创建于', 'Créée le')} {formatDate(key.created, locale)}
                        </p>
                      </div>
                    </div>
                    <div className="self-end sm:self-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                        onClick={() => revokeKey(key.id)}
                      >
                        {L('Revogar', 'Revoke', '吊销', 'Révoquer')}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* endpoints */}
          <section>
            <SectionTitle>
              <span className="inline-flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5 text-brand-600" />
                {L('Endpoints', 'Endpoints', '端点', 'Endpoints')}
              </span>
            </SectionTitle>
            <Table>
              <thead>
                <tr>
                  <Th>{L('Método', 'Method', '方法', 'Méthode')}</Th>
                  <Th>{L('Caminho', 'Path', '路径', 'Chemin')}</Th>
                  <Th className="hidden sm:table-cell">{L('Descrição', 'Description', '描述', 'Description')}</Th>
                </tr>
              </thead>
              <tbody>
                {ENDPOINTS.map((ep) => (
                  <tr key={`${ep.method} ${ep.path}`} className="transition-colors hover:bg-ink/[0.02]">
                    <Td>
                      <Badge tone={METHOD_TONE[ep.method]}>{ep.method}</Badge>
                    </Td>
                    <Td className="whitespace-nowrap font-mono text-xs">{ep.path}</Td>
                    <Td className="hidden text-muted sm:table-cell">{T(ep.desc)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <p className="mt-2 text-2xs text-subtle">
              {L('Base', 'Base', '基础地址', 'Base')}: <span className="font-mono">{BASE_URL}</span>
            </p>
          </section>

          {/* curl example */}
          <section>
            <SectionTitle
              action={
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Copy className="h-3.5 w-3.5" />}
                  onClick={() => copy(curlExample)}
                >
                  {L('Copiar', 'Copy', '复制', 'Copier')}
                </Button>
              }
            >
              <span className="inline-flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5 text-brand-600" />
                {L('Exemplo (cURL)', 'Example (cURL)', '示例 (cURL)', 'Exemple (cURL)')}
              </span>
            </SectionTitle>
            <div className="overflow-x-auto rounded-xl border border-hairline bg-ink/[0.03]">
              <pre className="whitespace-pre p-4 font-mono text-2xs leading-relaxed text-ink/80">{curlExample}</pre>
            </div>
          </section>
        </div>
      )}

      {/* generate key modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={L('Gerar nova chave', 'Generate new key', '生成新密钥', 'Générer une nouvelle clé')}
        description={L(
          'Dê um nome para identificar onde a chave será usada.',
          'Name it to identify where the key will be used.',
          '为密钥命名以标识其使用位置。',
          "Nommez-la pour identifier où la clé sera utilisée.",
        )}
      >
        <div className="flex flex-col gap-4 p-5">
          <Field label={L('Nome da chave', 'Key name', '密钥名称', 'Nom de la clé')}>
            <Input
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder={L('Ex.: Integração ERP', 'e.g. ERP integration', '例如：ERP 集成', 'Ex. : Intégration ERP')}
              autoFocus
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              {L('Cancelar', 'Cancel', '取消', 'Annuler')}
            </Button>
            <Button leftIcon={<KeyRound className="h-4 w-4" />} onClick={generateKey}>
              {L('Gerar', 'Generate', '生成', 'Générer')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* reveal-once modal */}
      <Modal
        open={!!revealed}
        onClose={() => setRevealed(null)}
        title={L('Chave criada', 'Key created', '密钥已创建', 'Clé créée')}
        description={revealed?.name}
      >
        {revealed && (
          <div className="flex flex-col gap-4 p-5">
            <div className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-2xs text-warning-fg dark:text-warning">
              {L(
                'Copie agora — por segurança, a chave completa não será exibida novamente.',
                'Copy it now — for security, the full key will not be shown again.',
                '请立即复制 — 出于安全考虑，完整密钥将不再显示。',
                "Copiez-la maintenant — par sécurité, la clé complète ne sera plus affichée.",
              )}
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-hairline bg-surface/50 p-3">
              <code className="min-w-0 flex-1 truncate font-mono text-xs">{revealed.value}</code>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<Copy className="h-3.5 w-3.5" />}
                onClick={() => copy(revealed.value)}
              >
                {L('Copiar', 'Copy', '复制', 'Copier')}
              </Button>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setRevealed(null)}>{L('Pronto', 'Done', '完成', 'Terminé')}</Button>
            </div>
          </div>
        )}
      </Modal>
    </ScreenContainer>
  );
}
