'use client';

import { SatelliteData, getAverageValue } from '@/lib/mock-data/satellite-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartFrame } from '@/components/charts/chart-frame';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  chartTooltipStyle,
  chartAxisStroke,
  chartGridStroke,
  healthColors,
} from '@/lib/design/tokens';

interface HealthMetricsProps {
  satelliteData: SatelliteData;
  trendHistory?: Array<{ date: string; ndvi: string; ndmi: string }>;
}

export default function HealthMetrics({
  satelliteData,
  trendHistory,
}: HealthMetricsProps) {
  const ndviAvg = getAverageValue(satelliteData.ndvi);
  const ndmiAvg = getAverageValue(satelliteData.ndmi);
  const tempAvg = getAverageValue(satelliteData.temperature);
  const moistureAvg = getAverageValue(satelliteData.soilMoisture);

  const timeSeries =
    trendHistory?.map((point) => ({
      day: point.date,
      ndvi: parseFloat(point.ndvi),
      moisture: parseFloat(point.ndmi) * 100,
    })) ?? [
      { day: '1', ndvi: 0.55, moisture: 58 },
      { day: '7', ndvi: ndviAvg, moisture: moistureAvg },
    ];

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-base">Indicadores de salud</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
            <p className="mb-1 text-xs text-muted-foreground">NDVI</p>
            <p className="text-lg font-bold tabular-nums text-foreground">
              {ndviAvg.toFixed(2)}
            </p>
            <p className="mt-1 text-xs text-health-good">Vegetación</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
            <p className="mb-1 text-xs text-muted-foreground">NDMI</p>
            <p className="text-lg font-bold tabular-nums text-foreground">
              {ndmiAvg.toFixed(2)}
            </p>
            <p className="mt-1 text-xs text-health-good">Humedad</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
            <p className="mb-1 text-xs text-muted-foreground">Temperatura</p>
            <p className="text-lg font-bold tabular-nums text-foreground">
              {tempAvg.toFixed(1)}°C
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Actual</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
            <p className="mb-1 text-xs text-muted-foreground">Humedad suelo</p>
            <p className="text-lg font-bold tabular-nums text-foreground">
              {moistureAvg.toFixed(0)}%
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Óptimo</p>
          </div>
        </div>

        <div className="border-t border-border/60 pt-2">
          <p className="mb-3 text-xs font-medium text-muted-foreground">
            Tendencia 7 días
          </p>
          <ChartFrame
            heightClassName="h-[200px] w-full"
            aria-label="Tendencia NDVI"
          >
            <LineChart data={timeSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke={chartAxisStroke} />
              <YAxis tick={{ fontSize: 11 }} stroke={chartAxisStroke} domain={[0, 1]} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Line
                type="monotone"
                dataKey="ndvi"
                name="NDVI"
                stroke={healthColors.excellent}
                strokeWidth={2}
                dot={{ fill: healthColors.excellent, r: 3 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ChartFrame>
        </div>
      </CardContent>
    </Card>
  );
}
