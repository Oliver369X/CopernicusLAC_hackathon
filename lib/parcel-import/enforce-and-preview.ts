import type { UserOrgContext } from '@/lib/auth/org';
import { validateImportAgainstPlan } from '@/lib/billing/enforce';
import { buildOrgBillingProfile } from '@/lib/billing/profile';
import { estimateMonthlyUsd, usagePercent } from '@/lib/billing/plans';
import { getOrgHectareUsage } from '@/lib/billing/usage';
import type { ImportBillingPreview } from '@/lib/billing/types';
import type { ImportParcel } from './types';

function sumImportHa(parcels: { areaHa: number }[]): number {
  return parcels.reduce((s, p) => s + p.areaHa, 0);
}

export type ImportEnforcementResult =
  | {
      ok: true;
      effectiveZoneSplit: number;
      billingPreview: ImportBillingPreview;
      warnings: string[];
      importHa: number;
      projectedTotalHa: number;
    }
  | {
      ok: false;
      status: 422;
      message: string;
      code: string;
      warnings: string[];
    };

export async function runImportEnforcement(ctx: {
  org: UserOrgContext;
  parcels: ImportParcel[];
  requestedZoneSplit: number;
  dryRun: boolean;
}): Promise<ImportEnforcementResult> {
  const usage = await getOrgHectareUsage(ctx.org.orgId);
  const importHa = sumImportHa(ctx.parcels);

  const enforcement = validateImportAgainstPlan({
    billingModel: ctx.org.billingModel,
    planTier: ctx.org.planTier,
    maxZoneSplit: ctx.org.maxZoneSplit,
    currentTotalHa: usage.totalHa,
    importTotalHa: importHa,
    requestedZoneSplit: ctx.requestedZoneSplit,
    isDryRun: ctx.dryRun,
  });

  if (!enforcement.ok) {
    return {
      ok: false,
      status: 422,
      message: enforcement.message,
      code: enforcement.code,
      warnings: [],
    };
  }

  const projectedTotalHa = usage.totalHa + importHa;
  const billingProfile = buildOrgBillingProfile(
    {
      billing_model: ctx.org.billingModel,
      plan_tier: ctx.org.planTier,
      hectare_limit: ctx.org.hectareLimit,
      max_zone_split: ctx.org.maxZoneSplit,
    },
    projectedTotalHa
  );

  const billingPreview: ImportBillingPreview = {
    projectedTotalHa,
    estimatedMonthlyUsd: estimateMonthlyUsd(projectedTotalHa, ctx.org.billingModel),
    hectareLimit: billingProfile.hectareLimit,
    usagePercent: usagePercent(projectedTotalHa, billingProfile.hectareLimit),
  };

  return {
    ok: true,
    effectiveZoneSplit: enforcement.effectiveZoneSplit,
    billingPreview,
    warnings: enforcement.warnings,
    importHa,
    projectedTotalHa,
  };
}
