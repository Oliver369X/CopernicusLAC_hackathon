'use client';

import { brandColors } from '@/lib/design/tokens';

export function chartLegendLabel(value: string) {
  return <span style={{ color: brandColors.foregroundMuted }}>{value}</span>;
}
