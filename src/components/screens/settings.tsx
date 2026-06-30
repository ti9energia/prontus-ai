'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  User,
  Building2,
  Users,
  ShieldCheck,
  FileLock2,
  Languages,
  MessageCircle,
  Sparkles,
  Settings as SettingsIcon,
  Plus,
  Trash2,
  KeyRound,
  Smartphone,
  Lock,
  Globe2,
  ArrowUpRight,
  Bot,
  Stethoscope,
  type LucideIcon,
} from 'lucide-react';
import { getCurrentUser } from '@/lib/data';
import { useSession } from '@/lib/auth';
import { locales, localeMeta, type Locale } from '@/i18n/routing';
import { openTab } from '@/lib/workspace/store';
import { ScreenContainer, ScreenHeader, Table, Th, Td } from './_kit';
import { Avatar, Switch, Separator } from '@/components/ui/misc';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/overlay';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

type TabKey =
  | 'profile'
  | 'clinic'
  | 'users'
  | 'security'
  | 'consent'
  | 'language'
  | 'whatsapp'
  | 'ai';

const TABS: { key: TabKey; icon: LucideIcon }[] = [
  { key: 'profile', icon: User },
  { key: 'clinic', icon: Building2 },
  { key: 'users', icon: Users },
  { key: 'security', icon: ShieldCheck },
  { key: 'consent', icon: FileLock2 },
  { key: 'language', icon: Languages },
  { key: 'whatsapp', icon: MessageCircle },
  { key: 'ai', icon: Sparkles },
];

const TIMEZONES = ['America/Sao_Paulo', 'America/New_York', 'Europe/Paris', 'Asia/Shanghai'];
const CURRENCIES = ['BRL', 'USD', 'EUR', 'CNY'];
const RETENTION_DAYS = [30, 90, 180, 365];
const AI_MODELS = ['claude-opus-4-8', 'claude-sonnet-4-6'];
const INVITE_ROLE_KEYS = ['medico', 'faturista', 'gestor', 'compliance', 'viewer'];

/* localStorage keys for the per-panel preference blobs (local-first persistence). */
const STORE = {
  profile: 'auronis:settings:profile',
  clinic: 'auronis:settings:clinic',
  language: 'auronis:settings:language',
  ai: 'auronis:settings:ai',
} as const;

/* Per-locale strings for copy that has no existing i18n key. */
const COPY: Record<string, Record<Locale, string>> = {
  subtitle: {
    'pt-BR': 'Gerencie seu perfil, sua clínica e como o Auronis Health trabalha para você.',
    en: 'Manage your profile, your clinic, and how Auronis Health works for you.',
    'zh-CN': '管理您的个人资料、诊所以及 Auronis Health 的工作方式。',
    'fr-FR': 'Gérez votre profil, votre clinique et la façon dont Auronis Health travaille pour vous.',
  },
  profileDesc: {
    'pt-BR': 'Estas informações aparecem nas notas clínicas e nas guias TISS.',
    en: 'This information appears on clinical notes and TISS guides.',
    'zh-CN': '此信息将显示在临床记录和 TISS 表单上。',
    'fr-FR': 'Ces informations apparaissent sur les notes cliniques et les guides TISS.',
  },
  clinicTitle: {
    'pt-BR': 'Dados da clínica',
    en: 'Clinic details',
    'zh-CN': '诊所信息',
    'fr-FR': 'Informations de la clinique',
  },
  clinicName: {
    'pt-BR': 'Nome da clínica',
    en: 'Clinic name',
    'zh-CN': '诊所名称',
    'fr-FR': 'Nom de la clinique',
  },
  cnpj: {
    'pt-BR': 'CNPJ',
    en: 'Tax ID',
    'zh-CN': '税号',
    'fr-FR': 'Numéro fiscal',
  },
  address: {
    'pt-BR': 'Endereço',
    en: 'Address',
    'zh-CN': '地址',
    'fr-FR': 'Adresse',
  },
  phone: {
    'pt-BR': 'Telefone',
    en: 'Phone',
    'zh-CN': '电话',
    'fr-FR': 'Téléphone',
  },
  plan: {
    'pt-BR': 'Plano',
    en: 'Plan',
    'zh-CN': '套餐',
    'fr-FR': 'Forfait',
  },
  securityTitle: {
    'pt-BR': 'Acesso e autenticação',
    en: 'Access & authentication',
    'zh-CN': '访问与认证',
    'fr-FR': 'Accès et authentification',
  },
  twoFactor: {
    'pt-BR': 'Autenticação em dois fatores',
    en: 'Two-factor authentication',
    'zh-CN': '双重验证',
    'fr-FR': 'Authentification à deux facteurs',
  },
  twoFactorDesc: {
    'pt-BR': 'Exija um segundo fator no login para proteger dados de saúde.',
    en: 'Require a second factor at login to protect health data.',
    'zh-CN': '登录时要求第二重验证以保护健康数据。',
    'fr-FR': 'Exigez un second facteur à la connexion pour protéger les données de santé.',
  },
  sso: {
    'pt-BR': 'Login único (SSO)',
    en: 'Single sign-on (SSO)',
    'zh-CN': '单点登录 (SSO)',
    'fr-FR': 'Authentification unique (SSO)',
  },
  ssoDesc: {
    'pt-BR': 'Conecte seu provedor de identidade corporativo.',
    en: 'Connect your corporate identity provider.',
    'zh-CN': '连接您的企业身份提供商。',
    'fr-FR': 'Connectez votre fournisseur d’identité d’entreprise.',
  },
  changePassword: {
    'pt-BR': 'Alterar senha',
    en: 'Change password',
    'zh-CN': '修改密码',
    'fr-FR': 'Changer le mot de passe',
  },
  activeSessions: {
    'pt-BR': 'Sessões ativas',
    en: 'Active sessions',
    'zh-CN': '活动会话',
    'fr-FR': 'Sessions actives',
  },
  thisDevice: {
    'pt-BR': 'Este dispositivo · agora',
    en: 'This device · now',
    'zh-CN': '此设备 · 当前',
    'fr-FR': 'Cet appareil · maintenant',
  },
  whatsappDesc: {
    'pt-BR': 'Dê à sua IA um número de WhatsApp para puxar dados e agir por mensagem.',
    en: 'Give your AI a WhatsApp number to pull data and act over chat.',
    'zh-CN': '为您的 AI 配置一个 WhatsApp 号码，以便通过聊天提取数据并执行操作。',
    'fr-FR': 'Donnez un numéro WhatsApp à votre IA pour extraire des données et agir par message.',
  },
  openWhatsapp: {
    'pt-BR': 'Abrir controle por WhatsApp',
    en: 'Open WhatsApp control',
    'zh-CN': '打开 WhatsApp 控制台',
    'fr-FR': 'Ouvrir le contrôle WhatsApp',
  },
  aiTitle: {
    'pt-BR': 'Copiloto & agente',
    en: 'Copilot & agent',
    'zh-CN': '副驾驶与智能体',
    'fr-FR': 'Copilote et agent',
  },
  aiDesc: {
    'pt-BR': 'Defina a persona e o modelo que conduzem o copiloto e o agente autônomo.',
    en: 'Set the persona and model that power the copilot and the autonomous agent.',
    'zh-CN': '设置驱动副驾驶和自主智能体的角色与模型。',
    'fr-FR': 'Définissez la persona et le modèle qui animent le copilote et l’agent autonome.',
  },
  personaName: {
    'pt-BR': 'Nome da persona',
    en: 'Persona name',
    'zh-CN': '角色名称',
    'fr-FR': 'Nom de la persona',
  },
  model: {
    'pt-BR': 'Modelo',
    en: 'Model',
    'zh-CN': '模型',
    'fr-FR': 'Modèle',
  },
  proactive: {
    'pt-BR': 'Recomendações proativas do agente',
    en: 'Proactive agent recommendations',
    'zh-CN': '智能体主动推荐',
    'fr-FR': 'Recommandations proactives de l’agent',
  },
  proactiveDesc: {
    'pt-BR': 'O agente monitora glosas e pendências e sugere ações — sempre com sua aprovação.',
    en: 'The agent watches denials and pending items and suggests actions — always with your approval.',
    'zh-CN': '智能体监控拒付和待办事项并建议操作——始终需要您的批准。',
    'fr-FR': 'L’agent surveille les rejets et les tâches en attente et propose des actions — toujours avec votre accord.',
  },
};

function localized(key: keyof typeof COPY, locale: string) {
  return COPY[key][(locale as Locale)] ?? COPY[key]['pt-BR'];
}

/* Client-only persistence helpers. Guarded so they're safe if ever called outside
   the browser; in practice they only run inside effects/handlers. */
function readStore<T>(key: string): Partial<T> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Partial<T>) : null;
  } catch {
    return null;
  }
}

function writeStore(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable / quota exceeded — ignore */
  }
}

export function SettingsScreen({ paneId }: { paneId: string }) {
  const t = useTranslations('settings');
  const locale = useLocale();
  const [active, setActive] = React.useState<TabKey>('profile');

  return (
    <ScreenContainer>
      <ScreenHeader icon={SettingsIcon} title={t('title')} subtitle={localized('subtitle', locale)} />

      <div className="grid gap-5 lg:grid-cols-[232px_minmax(0,1fr)]">
        {/* Vertical tabs */}
        <nav
          className="flex gap-1.5 overflow-x-auto rounded-xl border border-hairline bg-card p-1.5 shadow-xs lg:flex-col lg:gap-0.5 lg:overflow-visible"
          aria-label={t('title')}
        >
          {TABS.map(({ key, icon: Icon }) => {
            const isActive = active === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActive(key)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'group flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors lg:w-full',
                  isActive
                    ? 'bg-brand-600/10 text-brand-700 dark:text-brand-300'
                    : 'text-muted hover:bg-ink/[0.04] hover:text-ink',
                )}
              >
                <Icon
                  className={cn(
                    'h-4.5 w-4.5 shrink-0',
                    isActive ? 'text-brand-600' : 'text-subtle group-hover:text-muted',
                  )}
                />
                <span className="whitespace-nowrap lg:whitespace-normal">{t(`tabs.${key}`)}</span>
              </button>
            );
          })}
        </nav>

        {/* Active panel */}
        <div className="min-w-0">
          {active === 'profile' && <ProfilePanel />}
          {active === 'clinic' && <ClinicPanel />}
          {active === 'users' && <UsersPanel />}
          {active === 'security' && <SecurityPanel />}
          {active === 'consent' && <ConsentPanel />}
          {active === 'language' && <LanguagePanel />}
          {active === 'whatsapp' && <WhatsappPanel paneId={paneId} />}
          {active === 'ai' && <AiPanel />}
        </div>
      </div>
    </ScreenContainer>
  );
}

/* --------------------------- panels --------------------------- */
/* Top-level components (not nested in SettingsScreen) so they keep a stable
   identity across parent renders — otherwise each re-render remounts the active
   panel and wipes its local state (2FA/SSO toggles, retention slider, etc.). */

/** Shared identity for the panels: session values fall back to the seed user. */
function useSettingsIdentity() {
  const user = getCurrentUser();
  const { role, name, email } = useSession();
  return { user, role, displayName: name ?? user.name, displayEmail: email ?? user.email };
}

function ProfilePanel() {
  const t = useTranslations('settings');
  const tr = useTranslations('roles');
  const tc = useTranslations('common');
  const locale = useLocale();
  const { user, role, displayName, displayEmail } = useSettingsIdentity();

  const [form, setForm] = React.useState({
    displayName,
    specialty: 'Clínica geral',
    council: user.council,
    email: displayEmail,
  });

  // Load any saved profile and re-sync identity fields once the async session
  // resolves; a persisted value always wins. localStorage is only touched here.
  React.useEffect(() => {
    const stored = readStore<typeof form>(STORE.profile);
    setForm((f) => ({
      displayName: stored?.displayName ?? displayName,
      specialty: stored?.specialty ?? f.specialty,
      council: stored?.council ?? user.council,
      email: stored?.email ?? displayEmail,
    }));
  }, [displayName, displayEmail, user.council]);

  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = () => {
    writeStore(STORE.profile, form);
    toast.success(tc('states.success'));
  };

  return (
    <Panel
      icon={User}
      title={t('tabs.profile')}
      description={localized('profileDesc', locale)}
      footer={
        <Button leftIcon={<SettingsIcon className="h-4 w-4" />} onClick={save}>
          {tc('actions.save')}
        </Button>
      }
    >
      <div className="flex items-center gap-4 rounded-xl border border-hairline bg-surface/60 p-4">
        <Avatar name={form.displayName} hue={172} size={56} />
        <div className="min-w-0">
          <p className="truncate font-display text-base font-semibold tracking-tight">{form.displayName}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge tone="brand">{role === 'owner' ? tr('org_admin') : tr(user.roleKey as 'medico')}</Badge>
            <span className="text-xs text-muted">{user.orgName}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('profile.name')}>
          <Input value={form.displayName} onChange={set('displayName')} />
        </Field>
        <Field label={t('profile.specialty')}>
          <Input value={form.specialty} onChange={set('specialty')} />
        </Field>
        <Field label={t('profile.council')}>
          <Input value={form.council} onChange={set('council')} />
        </Field>
        <Field label={t('profile.email')}>
          <Input type="email" value={form.email} onChange={set('email')} />
        </Field>
      </div>
    </Panel>
  );
}

function ClinicPanel() {
  const tc = useTranslations('common');
  const locale = useLocale();
  const user = getCurrentUser();

  const [form, setForm] = React.useState({
    orgName: user.orgName,
    cnpj: '12.345.678/0001-90',
    phone: '+55 11 3555-1020',
    address: 'Av. Paulista, 1000 — São Paulo, SP',
  });

  React.useEffect(() => {
    const stored = readStore<typeof form>(STORE.clinic);
    if (stored) setForm((f) => ({ ...f, ...stored }));
  }, []);

  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = () => {
    writeStore(STORE.clinic, form);
    toast.success(tc('states.success'));
  };

  return (
    <Panel
      icon={Building2}
      title={localized('clinicTitle', locale)}
      description={user.orgName}
      footer={
        <Button leftIcon={<SettingsIcon className="h-4 w-4" />} onClick={save}>
          {tc('actions.save')}
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={localized('clinicName', locale)}>
          <Input value={form.orgName} onChange={set('orgName')} />
        </Field>
        <Field label={localized('cnpj', locale)}>
          <Input value={form.cnpj} onChange={set('cnpj')} />
        </Field>
        <Field label={localized('phone', locale)}>
          <Input value={form.phone} onChange={set('phone')} />
        </Field>
        <Field label={localized('plan', locale)}>
          <Input defaultValue={user.planName} disabled />
        </Field>
        <Field label={localized('address', locale)} className="sm:col-span-2">
          <Input value={form.address} onChange={set('address')} />
        </Field>
      </div>
    </Panel>
  );
}

type Member = {
  id: string;
  name: string;
  email: string;
  roleKey: string;
  status: 'active' | 'invited';
};

function UsersPanel() {
  const t = useTranslations('settings');
  const tr = useTranslations('roles');
  const tc = useTranslations('common');
  const locale = useLocale();
  const L = (pt: string, en: string, zh: string, fr: string) =>
    locale === 'en' ? en : locale === 'zh-CN' ? zh : locale === 'fr-FR' ? fr : pt;
  const { displayName, displayEmail } = useSettingsIdentity();

  const [members, setMembers] = React.useState<Member[]>(() => [
    { id: 'self', name: displayName, email: displayEmail, roleKey: 'medico', status: 'active' },
    { id: 'patricia', name: 'Patrícia Lemos', email: 'patricia@clinicaaurora.com.br', roleKey: 'faturista', status: 'active' },
    { id: 'ricardo', name: 'Ricardo Antunes', email: 'ricardo@clinicaaurora.com.br', roleKey: 'gestor', status: 'active' },
    { id: 'camila', name: 'Camila Forte', email: 'camila@clinicaaurora.com.br', roleKey: 'compliance', status: 'invited' },
  ]);

  // Keep the current-user row in sync once the async session identity resolves.
  React.useEffect(() => {
    setMembers((list) =>
      list.map((m) => (m.id === 'self' ? { ...m, name: displayName, email: displayEmail } : m)),
    );
  }, [displayName, displayEmail]);

  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [inviteRole, setInviteRole] = React.useState('faturista');

  const submitInvite = () => {
    const email = inviteEmail.trim();
    if (!email) return;
    setMembers((list) => [
      ...list,
      { id: `m_${Date.now()}`, name: email.split('@')[0], email, roleKey: inviteRole, status: 'invited' },
    ]);
    setInviteOpen(false);
    setInviteEmail('');
    setInviteRole('faturista');
    toast.success(tc('states.success'));
  };

  const removeMember = (id: string) => {
    setMembers((list) => list.filter((m) => m.id !== id));
    toast.success(tc('states.success'));
  };

  return (
    <Panel
      icon={Users}
      title={t('tabs.users')}
      description={localized('subtitle', locale)}
      action={
        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setInviteOpen(true)}>
          {t('users.invite')}
        </Button>
      }
      padded={false}
    >
      <Table className="rounded-none border-0 shadow-none">
        <thead>
          <tr>
            <Th>{t('profile.name')}</Th>
            <Th className="hidden sm:table-cell">{t('users.role')}</Th>
            <Th>{t('users.status')}</Th>
            <Th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id} className="transition-colors hover:bg-ink/[0.02]">
              <Td>
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={m.name} hue={(m.name.length * 47) % 360} size={36} />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{m.name}</p>
                    <p className="truncate text-xs text-muted">{m.email}</p>
                  </div>
                </div>
              </Td>
              <Td className="hidden sm:table-cell">
                <span className="text-sm text-muted">{tr(m.roleKey as 'medico')}</span>
              </Td>
              <Td>
                <Badge tone={m.status === 'active' ? 'success' : 'warning'} dot>
                  {t(`users.${m.status}`)}
                </Badge>
              </Td>
              <Td>
                <button
                  type="button"
                  onClick={() => removeMember(m.id)}
                  aria-label={tc('actions.delete')}
                  className="inline-grid h-8 w-8 place-items-center rounded-md text-subtle transition-colors hover:bg-danger/10 hover:text-danger-fg dark:hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title={t('users.invite')} size="sm">
        <div className="flex flex-col gap-4 p-5">
          <Field label={t('profile.email')}>
            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder={L('nome@clinica.com.br', 'name@clinic.com', '姓名@clinic.com', 'nom@clinique.com')}
            />
          </Field>
          <Field label={t('users.role')}>
            <Select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
              {INVITE_ROLE_KEYS.map((rk) => (
                <option key={rk} value={rk}>
                  {tr(rk as 'medico')}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-hairline bg-surface/40 px-5 py-3.5">
          <Button variant="outline" onClick={() => setInviteOpen(false)}>
            {tc('actions.cancel')}
          </Button>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={submitInvite}>
            {t('users.invite')}
          </Button>
        </div>
      </Modal>
    </Panel>
  );
}

function SecurityPanel() {
  const t = useTranslations('settings');
  const tc = useTranslations('common');
  const locale = useLocale();
  const [twoFactor, setTwoFactor] = React.useState(true);
  const [sso, setSso] = React.useState(false);
  const [pwOpen, setPwOpen] = React.useState(false);
  const [pw, setPw] = React.useState({ cur: '', next: '', confirm: '' });
  const L = (pt: string, en: string, zh: string, fr: string) =>
    locale === 'en' ? en : locale === 'zh-CN' ? zh : locale === 'fr-FR' ? fr : pt;
  const submitPassword = () => {
    if (pw.next.length < 8)
      return toast.error(L('Mínimo de 8 caracteres', 'Minimum 8 characters', '至少 8 个字符', 'Minimum 8 caractères'));
    if (pw.next !== pw.confirm)
      return toast.error(L('As senhas não coincidem', 'Passwords do not match', '密码不一致', 'Les mots de passe ne correspondent pas'));
    setPwOpen(false);
    setPw({ cur: '', next: '', confirm: '' });
    toast.success(tc('states.success'));
  };
  return (
    <Panel icon={ShieldCheck} title={localized('securityTitle', locale)} description={t('tabs.security')}>
      <ToggleRow
        icon={Smartphone}
        tone="success"
        label={localized('twoFactor', locale)}
        description={localized('twoFactorDesc', locale)}
        checked={twoFactor}
        onChange={setTwoFactor}
      />
      <ToggleRow
        icon={KeyRound}
        tone="brand"
        label={localized('sso', locale)}
        description={localized('ssoDesc', locale)}
        checked={sso}
        onChange={setSso}
      />

      <Separator className="my-1" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-ink/[0.06] text-muted">
            <Lock className="h-4.5 w-4.5" />
          </span>
          <div>
            <p className="text-sm font-medium text-ink/90">{localized('changePassword', locale)}</p>
            <p className="text-xs text-muted">{localized('activeSessions', locale)}: 1</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setPwOpen(true)}>
          {localized('changePassword', locale)}
        </Button>
      </div>

      <div className="rounded-xl border border-hairline bg-surface/60 px-4 py-3 text-sm text-muted">
        {localized('thisDevice', locale)}
      </div>

      <Modal open={pwOpen} onClose={() => setPwOpen(false)} title={localized('changePassword', locale)}>
        <div className="flex flex-col gap-4 p-5">
          <Field label={L('Senha atual', 'Current password', '当前密码', 'Mot de passe actuel')}>
            <Input type="password" value={pw.cur} onChange={(e) => setPw((p) => ({ ...p, cur: e.target.value }))} autoFocus />
          </Field>
          <Field label={L('Nova senha', 'New password', '新密码', 'Nouveau mot de passe')}>
            <Input type="password" value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} />
          </Field>
          <Field label={L('Confirmar nova senha', 'Confirm new password', '确认新密码', 'Confirmer le mot de passe')}>
            <Input
              type="password"
              value={pw.confirm}
              onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setPwOpen(false)}>
              {tc('actions.cancel')}
            </Button>
            <Button onClick={submitPassword} disabled={!pw.cur || !pw.next || !pw.confirm}>
              {localized('changePassword', locale)}
            </Button>
          </div>
        </div>
      </Modal>
    </Panel>
  );
}

function ConsentPanel() {
  const t = useTranslations('settings');
  const tc = useTranslations('common');
  const locale = useLocale();
  const [requireConsent, setRequireConsent] = React.useState(true);
  const [retention, setRetention] = React.useState(90);
  const [purgeOpen, setPurgeOpen] = React.useState(false);
  const L = (pt: string, en: string, zh: string, fr: string) =>
    locale === 'en' ? en : locale === 'zh-CN' ? zh : locale === 'fr-FR' ? fr : pt;
  const doPurge = () => {
    setPurgeOpen(false);
    toast.success(L('Dados expirados purgados', 'Expired data purged', '已清除过期数据', 'Données expirées purgées'));
  };
  return (
    <Panel icon={FileLock2} title={t('tabs.consent')} description={localized('subtitle', locale)}>
      <ToggleRow
        icon={ShieldCheck}
        tone="brand"
        label={t('consent.requireConsent')}
        description={t('consent.retentionDesc')}
        checked={requireConsent}
        onChange={setRequireConsent}
      />

      <div className="rounded-xl border border-hairline bg-surface/60 p-4">
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-ink/90">{t('consent.retention')}</p>
            <p className="mt-0.5 text-xs text-muted">{t('consent.retentionDesc')}</p>
          </div>
          <span className="font-display text-lg font-bold tracking-tight tnum text-brand-700 dark:text-brand-300">
            {t('consent.days', { days: retention })}
          </span>
        </div>
        <div className="mt-4">
          <input
            type="range"
            min={0}
            max={RETENTION_DAYS.length - 1}
            step={1}
            value={RETENTION_DAYS.indexOf(retention)}
            onChange={(e) => setRetention(RETENTION_DAYS[Number(e.target.value)])}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-ink/[0.1] accent-brand-600"
            aria-label={t('consent.retention')}
          />
          <div className="mt-2 flex justify-between">
            {RETENTION_DAYS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setRetention(d)}
                className={cn(
                  'text-2xs font-medium tnum transition-colors',
                  retention === d ? 'text-brand-600' : 'text-subtle hover:text-muted',
                )}
              >
                {t('consent.days', { days: d })}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-danger/25 bg-danger/[0.05] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-danger/12 text-danger-fg dark:text-danger">
            <Trash2 className="h-4.5 w-4.5" />
          </span>
          <p className="text-sm text-muted">{t('consent.retentionDesc')}</p>
        </div>
        <Button variant="danger" size="sm" leftIcon={<Trash2 className="h-4 w-4" />} className="shrink-0" onClick={() => setPurgeOpen(true)}>
          {t('consent.purgeNow')}
        </Button>
      </div>

      <Modal open={purgeOpen} onClose={() => setPurgeOpen(false)} title={t('consent.purgeNow')}>
        <div className="flex flex-col gap-4 p-5">
          <p className="text-sm text-muted">
            {L(
              'Esta ação remove permanentemente os dados além do período de retenção. Não pode ser desfeita.',
              'This permanently removes data beyond the retention period. It cannot be undone.',
              '此操作将永久删除超过保留期的数据，且无法撤销。',
              'Cette action supprime définitivement les données au-delà de la période de rétention. Irréversible.',
            )}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setPurgeOpen(false)}>
              {tc('actions.cancel')}
            </Button>
            <Button variant="danger" leftIcon={<Trash2 className="h-4 w-4" />} onClick={doPurge}>
              {t('consent.purgeNow')}
            </Button>
          </div>
        </div>
      </Modal>
    </Panel>
  );
}

function LanguagePanel() {
  const t = useTranslations('settings');
  const tc = useTranslations('common');
  const locale = useLocale();

  const [form, setForm] = React.useState<{
    interfaceLocale: string;
    clinicalLocale: string;
    timezone: string;
    currency: string;
  }>({
    interfaceLocale: locale,
    clinicalLocale: locale,
    timezone: 'America/Sao_Paulo',
    currency: 'BRL',
  });

  React.useEffect(() => {
    const stored = readStore<typeof form>(STORE.language);
    if (stored) setForm((f) => ({ ...f, ...stored }));
  }, []);

  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = () => {
    writeStore(STORE.language, form);
    toast.success(tc('states.success'));
  };

  return (
    <Panel
      icon={Languages}
      title={t('tabs.language')}
      description={localized('subtitle', locale)}
      footer={
        <Button leftIcon={<Globe2 className="h-4 w-4" />} onClick={save}>
          {tc('actions.save')}
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('language.interface')}>
          <Select value={form.interfaceLocale} onChange={set('interfaceLocale')}>
            {locales.map((l) => (
              <option key={l} value={l}>
                {localeMeta[l].flag} {localeMeta[l].label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('language.clinicalContent')}>
          <Select value={form.clinicalLocale} onChange={set('clinicalLocale')}>
            {locales.map((l) => (
              <option key={l} value={l}>
                {localeMeta[l].flag} {localeMeta[l].label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('language.timezone')}>
          <Select value={form.timezone} onChange={set('timezone')}>
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz.replace(/_/g, ' ')}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('language.currency')}>
          <Select value={form.currency} onChange={set('currency')}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </Panel>
  );
}

function WhatsappPanel({ paneId }: { paneId: string }) {
  const t = useTranslations('settings');
  const locale = useLocale();
  return (
    <Panel icon={MessageCircle} title={t('tabs.whatsapp')} description={localized('whatsappDesc', locale)}>
      <div className="flex items-center gap-4 rounded-xl border border-hairline bg-surface/60 p-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#25D366]/12 text-[#1FA855]">
          <MessageCircle className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-ink/90">Mari · +55 11 99000-0000</p>
          <p className="mt-0.5 text-xs text-muted">{localized('whatsappDesc', locale)}</p>
        </div>
      </div>
      <div>
        <Button
          variant="outline"
          leftIcon={<MessageCircle className="h-4 w-4" />}
          rightIcon={<ArrowUpRight className="h-4 w-4" />}
          onClick={() => openTab('whatsapp', undefined, { paneId })}
        >
          {localized('openWhatsapp', locale)}
        </Button>
      </div>
    </Panel>
  );
}

function AiPanel() {
  const tc = useTranslations('common');
  const locale = useLocale();
  const [persona, setPersona] = React.useState('Mari');
  const [model, setModel] = React.useState(AI_MODELS[0]);
  const [proactive, setProactive] = React.useState(true);

  React.useEffect(() => {
    const stored = readStore<{ persona: string; model: string; proactive: boolean }>(STORE.ai);
    if (!stored) return;
    if (typeof stored.persona === 'string') setPersona(stored.persona);
    if (typeof stored.model === 'string') setModel(stored.model);
    if (typeof stored.proactive === 'boolean') setProactive(stored.proactive);
  }, []);

  const save = () => {
    writeStore(STORE.ai, { persona, model, proactive });
    toast.success(tc('states.success'));
  };

  return (
    <Panel
      icon={Sparkles}
      title={localized('aiTitle', locale)}
      description={localized('aiDesc', locale)}
      footer={
        <Button leftIcon={<Sparkles className="h-4 w-4" />} onClick={save}>
          {tc('actions.save')}
        </Button>
      }
    >
      <div className="flex items-center gap-4 rounded-xl border border-hairline bg-surface/60 p-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-600/12 text-brand-600">
          <Bot className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="font-medium text-ink/90">{persona}</p>
          <p className="mt-0.5 text-xs text-muted">{localized('aiDesc', locale)}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={localized('personaName', locale)}>
          <div className="relative">
            <Stethoscope className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <Input value={persona} onChange={(e) => setPersona(e.target.value)} className="pl-9" />
          </div>
        </Field>
        <Field label={localized('model', locale)}>
          <Select value={model} onChange={(e) => setModel(e.target.value)}>
            {AI_MODELS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <ToggleRow
        icon={Sparkles}
        tone="brand"
        label={localized('proactive', locale)}
        description={localized('proactiveDesc', locale)}
        checked={proactive}
        onChange={setProactive}
      />
    </Panel>
  );
}

/* --------------------------- building blocks --------------------------- */

function Panel({
  icon: Icon,
  title,
  description,
  action,
  footer,
  padded = true,
  children,
}: {
  icon: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  padded?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-hairline bg-card shadow-xs">
      <header className="flex items-start justify-between gap-3 border-b border-hairline px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-600/10 text-brand-600">
            <Icon className="h-4.5 w-4.5" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold tracking-tight">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
          </div>
        </div>
        {action}
      </header>
      <div className={cn(padded ? 'flex flex-col gap-5 p-5' : '')}>{children}</div>
      {footer && (
        <footer className="flex items-center justify-end gap-3 border-t border-hairline bg-surface/40 px-5 py-3.5">
          {footer}
        </footer>
      )}
    </section>
  );
}

function ToggleRow({
  icon: Icon,
  tone,
  label,
  description,
  checked,
  onChange,
}: {
  icon: LucideIcon;
  tone: 'brand' | 'success';
  label: React.ReactNode;
  description?: React.ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const toneCls =
    tone === 'brand'
      ? 'bg-brand-600/10 text-brand-600'
      : 'bg-success/12 text-success-fg dark:text-success';
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-hairline bg-surface/60 p-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-lg', toneCls)}>
          <Icon className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink/90">{label}</p>
          {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
        </div>
      </div>
      <Switch checked={checked} onChange={onChange} aria-label={typeof label === 'string' ? label : undefined} />
    </div>
  );
}
