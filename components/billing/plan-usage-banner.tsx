'use client';

import Link from 'next/link';
import type { OrgBillingProfile } from '@/lib/billing/types';
import { TIER_LABELS_ES } from '@/lib/billing/plans';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { formatDecimal } from '@/lib/i18n/format-number';

interface PlanUsageBannerProps {
  billing: OrgBillingProfile;
}

function progressClass(percent: number): string {
  if (percent >= 100) return '[&>div]:bg-health-critical';
  if (percent >= 80) return '[&>div]:bg-health-warning';
  return '[&>div]:bg-[var(--aura-green)]';
}

export function PlanUsageBanner({ billing }: PlanUsageBannerProps) {
  const tierLabel = TIER_LABELS_ES[billing.planTier];
  const isCoop = billing.billingModel === 'zone';

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">
          Plan {tierLabel} · {formatDecimal(billing.totalHa)} de{' '}
          {formatDecimal(billing.hectareLimit)} ha
        </p>
        {isCoop ? (
          <span className="text-xs text-muted-foreground">Piloto BID — contacto comercial</span>
        ) : billing.estimatedMonthlyUsd > 0 ? (
          <span className="text-xs font-medium text-foreground">
            Estimado: ${formatDecimal(billing.estimatedMonthlyUsd)}/mes
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Sin costo mensual</span>
        )}
      </div>
      <Progress
        value={Math.min(100, billing.usagePercent)}
        className={`h-2 ${progressClass(billing.usagePercent)}`}
      />
      <div className="flex justify-end">
        <Button variant="outline" size="sm" asChild>
          <Link href="/#planes">Ampliar plan</Link>
        </Button>
      </div>
    </div>
  );
}
