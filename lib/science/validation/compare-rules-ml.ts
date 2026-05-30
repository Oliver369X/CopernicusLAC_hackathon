import type { HealthLabel } from '../types';
import type { JoinedGroundTruth } from '../data/types';

export interface RulesMlComparison {
  rulesLabel: HealthLabel | null;
  mlLabel: HealthLabel | null;
  agronomistLabel: HealthLabel | null;
  agreeRulesMl: boolean;
  agreeRulesAg: boolean;
  agreeMlAg: boolean;
}

export function compareRulesMlAg(
  samples: JoinedGroundTruth[]
): RulesMlComparison[] {
  return samples.map((s) => ({
    rulesLabel: (s.healthLabelRules as HealthLabel) ?? null,
    mlLabel: (s.healthLabelMl as HealthLabel) ?? null,
    agronomistLabel: s.healthLabel ?? null,
    agreeRulesMl: s.healthLabelRules === s.healthLabelMl,
    agreeRulesAg: s.healthLabelRules === s.healthLabel,
    agreeMlAg: s.healthLabelMl === s.healthLabel,
  }));
}

export function confusionCounts(comparisons: RulesMlComparison[]): {
  rulesMlAgree: number;
  rulesAgAgree: number;
  mlAgAgree: number;
  total: number;
} {
  let rulesMlAgree = 0;
  let rulesAgAgree = 0;
  let mlAgAgree = 0;
  for (const c of comparisons) {
    if (c.agreeRulesMl) rulesMlAgree++;
    if (c.agreeRulesAg) rulesAgAgree++;
    if (c.agreeMlAg) mlAgAgree++;
  }
  return {
    rulesMlAgree,
    rulesAgAgree,
    mlAgAgree,
    total: comparisons.length,
  };
}
