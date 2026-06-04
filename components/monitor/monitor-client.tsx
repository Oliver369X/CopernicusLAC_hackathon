'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getDaysToMaturityForField } from '@/lib/mock-data/fields';
import { useFields } from '@/hooks/use-fields';
import type { SatelliteData } from '@/lib/mock-data/satellite-data';
import { getAverageValue } from '@/lib/mock-data/satellite-data';
import {
  buildSatelliteDataFromMetrics,
  buildTrendFromHistory,
  metricsFromZone,
  type MetricsHistoryPoint,
  type NdviGridPayload,
} from '@/lib/data/satellite-from-metrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageContainer, PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Eye, TrendingUp, Loader2, FlaskConical } from 'lucide-react';
import { isScienceCrop } from '@/lib/science/crops/registry';
import FieldMap from '@/components/dashboard/field-map';
import SatelliteMapPanel from '@/components/monitor/satellite-map-panel';
import HealthMetrics from '@/components/dashboard/health-metrics';
import ZoneGrid from '@/components/dashboard/zone-grid';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { ChartFrame } from '@/components/charts/chart-frame';
import { ChartTooltipContent } from '@/components/charts/chart-tooltip';
import { formatDataSourcesUnique } from '@/lib/i18n/data-source';
import { formatDateEs } from '@/lib/i18n/format-date';
import { formatDecimal } from '@/lib/i18n/format-number';
import { MetricValue } from '@/components/ui/metric-value';
import { ZoneInsightCard } from '@/components/monitor/zone-insight-card';
import { hasValidZoneBounds } from '@/lib/geo/bounds-utils';
import {
  chartAxisStroke,
  chartGridStroke,
  healthColors,
  chartColors,
  healthLabelEs,
  getCropLabelEs,
  getGrowthStageEs,
  type HealthLevel,
} from '@/lib/design/tokens';
import { parseJsonResponse } from '@/lib/fetch/parse-json-response';

function MonitorContent() {
  const searchParams = useSearchParams();
  const cropFilter = searchParams.get('crop');
  const initialFieldId = searchParams.get('field') || 'field-1';
  const { fields, loading, source, fetchError, getFieldById } = useFields();

  const visibleFields = useMemo(
    () => (cropFilter ? fields.filter((f) => f.crop === cropFilter) : fields),
    [fields, cropFilter]
  );

  const [selectedFieldId, setSelectedFieldId] = useState(initialFieldId);
  const selectedField =
    getFieldById(selectedFieldId) ??
    visibleFields.find((f) => f.id === initialFieldId) ??
    visibleFields[0] ??
    fields[0];
  const [selectedZone, setSelectedZone] = useState(selectedField?.zones[0] ?? null);
  const [satelliteData, setSatelliteData] = useState<SatelliteData | null>(null);
  const [trendData, setTrendData] = useState<
    Array<{ date: string; ndvi: string; ndmi: string }>
  >([]);
  const [trendSynthetic, setTrendSynthetic] = useState(false);
  const [satellitePending, setSatellitePending] = useState(false);
  const [missions, setMissions] = useState<string[]>([]);
  const [satelliteSource, setSatelliteSource] = useState<string>('mock');
  const [metricsSource, setMetricsSource] = useState<'mock' | 'database'>('mock');
  const [scienceScore, setScienceScore] = useState<number | null>(null);
  const [scienceHealth, setScienceHealth] = useState<string | null>(null);
  const [liveMetrics, setLiveMetrics] = useState<{
    ndvi?: number | null;
    ndmi?: number | null;
    ndre?: number | null;
    s1MoistureIndex?: number | null;
    s3Lst?: number | null;
    cloudCover?: number | null;
    sceneDate?: string | null;
  } | null>(null);

  function formatMetric(value: unknown, digits = 2): string {
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? n.toFixed(digits) : '—';
  }

  useEffect(() => {
    if (cropFilter && visibleFields.length && !visibleFields.find((f) => f.id === selectedFieldId)) {
      setSelectedFieldId(visibleFields[0].id);
      setSelectedZone(visibleFields[0].zones[0] ?? null);
    }
  }, [cropFilter, visibleFields, selectedFieldId]);

  useEffect(() => {
    if (selectedField && !selectedField.zones.find((z) => z.id === selectedZone?.id)) {
      setSelectedZone(selectedField.zones[0] ?? null);
    }
  }, [selectedField, selectedZone?.id]);

  useEffect(() => {
    if (!selectedField) return;

    const zone = selectedZone ?? selectedField.zones[0];
    if (!zone) return;

    const fallback = metricsFromZone(zone);

    const zoneParam = zone.id ? `?zoneId=${encodeURIComponent(zone.id)}` : '';
    fetch(`/api/fields/${selectedField.id}/metrics${zoneParam}`)
      .then((r) =>
        parseJsonResponse<{
          metrics?: ReturnType<typeof metricsFromZone>;
          ndviGrid?: NdviGridPayload | null;
          source?: string;
          satelliteSource?: string;
          satellitePending?: boolean;
          missions?: string[];
          satelliteHistory?: MetricsHistoryPoint[];
        }>(r)
      )
      .then(({ data }) => {
        const metrics = data?.metrics ?? fallback;
        const satSource = data?.satelliteSource ?? 'mock';
        setSatellitePending(Boolean(data?.satellitePending));
        setSatelliteData(
          buildSatelliteDataFromMetrics(
            selectedField.id,
            metrics,
            30,
            data?.ndviGrid ?? null,
            { satelliteSource: satSource }
          )
        );
        setMetricsSource(data?.source === 'database' ? 'database' : 'mock');
        setSatelliteSource(satSource);
        setMissions(data?.missions ?? []);
        setLiveMetrics({
          ndvi: metrics.ndvi != null ? Number(metrics.ndvi) : null,
          ndmi: metrics.ndmi != null ? Number(metrics.ndmi) : null,
          ndre: metrics.ndre != null ? Number(metrics.ndre) : null,
          s1MoistureIndex:
            metrics.s1MoistureIndex != null ? Number(metrics.s1MoistureIndex) : null,
          s3Lst: metrics.s3Lst != null ? Number(metrics.s3Lst) : null,
          cloudCover: metrics.cloudCover != null ? Number(metrics.cloudCover) : null,
          sceneDate: metrics.sceneDate ?? null,
        });
        const trend = buildTrendFromHistory(
          (data?.satelliteHistory ?? []) as MetricsHistoryPoint[],
          fallback.ndvi,
          fallback.ndmi
        );
        setTrendData(trend.points);
        setTrendSynthetic(trend.synthetic);
      })
      .catch(() => {
        setSatelliteData(
          buildSatelliteDataFromMetrics(selectedField.id, fallback, 30, null, {
            satelliteSource: 'mock',
            allowSyntheticGrid: true,
          })
        );
        const trend = buildTrendFromHistory([], fallback.ndvi, fallback.ndmi);
        setTrendData(trend.points);
        setTrendSynthetic(trend.synthetic);
      });
  }, [selectedField, selectedZone]);

  useEffect(() => {
    if (!selectedField || !isScienceCrop(selectedField.crop)) {
      setScienceScore(null);
      setScienceHealth(null);
      return;
    }
    const zone = selectedZone ?? selectedField.zones[0];
    if (!zone) return;
    fetch(
      `/api/science/${selectedField.crop}/analysis?fieldId=${selectedField.id}&zoneId=${zone.id}`
    )
      .then((r) =>
        parseJsonResponse<{ fusionScore?: number; healthLabel?: string }>(r)
      )
      .then(({ data }) => {
        if (typeof data?.fusionScore === 'number') {
          setScienceScore(data.fusionScore);
          setScienceHealth(data.healthLabel ?? null);
        }
      })
      .catch(() => {
        setScienceScore(null);
        setScienceHealth(null);
      });
  }, [selectedField, selectedZone]);

  const growthStage = useMemo(() => {
    if (!selectedField) return '—';
    return getGrowthStageEs(getDaysToMaturityForField(selectedField));
  }, [selectedField]);

  const handleFieldChange = (fieldId: string) => {
    setSelectedFieldId(fieldId);
    const field = getFieldById(fieldId);
    if (field) setSelectedZone(field.zones[0] ?? null);
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center gap-3 py-24 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Cargando campos...
        </div>
      </PageContainer>
    );
  }

  if (!selectedField || !satelliteData) {
    return (
      <PageContainer>
        <div className="py-24 text-center text-muted-foreground">No hay campos disponibles</div>
      </PageContainer>
    );
  }

  const ndviScalar =
    liveMetrics?.ndvi ?? getAverageValue(satelliteData.ndvi);
  const ndmiScalar =
    liveMetrics?.ndmi ?? getAverageValue(satelliteData.ndmi);

  const activeAlerts = selectedField.notifications;
  const scienceHealthEs =
    scienceHealth && scienceHealth in healthLabelEs
      ? healthLabelEs[scienceHealth as HealthLevel]
      : scienceHealth;

  return (
    <PageContainer size="wide">
      {cropFilter && (
        <p className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="secondary">Cultivo: {getCropLabelEs(cropFilter)}</Badge>
          <Link href="/monitor" className="text-primary underline text-xs">
            Ver todos los cultivos
          </Link>
        </p>
      )}
      {satellitePending && (
        <p className="mb-4 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
          Lectura Copernicus pendiente — ejecuta{' '}
          <code className="text-xs">pnpm cron:satellite</code>.
        </p>
      )}
      {fetchError && !satellitePending && (
        <p className="mb-4 rounded-lg border border-health-warning/40 bg-health-warning/10 px-4 py-3 text-sm text-muted-foreground">
          {fetchError}. Mostrando datos de demostración.
        </p>
      )}
      <PageHeader
        title="Monitoreo satelital"
        description="Sentinel-1/2/3 · mapa NDVI y métricas por zona"
        badge={
          <div className="flex max-w-full flex-wrap gap-1.5">
            <Badge variant="outline" className="text-xs">
              {formatDataSourcesUnique(source, metricsSource, satelliteSource)}
            </Badge>
            {missions.length > 0 && (
              <Badge variant="secondary" className="text-xs max-w-full truncate">
                {missions.map((m) => m.replace(/sentinel/gi, 'Sentinel')).join(' · ')}
              </Badge>
            )}
            {isScienceCrop(selectedField.crop) && scienceScore != null && (
              <Badge variant="outline" className="text-xs gap-1" asChild>
                <Link href={`/science/${selectedField.crop}?field=${selectedField.id}`}>
                  <FlaskConical className="h-3 w-3" />
                  Lab {formatDecimal(
                    typeof scienceScore === 'number' ? scienceScore * 100 : null,
                    0
                  )}%
                  {scienceHealthEs ? ` · ${scienceHealthEs}` : ''}
                </Link>
              </Badge>
            )}
          </div>
        }
        actions={
          <Select value={selectedField.id} onValueChange={handleFieldChange}>
            <SelectTrigger className="h-10 w-full min-w-0 sm:w-[min(100%,280px)]">
              <SelectValue placeholder="Seleccionar campo" />
            </SelectTrigger>
            <SelectContent>
              {visibleFields.map((field) => (
                <SelectItem key={field.id} value={field.id}>
                  {field.name} · {getCropLabelEs(field.crop)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {activeAlerts > 0 && (
        <Card className="glass-card border-health-critical/30 bg-health-critical/5">
          <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-health-critical" />
              <p className="font-semibold text-foreground">
                {activeAlerts} {activeAlerts === 1 ? 'alerta activa' : 'alertas activas'}
              </p>
            </div>
            <Button variant="ghost" size="sm" className="h-10 w-full shrink-0 sm:w-auto" asChild>
              <Link href="/alerts">Ver alertas</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 sm:space-y-6 lg:col-span-2">
          <Card className="glass-card min-w-0 overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Mapa satelital (Copernicus S2)</CardTitle>
            </CardHeader>
            <CardContent>
              <SatelliteMapPanel field={selectedField} />
            </CardContent>
          </Card>

          <Card className="glass-card min-w-0 overflow-hidden">
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2 text-base sm:text-lg">
                Mapa de calor NDVI
                {satelliteData.isRealGrid && (
                  <Badge variant="secondary" className="text-xs font-normal">
                    Grilla Copernicus S2
                  </Badge>
                )}
                {satelliteData.gridPending && (
                  <Badge variant="outline" className="text-xs font-normal">
                    Métricas reales · grilla pendiente
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FieldMap
                field={selectedField}
                satelliteData={satelliteData}
                satelliteSource={satelliteSource}
              />
            </CardContent>
          </Card>

          <Card className="glass-card min-w-0">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Tendencia NDVI y NDMI</CardTitle>
            </CardHeader>
            <CardContent className="min-w-0">
              {trendData.length === 0 && !trendSynthetic ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Sin historial satelital — ejecuta{' '}
                  <code className="text-xs">pnpm cron:backfill</code> para tendencias reales.
                </p>
              ) : (
              <ChartFrame
                heightClassName="min-h-[200px] h-[45vw] max-h-[250px] sm:h-[250px] w-full min-w-0"
                aria-label="Tendencia NDVI y NDMI"
              >
                <LineChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: chartAxisStroke }}
                    stroke={chartAxisStroke}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={[0, 1]}
                    tick={{ fontSize: 10, fill: chartAxisStroke }}
                    stroke={chartAxisStroke}
                    width={28}
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend
                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                    formatter={(v) => <span style={{ color: '#e2e8f0' }}>{v}</span>}
                  />
                  <Line
                    type="monotone"
                    dataKey="ndvi"
                    name="NDVI"
                    stroke={healthColors.excellent}
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="ndmi"
                    name="NDMI"
                    stroke={chartColors[0]}
                    strokeWidth={2}
                  />
                </LineChart>
              </ChartFrame>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Zonas del campo</CardTitle>
            </CardHeader>
            <CardContent>
              <ZoneGrid
                zones={selectedField.zones}
                selectedZone={selectedZone}
                onZoneSelect={setSelectedZone}
              />
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 space-y-4 sm:space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">{selectedField.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Cultivo</span>
                <span className="text-right font-medium">
                  {getCropLabelEs(selectedField.crop)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Área</span>
                <span>{selectedField.area} ha</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Días a cosecha</span>
                <span>{getDaysToMaturityForField(selectedField)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estado fenológico</span>
                <span className="text-primary">{growthStage}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Riesgo</span>
                <span>{selectedField.riskScore}/100</span>
              </div>
            </CardContent>
          </Card>

          {selectedZone && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base">{selectedZone.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">NDVI (S2)</span>
                  <MetricValue
                    value={ndviScalar}
                    meta={{
                      source: metricsSource === 'database' ? 'copernicus' : 'mock',
                    }}
                  />
                </div>
                <div className="flex justify-between">
                  <span>NDMI (S2)</span>
                  <MetricValue
                    value={ndmiScalar}
                    meta={{
                      source: metricsSource === 'database' ? 'copernicus' : 'mock',
                    }}
                  />
                </div>
                {liveMetrics?.ndre != null && (
                  <div className="flex justify-between">
                    <span>NDRE (S2)</span>
                    <MetricValue
                      value={liveMetrics.ndre}
                      meta={{
                        source: metricsSource === 'database' ? 'copernicus' : 'mock',
                      }}
                    />
                  </div>
                )}
                {liveMetrics?.s1MoistureIndex != null &&
                  Number.isFinite(liveMetrics.s1MoistureIndex) && (
                  <div className="flex justify-between">
                    <span>Radar S1 (VH/VV)</span>
                    <span>{formatMetric(liveMetrics.s1MoistureIndex, 3)}</span>
                  </div>
                )}
                {liveMetrics?.s3Lst != null && Number.isFinite(liveMetrics.s3Lst) && (
                  <div className="flex justify-between">
                    <span>LST S3</span>
                    <span>{formatMetric(liveMetrics.s3Lst, 1)} °C</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Humedad suelo</span>
                  <span>{formatDecimal(selectedZone.soilMoistureAverage, 0)}%</span>
                </div>
                {liveMetrics?.sceneDate && (
                  <p className="pt-1 text-xs text-muted-foreground">
                    Escena: {formatDateEs(liveMetrics.sceneDate)}
                    {liveMetrics.cloudCover != null ? ` · nubes ${liveMetrics.cloudCover}%` : ''}
                  </p>
                )}
                <Button className="mt-2 h-10 w-full gap-2" size="sm" variant="outline" asChild>
                  <Link href={`/monitor?field=${selectedField.id}`}>
                    <Eye className="h-4 w-4" />
                    Ver en mapa
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {selectedZone && !hasValidZoneBounds(selectedZone.bounds) && (
            <p className="rounded-lg border border-health-warning/40 bg-health-warning/10 px-4 py-3 text-sm">
              Geometría de zona incompleta.{' '}
              <Link href="/onboarding" className="text-primary underline">
                Importá parcelas
              </Link>{' '}
              para activar la grilla Copernicus.
            </p>
          )}

          <ZoneInsightCard zoneId={selectedZone?.id ?? null} />

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Estado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ubicación</span>
                <span className="font-mono text-xs">{formatDecimal(selectedField.center.lat, 4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Alertas</span>
                <span className="font-bold text-health-critical">{activeAlerts}</span>
              </div>
            </CardContent>
          </Card>

          <HealthMetrics satelliteData={satelliteData} trendHistory={trendData} />
        </div>
      </div>
    </PageContainer>
  );
}

export default function MonitorClient() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-muted-foreground">Cargando monitoreo...</div>}>
      <MonitorContent />
    </Suspense>
  );
}
