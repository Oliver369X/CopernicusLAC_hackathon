import type { BillingModel, OrgBillingProfile, PlanTier } from './types';
import {
  estimateMonthlyUsd,
  getHectareLimitForTier,
  resolveEffectiveTier,
  usagePercent,
} from './plans';

export interface OrgBillingRow {
  billing_model: BillingModel;
  plan_tier: PlanTier;
  hectare_limit: number | null;
  max_zone_split: number;
}

export function buildOrgBillingProfile(
  row: OrgBillingRow,
  totalHa: number
): OrgBillingProfile {
  const billingModel = row.billing_model;
  let planTier = row.plan_tier;
  let hectareLimit = Number(row.hectare_limit ?? 0);

  if (billingModel === 'hectare') {
    try {
      planTier = resolveEffectiveTier(totalHa, billingModel);
      hectareLimit = getHectareLimitForTier(planTier);
    } catch {
      hectareLimit = getHectareLimitForTier('scale');
    }
  } else if (!hectareLimit) {
    hectareLimit = getHectareLimitForTier('cooperative');
  }

  return {
    billingModel,
    planTier,
    hectareLimit,
    maxZoneSplit: row.max_zone_split,
    totalHa,
    estimatedMonthlyUsd: estimateMonthlyUsd(totalHa, billingModel),
    usagePercent: usagePercent(totalHa, hectareLimit),
  };
}
