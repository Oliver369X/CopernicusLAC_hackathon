import { describe, expect, it, vi } from 'vitest';
import { resolveScopedFieldContext, scopeFromSession } from '@/lib/agents/scope';
import type { UserOrgContext } from '@/lib/auth/org';

vi.mock('@/lib/data/fields', () => ({
  getFields: vi.fn(async (orgId?: string) => {
    if (orgId === 'org-lucia') {
      return [
        {
          id: 'field-lucia-soja',
          name: 'Chacra Lucía',
          zones: [{ id: 'zone-lucia-soja', fieldId: 'field-lucia-soja', name: 'Parcela' }],
        },
      ];
    }
    if (orgId === 'org-rosa') {
      return [
        {
          id: 'field-rosa-soja',
          name: 'Coop Rosa',
          zones: [{ id: 'zone-rosa-n', fieldId: 'field-rosa-soja', name: 'Norte' }],
        },
      ];
    }
    return [];
  }),
}));

function mockOrg(orgId: string, email: string): UserOrgContext {
  return {
    user: { id: 'u1', email },
    orgId,
    role: 'owner',
    billingModel: orgId === 'org-rosa' ? 'zone' : 'hectare',
    planTier: 'growth',
    maxZoneSplit: 5,
    hectareLimit: 500,
  };
}

describe('agent scope isolation', () => {
  it('Lucía solo ve su campo', async () => {
    const scope = scopeFromSession(mockOrg('org-lucia', 'lucia@doctorsoya.app'), 'Finca Lucía');
    const ok = await resolveScopedFieldContext(scope, 'field-lucia-soja', 'zone-lucia-soja');
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.ctx.field.id).toBe('field-lucia-soja');
  });

  it('Lucía no puede usar campo de Rosa', async () => {
    const scope = scopeFromSession(mockOrg('org-lucia', 'lucia@doctorsoya.app'), 'Finca Lucía');
    const bad = await resolveScopedFieldContext(scope, 'field-rosa-soja');
    expect(bad.ok).toBe(false);
  });
});
