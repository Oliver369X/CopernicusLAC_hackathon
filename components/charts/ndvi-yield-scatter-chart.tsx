'use client';

import {
  ScatterChart,
  Scatter,
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
  chartColors,
  chartAxisStroke,
  chartGridStroke,
  chartTick,
  chartLegendWrapperStyle,
} from '@/lib/design/tokens';
import { formatDecimal, roundDecimal } from '@/lib/i18n/format-number';

export interface NdviYieldPoint {
  field: string;
  ndvi: number;
  moisture: number;
  yieldPotential: number;
  riskScore: number;
}

interface NdviYieldScatterChartProps {
  data: NdviYieldPoint[];
  'aria-label'?: string;
}

export function NdviYieldScatterChart({
  data,
  'aria-label': ariaLabel = 'NDVI versus potencial de rendimiento',
}: NdviYieldScatterChartProps) {
  const chartData = data.map((row) => ({
    ...row,
    ndvi: roundDecimal(row.ndvi, 2) ?? 0,
    yieldPotential: roundDecimal(row.yieldPotential, 2) ?? 0,
  }));

  return (
    <ChartFrame aria-label={ariaLabel}>
      <ScatterChart margin={{ top: 12, right: 16, bottom: 8, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
        <XAxis
          dataKey="ndvi"
          type="number"
          name="NDVI"
          stroke={chartAxisStroke}
          tick={chartTick}
          domain={['auto', 'auto']}
        />
        <YAxis
          dataKey="yieldPotential"
          type="number"
          name="Rendimiento (kg/ha)"
          stroke={chartAxisStroke}
          tick={chartTick}
          width={44}
        />
        <Tooltip
          cursor={{ stroke: chartColors[0], strokeDasharray: '4 4', strokeOpacity: 0.6 }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const row = payload[0]?.payload as NdviYieldPoint | undefined;
            if (!row) return null;
            return (
              <ChartTooltipContent
                active
                label={row.field}
                payload={[
                  {
                    name: 'NDVI',
                    value: roundDecimal(row.ndvi, 2) ?? 0,
                    color: chartColors[0],
                  },
                  {
                    name: 'Rendimiento (kg/ha)',
                    value: roundDecimal(row.yieldPotential, 2) ?? 0,
                    color: chartColors[1],
                  },
                ]}
              />
            );
          }}
        />
        <Legend wrapperStyle={chartLegendWrapperStyle} formatter={chartLegendLabel} />
        <Scatter name="Campos" data={chartData} fill={chartColors[0]} />
      </ScatterChart>
    </ChartFrame>
  );
}
