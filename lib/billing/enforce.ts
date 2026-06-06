import type { BillingErrorCode, BillingModel, PlanTier } from './types';
import {
  COOPERATIVE_MIN_HA,
  capZoneSplit,
  getHectareLimitForTier,
  resolveEffectiveTier,
} from './plans';

export interface ValidateImportParams {
  billingModel: BillingModel;
  planTier: PlanTier;
  maxZoneSplit: number;
  currentTotalHa: number;
  importTotalHa: number;
  requestedZoneSplit: number;
  isDryRun: boolean;
}

export type ValidateImportResult =
  | {
      ok: true;
      effectiveZoneSplit: number;
      warnings: string[];
    }
  | {
      ok: false;
      code: BillingErrorCode;
      message: string;
    };

export function validateImportAgainstPlan(
  params: ValidateImportParams
): ValidateImportResult {
  const {
    billingModel,
    planTier,
    maxZoneSplit,
    currentTotalHa,
    importTotalHa,
    requestedZoneSplit,
    isDryRun,
  } = params;

  const projectedTotalHa = currentTotalHa + importTotalHa;
  const warnings: string[] = [];

  let effectiveZoneSplit = capZoneSplit(requestedZoneSplit, maxZoneSplit);

  if (billingModel === 'hectare') {
    effectiveZoneSplit = 1;
    if (requestedZoneSplit > 1) {
      warnings.push('Tu plan usa 1 zona por parcela; se ignoró el split solicitado.');
    }

    let hectareLimit: number;
    try {
      const effectiveTier = resolveEffectiveTier(projectedTotalHa, billingModel);
      hectareLimit = getHectareLimitForTier(effectiveTier);
    } catch {
      return {
        ok: false,
        code: 'HECTARE_LIMIT_EXCEEDED',
        message: `Tenés ${roundHa(projectedTotalHa)} ha y el límite del plan pequeña agricultora es 50 ha. Contactá para migrar a cooperativa.`,
      };
    }

    if (projectedTotalHa > hectareLimit) {
      return {
        ok: false,
        code: 'HECTARE_LIMIT_EXCEEDED',
        message: `Tenés ${roundHa(currentTotalHa)} ha y el import agrega ${roundHa(importTotalHa)} ha (total ${roundHa(projectedTotalHa)} ha). El límite es ${hectareLimit} ha.`,
      };
    }
  } else {
    const hectareLimit = getHectareLimitForTier(planTier);
    if (projectedTotalHa > hectareLimit) {
      return {
        ok: false,
        code: 'HECTARE_LIMIT_EXCEEDED',
        message: `Tenés ${roundHa(projectedTotalHa)} ha y el límite cooperativo es ${hectareLimit} ha.`,
      };
    }

    if (requestedZoneSplit > maxZoneSplit) {
      return {
        ok: false,
        code: 'ZONE_SPLIT_NOT_ALLOWED',
        message: `Tu plan permite máximo ${maxZoneSplit} subzonas por lote.`,
      };
    }

    if (projectedTotalHa < COOPERATIVE_MIN_HA) {
      const msg = `El plan cooperativo requiere al menos ${COOPERATIVE_MIN_HA} ha en total (proyectado: ${roundHa(projectedTotalHa)} ha).`;
      if (isDryRun) {
        warnings.push(msg);
      } else {
        return {
          ok: false,
          code: 'BELOW_COOPERATIVE_MINIMUM',
          message: msg,
        };
      }
    }
  }

  return { ok: true, effectiveZoneSplit, warnings };
}

function roundHa(n: number): number {
  return Math.round(n * 100) / 100;
}
