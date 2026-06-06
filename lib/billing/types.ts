export type BillingModel = 'hectare' | 'zone';

export type PlanTier = 'free' | 'growth' | 'scale' | 'cooperative';

export type BillingProfileChoice = 'small_farmer' | 'cooperative';

export type BillingErrorCode =
  | 'HECTARE_LIMIT_EXCEEDED'
  | 'ZONE_SPLIT_NOT_ALLOWED'
  | 'BELOW_COOPERATIVE_MINIMUM';

export interface OrgBillingProfile {
  billingModel: BillingModel;
  planTier: PlanTier;
  hectareLimit: number;
  maxZoneSplit: number;
  totalHa: number;
  estimatedMonthlyUsd: number;
  usagePercent: number;
}

export interface OrgStatusResponse {
  fieldCount: number;
  onboardingComplete: boolean;
  orgId?: string;
  role?: string;
  billing: OrgBillingProfile | null;
}

export interface ImportBillingPreview {
  projectedTotalHa: number;
  estimatedMonthlyUsd: number;
  hectareLimit: number;
  usagePercent: number;
}
