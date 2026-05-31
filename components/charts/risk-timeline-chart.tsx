'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
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

export interface RiskTimelinePoint {
  date: string;
  riesgo: number;
  campos: number;
}

interface RiskTimelineChartProps {
  data: RiskTimelinePoint[];
  'aria-label'?: string;
}

export function RiskTimelineChart({
  data,
  'aria-label': ariaLabel = 'Tendencia de riesgo',
}: RiskTimelineChartProps) {
  return (
    <ChartFrame aria-label={ariaLabel}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
        <XAxis dataKey="date" stroke={chartAxisStroke} tick={chartTick} minTickGap={24} />
        <YAxis stroke={chartAxisStroke} tick={chartTick} width={36} />
        <Tooltip content={<ChartTooltipContent />} />
        <Legend wrapperStyle={chartLegendWrapperStyle} formatter={chartLegendLabel} />
        <Line
          type="monotone"
          dataKey="riesgo"
          name="Riesgo promedio"
          stroke={healthColors.warning}
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="campos"
          name="Campos en riesgo"
          stroke={healthColors.critical}
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ChartFrame>
  );
}
