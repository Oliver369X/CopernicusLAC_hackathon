import { dbQueryOne } from '@/lib/db/pool';
import { isDatabaseConfigured } from '@/lib/db/config';
import { getSessionUser, type SessionUser } from '@/lib/auth/session';

export interface UserOrgContext {
  user: SessionUser;
  orgId: string;
  role: 'owner' | 'admin' | 'viewer' | 'field_worker';
}

export async function getSessionOrg(): Promise<UserOrgContext | null> {
  const user = await getSessionUser();
  if (!user || !isDatabaseConfigured()) return null;

  const row = await dbQueryOne<{
    org_id: string;
    role: UserOrgContext['role'];
  }>(
    `SELECT org_id, role FROM organization_members WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1`,
    [user.id]
  );

  if (!row) return null;
  return { user, orgId: row.org_id, role: row.role };
}

export function canManageFields(role: UserOrgContext['role']): boolean {
  return role === 'owner' || role === 'admin';
}

export function canManageTeam(role: UserOrgContext['role']): boolean {
  return role === 'owner' || role === 'admin';
}
