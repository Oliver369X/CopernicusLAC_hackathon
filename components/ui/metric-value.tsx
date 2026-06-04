'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  formatMetricDisplay,
  type MetricDataState,
  type MetricDisplayMeta,
} from '@/lib/i18n/format-metric';
import { METRIC_STATE_LABELS } from '@/lib/i18n/data-source';

const STATE_VARIANT: Record<
  MetricDataState,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  live: 'default',
  seed: 'secondary',
  pending: 'outline',
  unavailable: 'destructive',
};

interface MetricValueProps {
  value: unknown;
  meta?: MetricDisplayMeta;
  className?: string;
  decimals?: number;
}

export function MetricValue({ value, meta, className }: MetricValueProps) {
  const display = formatMetricDisplay(value, meta);

  if (display.state === 'live') {
    return <span className={className}>{display.text}</span>;
  }

  return (
    <span className={`inline-flex flex-col gap-1 ${className ?? ''}`}>
      <Badge variant={STATE_VARIANT[display.state]} className="w-fit text-xs">
        {METRIC_STATE_LABELS[display.state]}
      </Badge>
      {display.cta && (
        <Link
          href={display.cta.href}
          className="text-xs text-primary hover:underline"
        >
          {display.cta.label}
        </Link>
      )}
    </span>
  );
}
