import { NextResponse } from 'next/server';
import { getSessionOrg } from '@/lib/auth/org';
import { countFieldsForOrg } from '@/lib/data/fields';
import { dbQueryOne } from '@/lib/db/pool';
import { isDatabaseConfigured } from '@/lib/db/config';
import { buildOrgBillingProfile } from '@/lib/billing/profile';
import { estimateMonthlyUsd, usagePercent } from '@/lib/billing/plans';
import type { OrgStatusResponse } from '@/lib/billing/types';
import { getOrgHectareUsage } from '@/lib/billing/usage';

function mockBilling(): OrgStatusResponse['billing'] {
  const totalHa = 12.5;
  return {
    billingModel: 'hectare',
    planTier: 'growth',
    hectareLimit: 20,
    maxZoneSplit: 1,
    totalHa,
    estimatedMonthlyUsd: estimateMonthlyUsd(totalHa, 'hectare'),
    usagePercent: usagePercent(totalHa, 20),
  };
}

export async function GET() {
  if (!isDatabaseConfigured()) {
    const body: OrgStatusResponse = {
      fieldCount: 0,
      onboardingComplete: false,
      billing: mockBilling(),
    };
    return NextResponse.json(body);
  }

  const org = await getSessionOrg();
  if (!org) {
    const body: OrgStatusResponse = {
      fieldCount: 0,
      onboardingComplete: false,
      billing: null,
    };
    return NextResponse.json(body);
  }

  const fieldCount = await countFieldsForOrg(org.orgId);
  const orgRow = await dbQueryOne<{
    onboarding_completed_at: string | null;
    billing_model: 'hectare' | 'zone';
    plan_tier: 'free' | 'growth' | 'scale' | 'cooperative';
    hectare_limit: string | null;
    max_zone_split: number;
  }>(
    `SELECT onboarding_completed_at, billing_model, plan_tier, hectare_limit, max_zone_split
     FROM organizations WHERE id = $1`,
    [org.orgId]
  );

  const usage = await getOrgHectareUsage(org.orgId);
  const billing = orgRow
    ? buildOrgBillingProfile(
        {
          billing_model: orgRow.billing_model,
          plan_tier: orgRow.plan_tier,
          hectare_limit:
            orgRow.hectare_limit != null ? Number(orgRow.hectare_limit) : null,
          max_zone_split: orgRow.max_zone_split,
        },
        usage.totalHa
      )
    : null;

  const body: OrgStatusResponse = {
    fieldCount,
    onboardingComplete:
      Boolean(orgRow?.onboarding_completed_at) || fieldCount > 0,
    orgId: org.orgId,
    role: org.role,
    billing,
  };

  return NextResponse.json(body);
}
