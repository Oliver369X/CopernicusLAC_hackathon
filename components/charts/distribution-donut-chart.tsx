'use client';

import { PieChart, Pie, Cell, Tooltip, Sector } from 'recharts';
import type { PieSectorDataItem } from 'recharts/types/polar/Pie';
import type { TooltipProps } from 'recharts';
import { ChartFrame } from '@/components/charts/chart-frame';
import { chartTooltipStyle } from '@/lib/design/tokens';

export interface DistributionDatum {
  name: string;
  value: number;
  fill: string;
}

interface DistributionDonutChartProps {
  data: DistributionDatum[];
  emptyMessage?: string;
  'aria-label'?: string;
}

function DistributionTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;

  const entry = payload[0];
  const name = entry.name ?? '';
  const percent =
    typeof entry.payload === 'object' &&
    entry.payload !== null &&
    'percent' in entry.payload &&
    typeof (entry.payload as { percent: number }).percent === 'number'
      ? Math.round((entry.payload as { percent: number }).percent * 100)
      : null;

  if (percent == null) return null;

  return (
    <div
      style={{
        ...chartTooltipStyle,
        padding: '8px 12px',
        fontSize: 12,
        fontWeight: 600,
        color: '#f0fdfa',
      }}
    >
      {name}: {percent}%
    </div>
  );
}

function ActiveShape(props: PieSectorDataItem) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      stroke="#2dd4bf"
      strokeWidth={2}
      style={{ filter: 'drop-shadow(0 0 8px rgba(45, 212, 191, 0.45))' }}
    />
  );
}

export function DistributionDonutChart({
  data,
  emptyMessage = 'Sin datos',
  'aria-label': ariaLabel = 'Distribución',
}: DistributionDonutChartProps) {
  if (!data.length) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-3 min-w-0">
      <ChartFrame
        aria-label={ariaLabel}
        heightClassName="min-h-[180px] h-[38vw] max-h-[220px] sm:min-h-[200px] sm:h-[220px] sm:max-h-[240px] w-full min-w-0"
      >
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            dataKey="value"
            nameKey="name"
            innerRadius="52%"
            outerRadius="78%"
            paddingAngle={data.length > 1 ? 3 : 0}
            activeShape={ActiveShape}
          >
            {data.map((entry, index) => (
              <Cell
                key={`dist-cell-${entry.name}-${index}`}
                fill={entry.fill}
                stroke="transparent"
              />
            ))}
          </Pie>
          <Tooltip content={<DistributionTooltip />} />
        </PieChart>
      </ChartFrame>
      <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {data.map((item) => (
          <li
            key={item.name}
            className="flex items-center justify-between gap-2 rounded-md border border-border/50 bg-muted/20 px-3 py-2 text-sm"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.fill }}
              />
              <span className="truncate text-foreground">{item.name}</span>
            </span>
            <span className="shrink-0 tabular-nums font-medium text-foreground">
              {total > 0 ? Math.round((item.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** @deprecated Use DistributionDonutChart */
export type CropDistributionDatum = DistributionDatum;
export const CropDistributionChart = DistributionDonutChart;
