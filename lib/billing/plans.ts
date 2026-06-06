import type { BillingModel, BillingProfileChoice, PlanTier } from './types';

/** Única fuente de verdad para límites y precios. */
export const PLAN_CONFIG: Record<
  PlanTier,
  {
    billingModel: BillingModel;
    hectareLimit: number;
    maxZoneSplit: number;
    pricePerHa: number;
  }
> = {
  free: { billingModel: 'hectare', hectareLimit: 5, maxZoneSplit: 1, pricePerHa: 0 },
  growth: { billingModel: 'hectare', hectareLimit: 20, maxZoneSplit: 1, pricePerHa: 1.0 },
  scale: { billingModel: 'hectare', hectareLimit: 50, maxZoneSplit: 2, pricePerHa: 0.5 },
  cooperative: { billingModel: 'zone', hectareLimit: 500, maxZoneSplit: 8, pricePerHa: 0 },
};

export const COOPERATIVE_MIN_HA = 51;

export const TIER_LABELS_ES: Record<PlanTier, string> = {
  free: 'Gratis',
  growth: 'Crecimiento',
  scale: 'Escala',
  cooperative: 'Cooperativa',
};

export function getPlanConfig(tier: PlanTier) {
  return PLAN_CONFIG[tier];
}

/**
 * Resuelve el tier efectivo según hectáreas totales.
 * @example resolveEffectiveTier(20, 'hectare') → 'growth'
 */
export function resolveEffectiveTier(
  totalHa: number,
  billingModel: BillingModel
): PlanTier {
  if (billingModel === 'zone') {
    return 'cooperative';
  }
  if (totalHa <= 5) return 'free';
  if (totalHa <= 20) return 'growth';
  if (totalHa <= 50) return 'scale';
  throw new Error('HECTARE_LIMIT_EXCEEDED');
}

/**
 * Estima el costo mensual en USD.
 * @example estimateMonthlyUsd(20, 'hectare') → 20
 * @example estimateMonthlyUsd(50, 'hectare') → 25
 */
export function estimateMonthlyUsd(
  totalHa: number,
  billingModel: BillingModel
): number {
  if (billingModel === 'zone') return 0;
  if (totalHa <= 5) return 0;
  if (totalHa <= 20) return roundUsd(totalHa * 1.0);
  if (totalHa <= 50) return roundUsd(totalHa * 0.5);
  return 0;
}

export function getDefaultZoneSplit(billingModel: BillingModel): number {
  return billingModel === 'zone' ? 4 : 1;
}

export function capZoneSplit(requested: number, maxZoneSplit: number): number {
  const safe = Number.isFinite(requested) ? Math.floor(requested) : 1;
  return Math.min(maxZoneSplit, Math.max(1, safe));
}

export function getHectareLimitForTier(tier: PlanTier): number {
  return PLAN_CONFIG[tier].hectareLimit;
}

export function usagePercent(totalHa: number, hectareLimit: number): number {
  if (hectareLimit <= 0) return 0;
  return Math.round((totalHa / hectareLimit) * 1000) / 10;
}

export function billingProfileToOrgColumns(profile: BillingProfileChoice): {
  billing_model: BillingModel;
  plan_tier: PlanTier;
  hectare_limit: number;
  max_zone_split: number;
} {
  if (profile === 'cooperative') {
    return {
      billing_model: 'zone',
      plan_tier: 'cooperative',
      hectare_limit: PLAN_CONFIG.cooperative.hectareLimit,
      max_zone_split: PLAN_CONFIG.cooperative.maxZoneSplit,
    };
  }
  return {
    billing_model: 'hectare',
    plan_tier: 'free',
    hectare_limit: PLAN_CONFIG.free.hectareLimit,
    max_zone_split: PLAN_CONFIG.free.maxZoneSplit,
  };
}

export function isValidBillingProfile(
  value: string | undefined
): value is BillingProfileChoice {
  return value === 'small_farmer' || value === 'cooperative';
}

function roundUsd(n: number): number {
  return Math.round(n * 100) / 100;
}
