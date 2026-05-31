'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { ChartFrame } from '@/components/charts/chart-frame';
import { ChartTooltipContent } from '@/components/charts/chart-tooltip';
import { healthColors, chartAxisStroke, chartGridStroke } from '@/lib/design/tokens';
import type { Field } from '@/lib/types/field';
import type { HealthLevel } from '@/lib/design/tokens';

const HEALTH_SCORE: Record<Field['overallHealth'], number> = {
  excellent: 95,
  good: 80,
  warning: 60,
  critical: 35,
};

function truncateLabel(name: string, max = 14): string {
  if (name.length <= max) return name;
  return `${name.slice(0, max - 1)}…`;
}

interface FieldHealthBarChartProps {
  fields: Field[];
  'aria-label'?: string;
}

export function FieldHealthBarChart({
  fields,
  'aria-label': ariaLabel = 'Salud por campo',
}: FieldHealthBarChartProps) {
  if (!fields.length) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
        No hay campos para mostrar
      </div>
    );
  }

  const chartData = fields.map((f) => ({
    name: truncateLabel(f.name),
    fullName: f.name,
    value: HEALTH_SCORE[f.overallHealth],
    fill: healthColors[f.overallHealth as HealthLevel],
    health: f.overallHealth,
  }));

  return (
    <ChartFrame aria-label={ariaLabel}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
        <XAxis
          dataKey="name"
          stroke={chartAxisStroke}
          tick={{ fontSize: 10, fill: chartAxisStroke }}
          angle={-32}
          textAnchor="end"
          height={56}
          interval={0}
        />
        <YAxis
          domain={[0, 100]}
          stroke={chartAxisStroke}
          tick={{ fontSize: 10, fill: chartAxisStroke }}
          width={32}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const row = payload[0]?.payload as {
              fullName?: string;
              value?: number;
              fill?: string;
            };
            return (
              <ChartTooltipContent
                active
                payload={[
                  {
                    name: 'Índice salud',
                    value: row?.value,
                    color: row?.fill,
                  },
                ]}
                label={row?.fullName ?? ''}
              />
            );
          }}
        />
        <Bar dataKey="value" name="Índice salud" radius={[6, 6, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`field-health-${entry.fullName}-${index}`} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ChartFrame>
  );
}
