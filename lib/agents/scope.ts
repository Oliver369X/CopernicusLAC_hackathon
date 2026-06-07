import type { Field, FieldZone } from '@/lib/types/field';
import { getFields } from '@/lib/data/fields';
import type { UserOrgContext } from '@/lib/auth/org';

export interface AgentScope {
  orgId: string;
  orgName: string;
  userId: string;
  userEmail: string;
  role: UserOrgContext['role'];
  billingModel: UserOrgContext['billingModel'];
}

export interface ScopedFieldContext {
  field: Field;
  zone?: FieldZone;
  fields: Field[];
}

export function scopeFromSession(org: UserOrgContext, orgName: string): AgentScope {
  return {
    orgId: org.orgId,
    orgName,
    userId: org.user.id,
    userEmail: org.user.email,
    role: org.role,
    billingModel: org.billingModel,
  };
}

export async function loadOrgFields(scope: AgentScope): Promise<Field[]> {
  return getFields(scope.orgId);
}

export async function resolveScopedFieldContext(
  scope: AgentScope,
  fieldId?: string,
  zoneId?: string
): Promise<{ ok: true; ctx: ScopedFieldContext } | { ok: false; error: string }> {
  const fields = await loadOrgFields(scope);
  if (!fields.length) {
    return { ok: false, error: 'Sin campos en tu organización' };
  }

  const field = fieldId ? fields.find((f) => f.id === fieldId) : fields[0];
  if (fieldId && !field) {
    return { ok: false, error: 'Campo no pertenece a tu cuenta' };
  }
  if (!field) {
    return { ok: false, error: 'Campo no encontrado' };
  }

  const zone = zoneId
    ? field.zones.find((z) => z.id === zoneId)
    : field.zones[0];
  if (zoneId && !zone) {
    return { ok: false, error: 'Zona no pertenece a tu parcela' };
  }

  return { ok: true, ctx: { field, zone, fields } };
}
