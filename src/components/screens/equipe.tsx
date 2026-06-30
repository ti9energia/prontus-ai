'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { UserCog, Plus } from 'lucide-react';
import { currentOrgId, listOrgUsers, addOrgUser } from '@/lib/data';
import type { RoleKey } from '@/lib/types';
import { ScreenContainer, ScreenHeader } from './_kit';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/overlay';
import { toast } from '@/lib/toast';

const ASSIGNABLE: RoleKey[] = ['org_admin', 'manager', 'medico', 'faturista', 'gestor', 'viewer'];

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
      <div className="flex flex-col gap-2">
        {users.map((u) => (
          <Card key={u.id} className="flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{u.name}</p>
              <p className="text-2xs text-muted">{u.email}</p>
            </div>
            <Badge tone="neutral">{roleLabel(u.roleKey)}</Badge>
            {u.status === 'invited' && <Badge tone="warning">{L('Convidado', 'Invited', '已邀请', 'Invité')}</Badge>}
          </Card>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={L('Convidar para a equipe', 'Invite to team', '邀请加入团队', 'Inviter dans l’équipe')}>
        <div className="flex flex-col gap-4 p-5">
          <Field label={L('Nome', 'Name', '姓名', 'Nom')}>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </Field>
          <Field label={L('E-mail', 'Email', '邮箱', 'E-mail')}>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="medico@clinica.com" />
          </Field>
          <Field label={L('Papel', 'Role', '角色', 'Rôle')}>
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
