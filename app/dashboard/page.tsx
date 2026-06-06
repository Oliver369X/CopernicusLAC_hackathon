'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFields } from '@/hooks/use-fields';
import { useAnalyticsSummary } from '@/hooks/use-analytics-summary';
import { useAlerts } from '@/hooks/use-alerts';
import {
  Briefcase,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Bell,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageContainer, PageHeader } from '@/components/layout/page-header';
import { KpiStat } from '@/components/layout/kpi-stat';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import Link from 'next/link';
import { ChartFrame } from '@/components/charts/chart-frame';
import { MetricProgressRow } from '@/components/charts/metric-progress-row';
import { DistributionDonutChart } from '@/components/charts/distribution-donut-chart';
import { FieldHealthBarChart } from '@/components/charts/field-health-bar-chart';
import { ChartTooltipContent } from '@/components/charts/chart-tooltip';
import { FadeIn, StaggerList } from '@/components/ui/motion';
import { PilotOverviewCard } from '@/components/dashboard/pilot-overview-card';
import { SatelliteSyncProgress } from '@/components/onboarding/satellite-sync-progress';
import {
  chartColors,
  healthColors,
  getCropColor,
  getCropLabelEs,
  riskLevels,
  chartAxisStroke,
  chartGridStroke,
} from '@/lib/design/tokens';
import { useOrgBilling } from '@/hooks/use-org-billing';
import { PlanUsageBanner } from '@/components/billing/plan-usage-banner';

export default function EnhancedDashboard() {
  const { fields, source: fieldsSource } = useFields();
  const { billing } = useOrgBilling();
  const { alerts: engineAlerts } = useAlerts();
  const { summary } = useAnalyticsSummary();
  const [trendData, setTrendData] = useState<
    Array<{ date: string; salud: number; riesgo: number }>
  >([]);

  useEffect(() => {
    fetch('/api/analytics/health-trend?range=week')
      .then((r) => r.json())
      .then((d) => {
        const timeline = (d.timeline ?? []) as Array<{
          date: string;
          salud: number;
          riesgo: number;
        }>;
        setTrendData(
          timeline.map((p) => ({
            date: p.date.slice(5),
            salud: p.salud,
            riesgo: p.riesgo,
          }))
        );
      })
      .catch(() => setTrendData([]));
  }, []);

  const cropChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    (summary?.fields?.length ? summary.fields : fields).forEach((f) => {
      const crop = 'crop' in f ? f.crop : (f as { crop: string }).crop;
      counts[crop] = (counts[crop] ?? 0) + 1;
    });
    return Object.entries(counts).map(([crop, value]) => ({
      name: getCropLabelEs(crop),
      value,
      fill: getCropColor(crop),
    }));
  }, [summary, fields]);

  const riskDistribution = useMemo(() => {
    const buckets = [
      { label: 'Riesgo bajo', labelLong: 'Riesgo bajo (0-30)', min: 0, max: 30, color: riskLevels.low },
      { label: 'Riesgo medio', labelLong: 'Riesgo medio (30-60)', min: 30, max: 60, color: riskLevels.medium },
      { label: 'Riesgo alto', labelLong: 'Riesgo alto (60-85)', min: 60, max: 85, color: riskLevels.high },
      { label: 'Crítico', labelLong: 'Crítico (85+)', min: 85, max: 101, color: riskLevels.critical },
    ];
    return buckets.map((b) => ({
      ...b,
      count: fields.filter((f) => f.riskScore >= b.min && f.riskScore < b.max).length,
    }));
  }, [fields]);

  const riskTotal = riskDistribution.reduce((s, i) => s + i.count, 0) || 1;

  const activeAlerts = useMemo(
    () => engineAlerts.filter((a) => !a.resolved).slice(0, 5),
    [engineAlerts]
  );

  const criticalAlerts = activeAlerts.filter((a) => a.severity === 'critical');

  const healthScoreMap = { excellent: 95, good: 80, warning: 60, critical: 35 };
  const totalArea = fields.reduce((sum, f) => sum + f.area, 0);
  const avgHealth = fields.length
    ? Math.round(
        fields.reduce((sum, f) => sum + healthScoreMap[f.overallHealth], 0) / fields.length
      )
    : 0;
  const avgRisk = fields.length
    ? Math.round(fields.reduce((sum, f) => sum + f.riskScore, 0) / fields.length)
    : 0;

  return (
    <PageContainer>
      <PageHeader
        title="Panel de control"
        description="Vista general de salud, riesgo y alertas de tus campos monitoreados."
        badge={
          <Badge variant="outline" className="text-xs capitalize">
            {fieldsSource} · {fields.length} campos
          </Badge>
        }
        actions={
          <Link href="/alerts">
            <Button className="h-10 gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Ver alertas</span>
              <span className="sm:hidden">Alertas</span>
            </Button>
          </Link>
        }
      />

      {billing && (
        <FadeIn>
          <PlanUsageBanner billing={billing} />
        </FadeIn>
      )}

      <StaggerList className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <li className="min-w-0">
          <KpiStat label="Campos" value={fields.length} hint="Monitoreados" icon={Briefcase} />
        </li>
        <li className="min-w-0">
          <KpiStat
            label="Área total"
            value={totalArea}
            hint="hectáreas"
            icon={BarChart3}
            variant="success"
          />
        </li>
        <li className="min-w-0">
          <KpiStat
            label="Salud promedio"
            value={`${avgHealth}%`}
            hint="Índice compuesto"
            icon={Activity}
            variant="success"
          />
        </li>
        <li className="min-w-0">
          <KpiStat
            label="Riesgo promedio"
            value={avgRisk}
            hint="puntuación /100"
            icon={TrendingUp}
            variant="warning"
          />
        </li>
        <li className="col-span-2 min-w-0 lg:col-span-1">
          <KpiStat
            label="Alertas activas"
            value={activeAlerts.length}
            hint={criticalAlerts.length > 0 ? `${criticalAlerts.length} críticas` : 'Estable'}
            icon={AlertTriangle}
            variant={activeAlerts.length > 0 ? 'danger' : 'default'}
          />
        </li>
      </StaggerList>

      <FadeIn className="space-y-4">
        <SatelliteSyncProgress />
        <PilotOverviewCard alerts={engineAlerts} />
      </FadeIn>

      <FadeIn className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        <Card className="glass-card min-w-0 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <TrendingUp className="h-5 w-5 shrink-0 text-primary" />
              Tendencia 7 días
            </CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            <ChartFrame aria-label="Gráfico de tendencia de salud y riesgo en 7 días">
              <AreaChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashColorHealth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={healthColors.excellent} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={healthColors.excellent} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="dashColorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={healthColors.critical} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={healthColors.critical} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
                <XAxis
                  dataKey="date"
                  stroke={chartAxisStroke}
                  tick={{ fontSize: 10, fill: chartAxisStroke }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke={chartAxisStroke}
                  tick={{ fontSize: 10, fill: chartAxisStroke }}
                  width={28}
                />
                <Tooltip content={<ChartTooltipContent />} />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  formatter={(value) => (
                    <span style={{ color: '#e2e8f0' }}>{value}</span>
                  )}
                />
                <Area
                  type="monotone"
                  dataKey="salud"
                  name="Salud"
                  stroke={healthColors.excellent}
                  fill="url(#dashColorHealth)"
                />
                <Area
                  type="monotone"
                  dataKey="riesgo"
                  name="Riesgo"
                  stroke={healthColors.critical}
                  fill="url(#dashColorRisk)"
                />
              </AreaChart>
            </ChartFrame>
          </CardContent>
        </Card>

        <Card className="glass-card min-w-0">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Distribución de cultivos</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0 overflow-hidden">
            <DistributionDonutChart
              data={cropChartData}
              aria-label="Distribución de cultivos"
              emptyMessage="Sin datos de cultivos"
            />
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        <Card className="glass-card min-w-0">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Salud por campo</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0 overflow-hidden">
            <FieldHealthBarChart fields={fields} />
          </CardContent>
        </Card>

        <Card className="glass-card min-w-0">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Distribución de riesgo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {riskDistribution.map((item) => (
              <MetricProgressRow
                key={item.label}
                label={
                  <>
                    <span className="sm:hidden">{item.label}</span>
                    <span className="hidden sm:inline">{item.labelLong}</span>
                  </>
                }
                valueLabel={String(item.count)}
                percent={(item.count / riskTotal) * 100}
                barStyle={{ backgroundColor: item.color }}
              />
            ))}
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn className="flex justify-end">
        <Link
          href="/analytics"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Ver analítica completa
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </FadeIn>
    </PageContainer>
  );
}
