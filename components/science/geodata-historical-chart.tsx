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
import type { GeodataSeriesPoint } from '@/lib/integrations/geodata/types';

interface GeodataHistoricalChartProps {
  data: GeodataSeriesPoint[];
  localOverlay?: Array<{ date: string; ndvi: number }>;
  'aria-label'?: string;
}

export function GeodataHistoricalChart({
  data,
  localOverlay,
  'aria-label': ariaLabel = 'Serie histórica NDVI Data-Historica',
}: GeodataHistoricalChartProps) {
  if (data.length === 0 && (!localOverlay || localOverlay.length === 0)) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Sin serie histórica en geo-data para esta parcela.
      </p>
    );
  }

  const overlayByDate = new Map(localOverlay?.map((p) => [p.date, p.ndvi]) ?? []);
  const chartData = data.map((row) => ({
    ...row,
    ndviLocal: overlayByDate.get(row.date) ?? null,
  }));

  const hasOverlay = localOverlay && localOverlay.length > 0;

  return (
    <ChartFrame aria-label={ariaLabel}>
      <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
        <XAxis dataKey="date" stroke={chartAxisStroke} tick={chartTick} minTickGap={32} />
        <YAxis stroke={chartAxisStroke} tick={chartTick} width={36} domain={[0, 1]} />
        <Tooltip content={<ChartTooltipContent />} />
        <Legend wrapperStyle={chartLegendWrapperStyle} formatter={chartLegendLabel} />
        <Line
          type="monotone"
          dataKey="ndvi"
          stroke={chartSeries.ndvi}
          strokeWidth={2}
          dot={false}
          name="NDVI histórico (geo-data)"
        />
        {hasOverlay && (
          <Line
            type="monotone"
            dataKey="ndviLocal"
            stroke={chartSeries.ndre}
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
            connectNulls={false}
            name="NDVI DB local (90d)"
          />
        )}
        <Line
          type="monotone"
          dataKey="ndwi"
          stroke={chartSeries.dpRvi}
          strokeWidth={1.5}
          dot={false}
          name="NDWI"
        />
      </LineChart>
    </ChartFrame>
  );
}
