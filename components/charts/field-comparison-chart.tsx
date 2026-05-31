'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { ChartFrame } from '@/components/charts/chart-frame';
import { ChartTooltipContent } from '@/components/charts/chart-tooltip';
import { chartLegendLabel } from '@/components/charts/chart-legend';
import {
  healthColors,
  chartAxisStroke,
  chartGridStroke,
  chartTick,
  chartLegendWrapperStyle,
} from '@/lib/design/tokens';
import type { Field } from '@/lib/types/field';

const HEALTH_SCORE: Record<Field['overallHealth'], number> = {
  excellent: 95,
  good: 80,
  warning: 60,
  critical: 35,
};

function shortLabel(name: string, max = 16): string {
  if (name.length <= max) return name;
  return `${name.slice(0, max - 1)}…`;
}

interface FieldComparisonChartProps {
  fields: Field[];
  'aria-label'?: string;
}

export function FieldComparisonChart({
  fields,
  'aria-label': ariaLabel = 'Comparación de rendimiento por campo',
}: FieldComparisonChartProps) {
  if (!fields.length) {
    return (
      <div className="flex min-h-[220px] items-center justify-center text-sm text-muted-foreground">
        No hay campos para comparar
      </div>
    );
  }

  const chartData = fields.map((field) => ({
    shortName: shortLabel(field.name),
    fullName: field.name,
    salud: HEALTH_SCORE[field.overallHealth],
    seguridad: Math.max(0, Math.min(100, 100 - field.riskScore)),
  }));

  return (
    <ChartFrame
      aria-label={ariaLabel}
      heightClassName="min-h-[240px] h-[52vw] max-h-[360px] sm:min-h-[280px] sm:h-[320px] sm:max-h-[380px] w-full min-w-0"
    >
      <BarChart
        layout="vertical"
        data={chartData}
        margin={{ top: 8, right: 16, left: 4, bottom: 8 }}
        barCategoryGap="18%"
        barGap={4}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 100]}
          stroke={chartAxisStroke}
          tick={chartTick}
          tickCount={5}
        />
        <YAxis
          type="category"
          dataKey="shortName"
          width={108}
          stroke={chartAxisStroke}
          tick={{ ...chartTick, fill: '#e2e8f0' }}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const row = payload[0]?.payload as {
              fullName?: string;
              salud?: number;
              seguridad?: number;
            };
            return (
              <ChartTooltipContent
                active
                label={row?.fullName ?? ''}
                payload={[
                  { name: 'Índice de salud', value: row?.salud, color: healthColors.good },
                  {
                    name: 'Seguridad operativa',
                    value: row?.seguridad,
                    color: healthColors.warning,
                  },
                ]}
              />
            );
          }}
        />
        <Legend wrapperStyle={chartLegendWrapperStyle} formatter={chartLegendLabel} />
        <Bar
          dataKey="salud"
          name="Índice de salud"
          fill={healthColors.good}
          radius={[0, 4, 4, 0]}
          barSize={14}
        />
        <Bar
          dataKey="seguridad"
          name="Seguridad operativa"
          fill={healthColors.warning}
          radius={[0, 4, 4, 0]}
          barSize={14}
        />
      </BarChart>
    </ChartFrame>
  );
}
