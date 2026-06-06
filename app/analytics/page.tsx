'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useFields } from '@/hooks/use-fields';
import { useAnalyticsSummary } from '@/hooks/use-analytics-summary';
import type { SatelliteRiskPoint } from '@/lib/analytics/satellite-risk';
import { CROP_PROFILES } from '@/lib/mock-data/crops';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageContainer, PageHeader } from '@/components/layout/page-header';
import { KpiStat } from '@/components/layout/kpi-stat';
import { DistributionDonutChart } from '@/components/charts/distribution-donut-chart';
import { FieldComparisonChart } from '@/components/charts/field-comparison-chart';
import { RiskTimelineChart } from '@/components/charts/risk-timeline-chart';
import { RoiEconomicChart, type RoiChartDatum } from '@/components/charts/roi-economic-chart';
import { FadeIn } from '@/components/ui/motion';
import {
  AlertCircle,
  TrendingUp,
  BarChart3,
  Download,
  MapPin,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import {
  healthDistributionToChartData,
  getCropColor,
  getCropLabelEs,
} from '@/lib/design/tokens';
import { formatDecimal } from '@/lib/i18n/format-number';
import { downloadReportPdf } from '@/lib/reports/download-pdf-client';
import { toast } from 'sonner';

export default function Analytics() {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'season'>('month');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [riskTimeline, setRiskTimeline] = useState<SatelliteRiskPoint[]>([]);
  const { fields } = useFields();
  const { summary } = useAnalyticsSummary();

  useEffect(() => {
    fetch(`/api/analytics/satellite-risk?range=${selectedTimeRange}`)
      .then((r) => r.json())
      .then((data) => setRiskTimeline((data.timeline ?? []) as SatelliteRiskPoint[]))
      .catch(() => setRiskTimeline([]));
  }, [selectedTimeRange]);

  const healthDistribution = useMemo(() => {
    const data = summary?.healthDistribution ?? {
      excellent: fields.filter((f) => f.overallHealth === 'excellent').length,
      good: fields.filter((f) => f.overallHealth === 'good').length,
      warning: fields.filter((f) => f.overallHealth === 'warning').length,
      critical: fields.filter((f) => f.overallHealth === 'critical').length,
    };
    return healthDistributionToChartData(data);
  }, [summary, fields]);

  const cropDistribution = useMemo(() => {
    const cropCount: Record<string, number> = {};
    fields.forEach((field) => {
      cropCount[field.crop] = (cropCount[field.crop] || 0) + 1;
    });
    return Object.entries(cropCount).map(([crop, value]) => ({
      name: getCropLabelEs(crop),
      value,
      fill: getCropColor(crop),
    }));
  }, [fields]);

  const economicData = useMemo((): (RoiChartDatum & { daysToMaturity: number })[] => {
    return fields.map((field) => {
      const daysToMaturity = CROP_PROFILES[field.crop].cycleLength - field.daysFromPlanting;
      const estimatedYield =
        field.overallHealth === 'excellent'
          ? 5500
          : field.overallHealth === 'good'
            ? 4800
            : 3500;
      const investmentPerHa = 800;
      const totalInvestment = field.area * investmentPerHa;
      const pricePerUnit = field.crop === 'wheat' ? 250 : field.crop === 'corn' ? 220 : 420;
      const projectedRevenue = (estimatedYield / 1000) * field.area * pricePerUnit;
      const roi = ((projectedRevenue - totalInvestment) / totalInvestment) * 100;

      return {
        field: field.name,
        fullName: field.name,
        investment: totalInvestment / 1000,
        projectedRevenue: projectedRevenue / 1000,
        roi,
        daysToMaturity,
      };
    });
  }, [fields]);

  const healthScoreMap = { excellent: 95, good: 80, warning: 60, critical: 35 };

  const highRiskFields = useMemo(
    () =>
      [...fields]
        .filter((f) => f.riskScore >= 50)
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 5),
    [fields]
  );

  const averageHealth = useMemo(
    () =>
      fields.length
        ? fields.reduce((sum, f) => {
            const score = healthScoreMap[f.overallHealth] ?? 50;
            return sum + score;
          }, 0) / fields.length
        : 0,
    [fields]
  );

  const totalArea = useMemo(
    () => fields.reduce((s, f) => s + f.area, 0),
    [fields]
  );

  const averageRisk = useMemo(
    () =>
      fields.length
        ? fields.reduce((s, f) => s + f.riskScore, 0) / fields.length
        : 0,
    [fields]
  );

  function downloadCsv() {
    window.location.href = '/api/reports/csv?range=month';
  }

  async function downloadPdf() {
    setPdfLoading(true);
    try {
      await downloadReportPdf();
      toast.success('Informe PDF descargado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo descargar el PDF');
    } finally {
      setPdfLoading(false);
    }
  }

  const timeRangeLabel =
    selectedTimeRange === 'week'
      ? 'semana'
      : selectedTimeRange === 'month'
        ? 'mes'
        : 'temporada';

  return (
    <PageContainer size="wide" className="space-y-6">
      <PageHeader
        title="Analítica y reportes"
        description="Distribución de salud, cultivos, tendencias de riesgo y proyecciones económicas por campo."
        actions={
          <Button
            variant="outline"
            size="sm"
            className="h-10 gap-2"
            onClick={downloadCsv}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </Button>
        }
      />

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-thin">
        {(['week', 'month', 'season'] as const).map((range) => (
          <Button
            key={range}
            variant={selectedTimeRange === range ? 'default' : 'outline'}
            size="sm"
            className="h-10 shrink-0 px-4 text-sm"
            onClick={() => setSelectedTimeRange(range)}
          >
            {range === 'week' ? 'Semana' : range === 'month' ? 'Mes' : 'Temporada'}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiStat label="Área total" value={totalArea} hint="hectáreas" icon={MapPin} className="min-w-0" />
        <KpiStat
          label="Salud promedio"
          value={`${formatDecimal(averageHealth, 0)}%`}
          hint="cartera completa"
          icon={Activity}
          variant="success"
        />
        <KpiStat
          label="Riesgo promedio"
          value={formatDecimal(averageRisk, 0)}
          hint="puntuación /100"
          icon={TrendingUp}
          variant="warning"
        />
        <KpiStat
          label="En riesgo"
          value={highRiskFields.length}
          hint="campos requieren atención"
          icon={AlertTriangle}
          variant={highRiskFields.length > 0 ? 'danger' : 'default'}
        />
      </div>

      {highRiskFields.length > 0 && (
        <Card className="glass-card border-health-critical/30 bg-health-critical/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <AlertCircle className="h-5 w-5 shrink-0 text-health-critical" />
              Campos de alto riesgo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {highRiskFields.map((field) => (
                <div
                  key={field.id}
                  className="flex flex-col gap-3 rounded-lg bg-muted/50 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground sm:text-base">{field.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Riesgo: {field.riskScore} · Cultivo: {CROP_PROFILES[field.crop].name}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="h-10 shrink-0" asChild>
                    <Link href="/monitor">Revisar</Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <FadeIn className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        <Card className="glass-card min-w-0 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">Distribución de salud</CardTitle>
            <p className="text-sm text-muted-foreground">Porcentaje de campos por estado sanitario</p>
          </CardHeader>
          <CardContent className="min-w-0 pt-0">
            <DistributionDonutChart
              data={healthDistribution}
              aria-label="Distribución de salud de campos"
              emptyMessage="Sin datos de salud"
            />
          </CardContent>
        </Card>

        <Card className="glass-card min-w-0 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">Distribución de cultivos</CardTitle>
            <p className="text-sm text-muted-foreground">Participación de cada cultivo en la cartera</p>
          </CardHeader>
          <CardContent className="min-w-0 pt-0">
            <DistributionDonutChart
              data={cropDistribution}
              aria-label="Distribución de cultivos"
              emptyMessage="Sin datos de cultivos"
            />
          </CardContent>
        </Card>

        <Card className="glass-card min-w-0 overflow-hidden lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">
              Tendencia de riesgo ({timeRangeLabel})
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Riesgo derivado de NDVI Copernicus (estrés y caídas vs media 14 días)
            </p>
          </CardHeader>
          <CardContent className="min-w-0 pt-0">
            {riskTimeline.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Sin historial satelital — ejecuta <code className="text-xs">pnpm cron:backfill</code>
              </p>
            ) : (
              <RiskTimelineChart data={riskTimeline} />
            )}
          </CardContent>
        </Card>

        <Card className="glass-card min-w-0 overflow-hidden lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <BarChart3 className="h-5 w-5 shrink-0" />
              Comparación de rendimiento por campo
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Índice de salud y seguridad operativa — pasa el cursor para ver el nombre completo
            </p>
          </CardHeader>
          <CardContent className="min-w-0 pt-0">
            <FieldComparisonChart fields={fields} />
          </CardContent>
        </Card>

        <Card className="glass-card min-w-0 overflow-hidden lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <TrendingUp className="h-5 w-5 shrink-0" />
              Análisis económico ROI
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Inversión e ingresos proyectados (miles USD) y retorno por campo
            </p>
          </CardHeader>
          <CardContent className="min-w-0 pt-0">
            <RoiEconomicChart data={economicData} />
          </CardContent>
        </Card>

        <Card className="glass-card min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">Días hasta madurez</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-72 space-y-2 overflow-y-auto scrollbar-thin">
              {economicData.map((row) => (
                <div
                  key={row.fullName}
                  className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2.5"
                >
                  <span className="min-w-0 truncate text-sm font-medium text-foreground sm:text-base">
                    {row.fullName}
                  </span>
                  <span className="shrink-0 text-2xl font-bold tabular-nums text-primary sm:text-3xl">
                    {row.daysToMaturity}
                  </span>
                  <span className="shrink-0 text-sm text-muted-foreground">días</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">Resumen rápido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm sm:text-base">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Total de campos</span>
              <span className="font-semibold text-foreground">{fields.length}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Área total</span>
              <span className="font-semibold text-foreground">{totalArea} ha</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">NDVI promedio</span>
              <span className="font-semibold tabular-nums text-foreground">
                {fields.length
                  ? formatDecimal(
                      fields.reduce(
                        (sum, f) =>
                          sum + f.zones.reduce((s, z) => s + z.ndviAverage, 0) / f.zones.length,
                        0
                      ) / fields.length,
                      2
                    )
                  : '—'}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Alertas activas</span>
              <span className="font-semibold text-health-critical">
                {fields.reduce((sum, f) => sum + f.notifications, 0)}
              </span>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      <div className="flex justify-end pb-2">
        <Button
          className="h-11 gap-2 px-5 text-sm sm:text-base"
          onClick={() => void downloadPdf()}
          disabled={pdfLoading}
        >
          <Download className="h-4 w-4" />
          {pdfLoading ? 'Generando PDF…' : 'Exportar informe (PDF)'}
        </Button>
      </div>
    </PageContainer>
  );
}
