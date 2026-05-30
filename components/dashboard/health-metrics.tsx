'use client';

import { SatelliteData, getAverageValue } from '@/lib/mock-data/satellite-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface HealthMetricsProps {
  satelliteData: SatelliteData;
  trendHistory?: Array<{ date: string; ndvi: string; ndmi: string }>;
}

export default function HealthMetrics({ satelliteData, trendHistory }: HealthMetricsProps) {
  const ndviAvg = getAverageValue(satelliteData.ndvi);
  const ndmiAvg = getAverageValue(satelliteData.ndmi);
  const tempAvg = getAverageValue(satelliteData.temperature);
  const moistureAvg = getAverageValue(satelliteData.soilMoisture);

  const timeSeries =
    trendHistory?.map((point, i) => ({
      day: point.date,
      ndvi: parseFloat(point.ndvi),
      moisture: parseFloat(point.ndmi) * 100,
    })) ??
    [
      { day: '1', ndvi: 0.55, moisture: 58 },
      { day: '7', ndvi: ndviAvg, moisture: moistureAvg },
    ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Health Indicators</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border border-border p-3 bg-muted/30">
            <p className="text-muted-foreground text-xs mb-1">NDVI</p>
            <p className="text-lg font-bold text-foreground">
              {ndviAvg.toFixed(2)}
            </p>
            <p className="text-xs text-health-good mt-1">Vegetation</p>
          </div>

          <div className="rounded-lg border border-border p-3 bg-muted/30">
            <p className="text-muted-foreground text-xs mb-1">NDMI</p>
            <p className="text-lg font-bold text-foreground">
              {ndmiAvg.toFixed(2)}
            </p>
            <p className="text-xs text-health-good mt-1">Moisture</p>
          </div>

          <div className="rounded-lg border border-border p-3 bg-muted/30">
            <p className="text-muted-foreground text-xs mb-1">Temperature</p>
            <p className="text-lg font-bold text-foreground">
              {tempAvg.toFixed(1)}°C
            </p>
            <p className="text-xs text-muted-foreground mt-1">Current</p>
          </div>

          <div className="rounded-lg border border-border p-3 bg-muted/30">
            <p className="text-muted-foreground text-xs mb-1">Soil Moisture</p>
            <p className="text-lg font-bold text-foreground">
              {moistureAvg.toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">Optimal</p>
          </div>
        </div>

        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground mb-3 font-medium">
            7-Day Trend
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={timeSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 12 }}
                stroke="#9ca3af"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                stroke="#9ca3af"
                domain={[0, 1]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                }}
              />
              <Line
                type="monotone"
                dataKey="ndvi"
                stroke="#16a34a"
                strokeWidth={2}
                dot={{ fill: '#16a34a', r: 3 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
