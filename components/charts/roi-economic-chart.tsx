'use client';

import {
  ComposedChart,
  Bar,
  Line,
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
  chartAxisStroke,
  chartGridStroke,
  chartTick,
  chartLegendWrapperStyle,
  chartSeries,
} from '@/lib/design/tokens';

export interface RoiChartDatum {
  field: string;
  fullName: string;
  investment: number;
  projectedRevenue: number;
  roi: number;
}

interface RoiEconomicChartProps {
  data: RoiChartDatum[];
  'aria-label'?: string;
}

function shortLabel(name: string, max = 14): string {
  if (name.length <= max) return name;
  return `${name.slice(0, max - 1)}…`;
}

export function RoiEconomicChart({
  data,
  'aria-label': ariaLabel = 'Análisis económico ROI',
}: RoiEconomicChartProps) {
  if (!data.length) {
    return (
      <div className="flex min-h-[220px] items-center justify-center text-sm text-muted-foreground">
        Sin datos económicos
      </div>
    );
  }

  const chartData = data.map((row) => ({
    ...row,
    field: shortLabel(row.fullName),
  }));

  return (
    <ChartFrame
      aria-label={ariaLabel}
      heightClassName="min-h-[260px] h-[58vw] max-h-[400px] sm:min-h-[300px] sm:h-[340px] sm:max-h-[420px] w-full min-w-0"
    >
      <ComposedChart data={chartData} margin={{ top: 12, right: 8, left: 0, bottom: 56 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
        <XAxis
          dataKey="field"
          stroke={chartAxisStroke}
          tick={chartTick}
          interval={0}
          angle={-28}
          textAnchor="end"
          height={56}
        />
        <YAxis
          yAxisId="left"
          stroke={chartAxisStroke}
          tick={chartTick}
          width={40}
          label={{
            value: 'USD (miles)',
            angle: -90,
            position: 'insideLeft',
            offset: 10,
            style: { fill: chartAxisStroke, fontSize: 12 },
          }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke={chartAxisStroke}
          tick={chartTick}
          width={36}
          domain={['auto', 'auto']}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const row = payload[0]?.payload as RoiChartDatum & { field?: string };
            return (
              <ChartTooltipContent
                active
                label={row?.fullName ?? String(label ?? '')}
                payload={payload.map((p) => ({
                  name: String(p.name ?? ''),
                  value: typeof p.value === 'number' ? p.value : Number(p.value),
                  color: p.color,
                }))}
              />
            );
          }}
        />
        <Legend wrapperStyle={chartLegendWrapperStyle} formatter={chartLegendLabel} />
        <Bar
          yAxisId="left"
          dataKey="investment"
          fill={chartSeries.investment}
          name="Inversión"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          yAxisId="left"
          dataKey="projectedRevenue"
          fill={chartSeries.revenue}
          name="Ingresos proyectados"
          radius={[4, 4, 0, 0]}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="roi"
          stroke={chartSeries.roi}
          strokeWidth={2}
          dot={{ r: 3 }}
          name="ROI %"
        />
      </ComposedChart>
    </ChartFrame>
  );
}
