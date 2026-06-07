'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ChartFrame } from '@/components/charts/chart-frame';
import { ChartTooltipContent } from '@/components/charts/chart-tooltip';
import { chartLegendLabel } from '@/components/charts/chart-legend';
import { Badge } from '@/components/ui/badge';
import {
  chartAxisStroke,
  chartGridStroke,
  chartSeries,
  chartTick,
  chartLegendWrapperStyle,
} from '@/lib/design/tokens';
import type { GeodataDataQuality, GeodataSeriesPoint } from '@/lib/integrations/geodata/types';

interface GeodataHistoricalChartProps {
  data: GeodataSeriesPoint[];
  localOverlay?: Array<{ date: string; ndvi: number }>;
  dataQuality?: GeodataDataQuality;
  'aria-label'?: string;
}

function ProvenanceBadge({ dataQuality }: { dataQuality?: GeodataDataQuality }) {
  if (dataQuality === 'cdse') {
    return (
      <Badge className="mb-2 bg-emerald-600 hover:bg-emerald-600 text-[10px]">
        CDSE · tile trimestral
      </Badge>
    );
  }
  if (dataQuality === 'demo') {
    return (
      <Badge className="mb-2 bg-amber-600 hover:bg-amber-600 text-[10px]">
        Demo sintético
      </Badge>
    );
  }
  if (dataQuality === 'mixed') {
    return (
      <Badge variant="outline" className="mb-2 text-[10px] border-amber-500/50">
        Mezcla CDSE + demo
      </Badge>
    );
  }
  return null;
}

export function GeodataHistoricalChart({
  data,
  localOverlay,
  dataQuality,
  'aria-label': ariaLabel = 'Serie histórica NDVI Data-Historica',
}: GeodataHistoricalChartProps) {
  if (data.length === 0 && (!localOverlay || localOverlay.length === 0)) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Sin serie histórica en geo-data para esta parcela.
      </p>
    );
  }

  const hideOverlay = dataQuality === 'cdse';
  const overlay = hideOverlay ? undefined : localOverlay;
  const overlayByDate = new Map(overlay?.map((p) => [p.date, p.ndvi]) ?? []);
  const chartData = data.map((row) => ({
    ...row,
    ndviLocal: overlayByDate.get(row.date) ?? null,
  }));

  const hasOverlay = overlay && overlay.length > 0;

  return (
    <div>
      <ProvenanceBadge dataQuality={dataQuality} />
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
            name="NDVI histórico (Data-Historica)"
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
    </div>
  );
}
