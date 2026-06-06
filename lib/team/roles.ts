import type { UserOrgContext } from '@/lib/auth/org';

export type OrgMemberRole = UserOrgContext['role'];

export interface RoleMeta {
  id: OrgMemberRole;
  label: string;
  description: string;
  canInvite: boolean;
}

export const ORG_ROLES: RoleMeta[] = [
  {
    id: 'owner',
    label: 'Propietaria',
    description: 'Control total: parcelas, equipo, facturación y configuración.',
    canInvite: true,
  },
  {
    id: 'admin',
    label: 'Administrador/a',
    description: 'Gestiona parcelas, importaciones, alertas e invita al equipo.',
    canInvite: true,
  },
  {
    id: 'field_worker',
    label: 'Campo',
    description: 'App de campo, capturas y diagnósticos en las zonas asignadas.',
    canInvite: false,
  },
  {
    id: 'viewer',
    label: 'Consulta',
    description: 'Solo lectura: monitor, alertas y reportes sin editar datos.',
    canInvite: false,
  },
];

export const INVITEABLE_ROLES = ORG_ROLES.filter(
  (r) => r.id !== 'owner' && ['admin', 'field_worker', 'viewer'].includes(r.id)
);

export function getRoleLabel(role: string): string {
  return ORG_ROLES.find((r) => r.id === role)?.label ?? role;
}

export function getRoleDescription(role: string): string {
  return ORG_ROLES.find((r) => r.id === role)?.description ?? '';
}
