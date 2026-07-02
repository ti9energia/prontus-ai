'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { UserCog, Plus, Stethoscope, ReceiptText, BarChart3, ShieldCheck } from 'lucide-react';
import { currentOrgId, listOrgUsers, addOrgUser } from '@/lib/data';
import type { RoleKey } from '@/lib/types';
import { ScreenContainer, ScreenHeader, StatCard, Table, Th, Td } from './_kit';
import { Avatar } from '@/components/ui/misc';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/overlay';
import { EmptyState } from '@/components/ui/feedback';
import { toast } from '@/lib/toast';

const ASSIGNABLE: RoleKey[] = ['org_admin', 'manager', 'medico', 'faturista', 'gestor', 'viewer'];

const ROLE_TONE: Partial<Record<RoleKey, React.ComponentProps<typeof Badge>['tone']>> = {
  org_admin: 'brand',
  manager: 'accent',
  medico: 'success',
  faturista: 'info',
  gestor: 'warning',
  viewer: 'neutral',
};

/** Team / roster management for a hospital org (Block 5b) — reads db().users by org,
 *  invites new members with a role. */
export function EquipeScreen({ paneId }: { paneId: string }) {
  void paneId;
  const locale = useLocale();
  const L = (pt: string, en: string, zh: string, fr: string) =>
    locale === 'en' ? en : locale === 'zh-CN' ? zh : locale === 'fr-FR' ? fr : pt;
  const [, bump] = React.useReducer((x: number) => x + 1, 0);
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState<RoleKey>('medico');

  const orgId = currentOrgId();
  const users = listOrgUsers(orgId);

  const roleLabel = (r: RoleKey): string =>
    ({
      owner: 'Owner',
      staff: 'Staff',
      support: 'Support',
      org_admin: L('Admin da org', 'Org admin', '组织管理员', 'Admin org'),
      manager: L('Gestor de equipe', 'Team manager', '团队经理', 'Resp. équipe'),
      medico: L('Médico(a)', 'Physician', '医生', 'Médecin'),
      faturista: L('Faturista', 'Billing', '收费', 'Facturation'),
      gestor: L('Gestor', 'Manager', '管理', 'Gestion'),
      viewer: L('Leitura', 'Viewer', '只读', 'Lecture'),
    })[r];

  /** One-line permission summary per role — what this person can touch. */
  const rolePerms = (r: RoleKey): string =>
    ({
      owner: L('Acesso total à plataforma', 'Full platform access', '平台全部权限', 'Accès total à la plateforme'),
      staff: L('Operação interna Auronis', 'Auronis internal ops', 'Auronis 内部运营', 'Opérations internes Auronis'),
      support: L('Suporte somente leitura', 'Read-only support', '只读支持', 'Support en lecture seule'),
      org_admin: L(
        'Tudo na organização: equipe, faturamento, configurações',
        'Everything in the org: team, billing, settings',
        '组织内全部：团队、收费、设置',
        'Tout dans l’organisation : équipe, facturation, réglages',
      ),
      manager: L(
        'Equipe e relatórios; sem dados clínicos',
        'Team & reports; no clinical data',
        '团队与报告；无临床数据',
        'Équipe et rapports ; pas de données cliniques',
      ),
      medico: L(
        'Consultas, prontuário, documentos e exames',
        'Encounters, records, documents and labs',
        '就诊、病历、文档与检验',
        'Consultations, dossiers, documents et examens',
      ),
      faturista: L(
        'Guias TISS, glosas e reenvios',
        'TISS claims, denials and resubmissions',
        'TISS 单据、拒付与重交',
        'Feuilles TISS, rejets et renvois',
      ),
      gestor: L(
        'Relatórios, contratos e autorizações',
        'Reports, contracts and authorizations',
        '报告、合同与授权',
        'Rapports, contrats et autorisations',
      ),
      viewer: L('Somente leitura', 'Read only', '只读', 'Lecture seule'),
    })[r];

  /* Headcount per role family, for the summary row. */
  const count = (keys: RoleKey[]) => users.filter((u) => keys.includes(u.roleKey)).length;
  const counters = [
    { label: L('Médicos', 'Physicians', '医生', 'Médecins'), value: count(['medico']), icon: Stethoscope, tone: 'success' as const },
    { label: L('Faturistas', 'Billing', '收费', 'Facturation'), value: count(['faturista']), icon: ReceiptText, tone: 'brand' as const },
    { label: L('Gestão', 'Management', '管理', 'Gestion'), value: count(['gestor', 'manager']), icon: BarChart3, tone: 'warning' as const },
    { label: L('Admins', 'Admins', '管理员', 'Admins'), value: count(['org_admin', 'owner']), icon: ShieldCheck, tone: 'accent' as const },
  ];

  const invite = () => {
    if (!email.trim()) return;
    addOrgUser(orgId, { name, email, roleKey: role });
    setOpen(false);
    setName('');
    setEmail('');
    setRole('medico');
    bump();
    toast.success(L('Convite enviado', 'Invite sent', '邀请已发送', 'Invitation envoyée'));
  };

  return (
    <ScreenContainer>
      <ScreenHeader
        icon={UserCog}
        title={L('Equipe', 'Team', '团队', 'Équipe')}
        subtitle={L(
          'Gerencie os acessos da sua organização.',
          'Manage your organization’s access.',
          '管理您组织的访问权限。',
          'Gérez les accès de votre organisation.',
        )}
        actions={
          <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setOpen(true)}>
            {L('Convidar', 'Invite', '邀请', 'Inviter')}
          </Button>
        }
      />

      {/* headcount by role */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {counters.map((c) => (
          <StatCard key={c.label} label={c.label} value={c.value} icon={c.icon} tone={c.tone} />
        ))}
      </div>

      {users.length === 0 ? (
        <EmptyState
          icon={<UserCog className="h-6 w-6" />}
          title={L('Nenhum membro ainda', 'No members yet', '暂无成员', 'Aucun membre pour l’instant')}
          description={L(
            'Convide médicos, faturistas e gestores para trabalharem juntos.',
            'Invite physicians, billing staff and managers to work together.',
            '邀请医生、收费员和管理者协同工作。',
            'Invitez médecins, facturation et gestionnaires à travailler ensemble.',
          )}
          action={
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setOpen(true)}>
              {L('Convidar', 'Invite', '邀请', 'Inviter')}
            </Button>
          }
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>{L('Membro', 'Member', '成员', 'Membre')}</Th>
              <Th className="hidden sm:table-cell">{L('Papel', 'Role', '角色', 'Rôle')}</Th>
              <Th className="hidden lg:table-cell">{L('Permissões', 'Permissions', '权限', 'Permissions')}</Th>
              <Th>{L('Status', 'Status', '状态', 'Statut')}</Th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="transition-colors hover:bg-ink/[0.02]">
                <Td>
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={u.name} hue={(u.name.length * 47) % 360} size={36} />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{u.name}</p>
                      <p className="truncate text-xs text-muted">{u.email}</p>
                    </div>
                  </div>
                </Td>
                <Td className="hidden sm:table-cell">
                  <Badge tone={ROLE_TONE[u.roleKey] ?? 'neutral'}>{roleLabel(u.roleKey)}</Badge>
                </Td>
                <Td className="hidden max-w-[320px] lg:table-cell">
                  <span className="block truncate text-xs text-muted">{rolePerms(u.roleKey)}</span>
                </Td>
                <Td>
                  <Badge tone={u.status === 'invited' ? 'warning' : 'success'} dot>
                    {u.status === 'invited'
                      ? L('Convidado', 'Invited', '已邀请', 'Invité')
                      : L('Ativo', 'Active', '已激活', 'Actif')}
                  </Badge>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={L('Convidar para a equipe', 'Invite to team', '邀请加入团队', 'Inviter dans l’équipe')}>
        <div className="flex flex-col gap-4 p-5">
          <Field label={L('Nome', 'Name', '姓名', 'Nom')}>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </Field>
          <Field label={L('E-mail', 'Email', '邮箱', 'E-mail')}>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="medico@clinica.com" />
          </Field>
          <Field label={L('Papel', 'Role', '角色', 'Rôle')} hint={rolePerms(role)}>
            <Select value={role} onChange={(e) => setRole(e.target.value as RoleKey)}>
              {ASSIGNABLE.map((r) => (
                <option key={r} value={r}>
                  {roleLabel(r)}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {L('Cancelar', 'Cancel', '取消', 'Annuler')}
            </Button>
            <Button onClick={invite}>{L('Enviar convite', 'Send invite', '发送邀请', 'Envoyer')}</Button>
          </div>
        </div>
      </Modal>
    </ScreenContainer>
  );
}
