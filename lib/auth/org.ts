import { dbQueryOne } from '@/lib/db/pool';
import { isDatabaseConfigured } from '@/lib/db/config';
import { getSessionUser, type SessionUser } from '@/lib/auth/session';
import type { BillingModel, PlanTier } from '@/lib/billing/types';

export interface UserOrgContext {
  user: SessionUser;
  orgId: string;
  role: 'owner' | 'admin' | 'viewer' | 'field_worker';
  billingModel: BillingModel;
  planTier: PlanTier;
  maxZoneSplit: number;
  hectareLimit: number | null;
}

export async function getSessionOrg(): Promise<UserOrgContext | null> {
  const user = await getSessionUser();
  if (!user || !isDatabaseConfigured()) return null;

  type OrgRow = {
    org_id: string;
    role: UserOrgContext['role'];
    billing_model?: BillingModel;
    plan_tier?: PlanTier;
    max_zone_split?: number;
    hectare_limit?: string | null;
  };

  let row: OrgRow | null = null;

  try {
    row = await dbQueryOne<OrgRow>(
      `SELECT m.org_id, m.role,
              o.billing_model, o.plan_tier, o.max_zone_split, o.hectare_limit
       FROM organization_members m
       JOIN organizations o ON o.id = m.org_id
       WHERE m.user_id = $1
       ORDER BY m.created_at ASC
       LIMIT 1`,
      [user.id]
    );
  } catch {
    row = await dbQueryOne<Pick<OrgRow, 'org_id' | 'role'>>(
      `SELECT org_id, role FROM organization_members
       WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1`,
      [user.id]
    );
  }

  if (!row) return null;
  return {
    user,
    orgId: row.org_id,
    role: row.role,
    billingModel: row.billing_model ?? 'hectare',
    planTier: row.plan_tier ?? 'free',
    maxZoneSplit: row.max_zone_split ?? 1,
    hectareLimit: row.hectare_limit != null ? Number(row.hectare_limit) : 5,
  };
}

export function canManageFields(role: UserOrgContext['role']): boolean {
  return role === 'owner' || role === 'admin';
}

export function canManageTeam(role: UserOrgContext['role']): boolean {
  return role === 'owner' || role === 'admin';
}
