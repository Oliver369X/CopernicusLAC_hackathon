'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useInsightsContext } from '@/hooks/use-insights-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageContainer, PageHeader } from '@/components/layout/page-header';
import { MetricProgressRow } from '@/components/charts/metric-progress-row';
import { NdviYieldScatterChart } from '@/components/charts/ndvi-yield-scatter-chart';
import { formatDecimal, roundDecimal } from '@/lib/i18n/format-number';
import { RecommendationCard } from '@/components/insights/recommendation-card';
import { InsightsAgentPanel } from '@/components/agents/insights-agent-panel';
import { FadeIn, StaggerList } from '@/components/ui/motion';
import { TrendingUp, AlertTriangle, Leaf, Droplets, Thermometer, BarChart3, Satellite } from 'lucide-react';
import {
  envStatusLabelEs,
  getCropLabelEs,
  type EnvStatusKey,
} from '@/lib/design/tokens';

const SCIENCE_CROPS = ['soybean', 'wheat', 'corn', 'coffee', 'cacao'] as const;

const envBarClass: Record<EnvStatusKey, string> = {
  Optimal: 'bg-health-excellent',
  Suboptimal: 'bg-health-good',
  Stress: 'bg-health-warning',
  Critical: 'bg-health-critical',
};

export default function Insights() {
  const { summary, context, loading, error, hasSatelliteData } = useInsightsContext();

  const correlationData = useMemo(() => {
    if (!context?.correlationData?.length) return [];
    return context.correlationData.map((row) => ({
      ...row,
      ndvi: roundDecimal(row.ndvi, 2) ?? 0,
      yieldPotential: roundDecimal(row.yieldPotential, 2) ?? 0,
    }));
  }, [context]);

  const diseaseRisks = context?.diseaseRisks ?? [];
  const cropPerformance = context?.cropPerformance ?? [];
  const envAnalysis = (context?.envAnalysis ?? []) as Array<{
    status: EnvStatusKey;
    zones: number;
    pct: number;
  }>;

  const recommendations = useMemo(() => {
    const recs: Array<{
      id: string;
      title: string;
      description: string;
      priority: 'high' | 'medium';
      icon: typeof Droplets;
    }> = [];

    const zones = context?.zones ?? [];
    const moistureStressFields = new Set(
      zones.filter((z) => (z.soilMoisture ?? 100) < 60).map((z) => z.fieldId)
    ).size;

    if (moistureStressFields > 0) {
      recs.push({
        id: 'water',
        title: 'Alerta de manejo del agua',
        description: `${moistureStressFields} campo(s) con estrés hídrico. Revisá el programa de riego.`,
        priority: 'high',
        icon: Droplets,
      });
    }

    if (diseaseRisks.length > 0) {
      recs.push({
        id: 'disease',
        title: 'Gestión de riesgo de enfermedades',
        description: `${diseaseRisks[0].disease} detectada en ${diseaseRisks[0].fieldCount} zona(s). Aplicar medidas preventivas.`,
        priority: 'high',
        icon: AlertTriangle,
      });
    }

    if ((context?.activeAlertCount ?? 0) > 0) {
      recs.push({
        id: 'alerts',
        title: 'Alertas activas',
        description: `${context?.activeAlertCount} alerta(s) sin resolver. Revisá /alerts.`,
        priority: 'high',
        icon: AlertTriangle,
      });
    }

    recs.push({
      id: 'growth',
      title: 'Optimización por estado fenológico',
      description:
        'Ajustá el plan de fertilización según el estado de desarrollo actual de cada lote.',
      priority: 'medium',
      icon: Leaf,
    });

    const highTempFields = new Set(
      zones.filter((z) => (z.temperature ?? 0) > 32).map((z) => z.fieldId)
    ).size;

    if (highTempFields > 0) {
      recs.push({
        id: 'temp',
        title: 'Manejo de estrés térmico',
        description: `${highTempFields} campo(s) con temperaturas elevadas. Monitorear estrés por calor.`,
        priority: 'medium',
        icon: Thermometer,
      });
    }

    return recs;
  }, [context, diseaseRisks]);

  if (loading && !context) {
    return (
      <PageContainer size="wide">
        <PageHeader title="Perspectivas avanzadas" description="Cargando datos satelitales…" />
      </PageContainer>
    );
  }

  return (
    <PageContainer size="wide">
      <PageHeader
        title="Perspectivas avanzadas"
        description="Análisis profundo y recomendaciones accionables basadas en datos satelitales y de campo."
      />

      {!hasSatelliteData && (
        <Card className="glass-card border-health-warning/40 bg-health-warning/5">
          <CardContent className="flex items-start gap-3 pt-6 text-sm">
            <Satellite className="mt-0.5 h-5 w-5 shrink-0 text-health-warning" />
            <div>
              <p className="font-medium text-foreground">Sin lecturas Copernicus recientes</p>
              <p className="text-muted-foreground">
                Ejecutá <code className="text-xs">pnpm cron:satellite</code> para poblar datos reales.
                {error ? ` (${error})` : ''}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {summary?.climateViability && summary.climateViability.length > 0 && (
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-primary" />
              Riesgo climático 2030 (C3S / ERA5-Land)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary.climateViability.map((c) => {
              const field = summary.fields.find((f) => f.id === c.fieldId);
              const pct = Math.round((c.viabilityScore ?? 0) * 100);
              return (
                <MetricProgressRow
                  key={c.fieldId}
                  label={field?.name ?? c.fieldId}
                  percent={pct}
                  barClassName="bg-primary"
                  trailing={
                    <Badge
                      variant={pct < 45 ? 'destructive' : 'secondary'}
                      className="shrink-0 text-xs"
                    >
                      Viabilidad {pct}% · {c.projectionYear ?? 2030}
                    </Badge>
                  }
                />
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Leaf className="h-4 w-4 text-primary" />
            Índices avanzados por cultivo (Lab. Científico)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="leading-relaxed text-muted-foreground">
            NDRE, DpRVI, REDSI (trigo), texturas SAR (café/cacao) y fusión reglas + ML en{' '}
            <Link href="/science" className="text-primary underline-offset-2 hover:underline">
              laboratorio científico
            </Link>
            .
          </p>
          <div className="flex flex-wrap gap-2">
            {SCIENCE_CROPS.map((c) => (
              <Link key={c} href={`/science/${c}`}>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:border-primary/40 hover:bg-primary/5"
                >
                  {getCropLabelEs(c)}
                </Badge>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {recommendations.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Acciones recomendadas</h2>
          <StaggerList className="space-y-3">
            {recommendations.map((rec) => (
              <li key={rec.id}>
                <RecommendationCard
                  title={rec.title}
                  description={rec.description}
                  priority={rec.priority}
                  icon={rec.icon}
                />
              </li>
            ))}
          </StaggerList>
        </section>
      )}

      <FadeIn className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        <Card className="glass-card min-w-0 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <TrendingUp className="h-5 w-5 shrink-0 text-primary" />
              NDVI vs potencial de rendimiento
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Relación entre vigor del cultivo (NDVI) y rendimiento estimado por campo
            </p>
          </CardHeader>
          <CardContent className="min-w-0 pt-0">
            <NdviYieldScatterChart data={correlationData} />
          </CardContent>
        </Card>

        <Card className="glass-card min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">Estado ambiental por zona</CardTitle>
            <p className="text-sm text-muted-foreground">
              Clasificación óptimo, subóptimo, estrés y crítico en toda la cartera
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {envAnalysis.map((item) => (
              <MetricProgressRow
                key={item.status}
                label={envStatusLabelEs[item.status]}
                valueLabel={`${item.zones} zonas (${item.pct}%)`}
                percent={item.pct}
                barClassName={envBarClass[item.status]}
              />
            ))}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-primary" />
              Comparación de rendimiento por cultivo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {cropPerformance.map((crop) => (
              <div key={crop.crop} className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">{crop.crop}</span>
                  <span className="text-xs text-muted-foreground">
                    {crop.fields} {crop.fields === 1 ? 'campo' : 'campos'}
                  </span>
                </div>
                <MetricProgressRow
                  label="Salud"
                  valueLabel={`${crop.avgHealth}%`}
                  percent={crop.avgHealth}
                  barClassName="bg-health-good"
                />
                <MetricProgressRow
                  label="Riesgo"
                  valueLabel={String(crop.avgRisk)}
                  percent={Math.min(crop.avgRisk, 100)}
                  barClassName="bg-health-warning"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Resumen de riesgo de enfermedades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {diseaseRisks.slice(0, 6).map((risk) => (
              <MetricProgressRow
                key={risk.disease}
                label={risk.disease}
                valueLabel={`${risk.fieldCount} ${risk.fieldCount === 1 ? 'zona' : 'zonas'}`}
                percent={Math.min(risk.prevalence, 100)}
                barClassName="bg-health-critical"
              />
            ))}
            {diseaseRisks.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No se detectaron riesgos de enfermedad
              </p>
            )}
          </CardContent>
        </Card>
      </FadeIn>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">Métricas detalladas por campo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 md:hidden">
            {correlationData.map((row) => (
              <div
                key={row.field}
                className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-2"
              >
                <p className="font-semibold text-foreground">{row.field}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">NDVI</p>
                    <p className="font-semibold text-health-good tabular-nums">
                      {formatDecimal(row.ndvi, 2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Humedad</p>
                    <p className="font-semibold tabular-nums">{row.moisture.toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Rendimiento</p>
                    <p className="font-semibold text-health-excellent tabular-nums">
                      {formatDecimal(row.yieldPotential, 2)}{' '}
                      <span className="text-xs font-normal text-muted-foreground">kg/ha</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Riesgo</p>
                    <Badge variant={row.riskScore > 50 ? 'destructive' : 'secondary'}>
                      {row.riskScore}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Campo</th>
                  <th className="px-3 py-2 text-center font-medium text-muted-foreground">NDVI</th>
                  <th className="px-3 py-2 text-center font-medium text-muted-foreground">Humedad</th>
                  <th className="px-3 py-2 text-center font-medium text-muted-foreground">
                    Rendimiento
                  </th>
                  <th className="px-3 py-2 text-center font-medium text-muted-foreground">Riesgo</th>
                </tr>
              </thead>
              <tbody>
                {correlationData.map((row) => (
                  <tr
                    key={row.field}
                    className="border-b border-border/50 transition-colors hover:bg-muted/40"
                  >
                    <td className="px-3 py-2 font-medium text-foreground">{row.field}</td>
                    <td className="px-3 py-2 text-center">
                      <span className="font-semibold text-health-good tabular-nums">
                        {formatDecimal(row.ndvi, 2)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center tabular-nums">{row.moisture.toFixed(0)}%</td>
                    <td className="px-3 py-2 text-center">
                      <span className="font-semibold text-health-excellent tabular-nums">
                        {formatDecimal(row.yieldPotential, 2)}
                      </span>
                      <span className="ml-1 text-xs text-muted-foreground">kg/ha</span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Badge variant={row.riskScore > 50 ? 'destructive' : 'secondary'}>
                        {row.riskScore}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <InsightsAgentPanel />
    </PageContainer>
  );
}
