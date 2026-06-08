'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ChartFrame } from '@/components/charts/chart-frame';
import { ChartTooltipContent } from '@/components/charts/chart-tooltip';
import { chartLegendLabel } from '@/components/charts/chart-legend';
import {
  chartAxisStroke,
  chartGridStroke,
  chartSeries,
  chartTick,
  chartLegendWrapperStyle,
} from '@/lib/design/tokens';

export interface ScienceSeriesPoint {
  date: string;
  ndvi: number;
  ndre: number | null;
  dpRvi: number | null;
}

interface ScienceTimeseriesChartProps {
  data: ScienceSeriesPoint[];
  'aria-label'?: string;
  plainLanguage?: boolean;
}

export function ScienceTimeseriesChart({
  data,
  'aria-label': ariaLabel,
  plainLanguage = false,
}: ScienceTimeseriesChartProps) {
  const resolvedAria = ariaLabel ?? (plainLanguage ? 'Verdor del cultivo en el tiempo' : 'Serie temporal NDVI, NDRE y DpRVI');
  return (
    <ChartFrame aria-label={resolvedAria}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
        <XAxis dataKey="date" stroke={chartAxisStroke} tick={chartTick} minTickGap={28} />
        <YAxis stroke={chartAxisStroke} tick={chartTick} width={36} />
        <Tooltip content={<ChartTooltipContent />} />
        {plainLanguage ? null : (
          <Legend wrapperStyle={chartLegendWrapperStyle} formatter={chartLegendLabel} />
        )}
        <Line
          type="monotone"
          dataKey="ndvi"
          stroke={chartSeries.ndvi}
          strokeWidth={2}
          dot={false}
          name={plainLanguage ? 'Verdor' : 'NDVI'}
        />
        {!plainLanguage && (
          <>
            <Line
              type="monotone"
              dataKey="ndre"
              stroke={chartSeries.ndre}
              strokeWidth={2}
              dot={false}
              name="NDRE"
            />
            <Line
              type="monotone"
              dataKey="dpRvi"
              stroke={chartSeries.dpRvi}
              strokeWidth={2}
              dot={false}
              name="DpRVI"
            />
          </>
        )}
      </LineChart>
    </ChartFrame>
  );
}
