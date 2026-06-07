'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MetricValue } from '@/components/ui/metric-value';
import { GeodataHistoricalChart } from '@/components/science/geodata-historical-chart';
import {
  DEMO_PERSONAS,
  getDemoTourLinks,
  type DemoPersonaId,
} from '@/lib/integrations/geodata/demo-scenarios';
import type { GeodataLabPayload } from '@/lib/integrations/geodata/types';
import { parseJsonResponse } from '@/lib/fetch/parse-json-response';
import { formatDecimal } from '@/lib/i18n/format-number';
import { Building2, Sprout, Satellite, Loader2, ArrowRightLeft } from 'lucide-react';
import type { ScienceCropId } from '@/lib/science/types';

interface GeodataLabPanelProps {
  fieldId: string;
  crop: ScienceCropId;
}

const personaStyles: Record<DemoPersonaId, string> = {
  cooperative:
    'border-sky-500/30 bg-sky-500/5 text-sky-800 dark:text-sky-200',
  smallholder:
    'border-amber-500/30 bg-amber-500/5 text-amber-900 dark:text-amber-100',
};

const trendLabel: Record<string, string> = {
  stable: 'Estable',
  improving: 'Mejorando',
  declining: 'En descenso',
};

export function GeodataLabPanel({ fieldId, crop }: GeodataLabPanelProps) {
  const [payload, setPayload] = useState<GeodataLabPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/integrations/geodata/lab?fieldId=${encodeURIComponent(fieldId)}`
      );
      const data = await parseJsonResponse<GeodataLabPayload>(res);
      setPayload(data);
      if (!data.enabled) {
        setError('Geo-Data desactivado — activá GEODATA_ENABLED en .env.local');
      }
    } catch {
      setError('No se pudo cargar inteligencia geo-data');
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, [fieldId]);

  useEffect(() => {
    void load();
  }, [load]);

  const tour = getDemoTourLinks(crop);
  const persona = payload?.persona;
  const personaMeta = persona ? DEMO_PERSONAS[persona] : null;
  const intel = payload?.intelligence;
  const series = payload?.series;
  const region = payload?.region;
  const trend = series?.historySummary?.trend ?? intel?.historySummary?.trend;

  return (
    <Card className="glass-card border-violet-500/20 overflow-hidden">
      <CardHeader className="pb-3 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Satellite className="h-4 w-4 text-violet-600" />
            Inteligencia histórica · Data-Historica
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={tour.cooperative}>
                <Building2 className="h-3.5 w-3.5 mr-1" />
                Demo cooperativa
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={tour.smallholder}>
                <Sprout className="h-3.5 w-3.5 mr-1" />
                Demo finca María
              </Link>
            </Button>
          </div>
        </div>
        {personaMeta && (
          <div
            className={`rounded-lg border px-3 py-2 text-xs flex flex-wrap items-center gap-2 ${personaStyles[persona!]}`}
          >
            <Badge variant="outline" className="text-[10px]">
              {personaMeta.areaLabel}
            </Badge>
            <span className="font-medium">{personaMeta.label}</span>
            <span className="text-muted-foreground">{personaMeta.subtitle}</span>
            {payload?.highlight && (
              <span className="w-full sm:w-auto sm:ml-auto text-foreground/80">
                {payload.highlight}
              </span>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando paquete geo-data…
          </div>
        )}
        {!loading && error && (
          <p className="text-sm text-muted-foreground py-4 text-center">{error}</p>
        )}
        {!loading && payload?.enabled && intel && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-1">NDVI parcela</p>
                <MetricValue value={intel.optical?.ndviMean} decimals={2} />
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-1">Humedad SAR</p>
                <MetricValue value={intel.sar?.soilMoisture} decimals={2} />
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-1">Hotspots 7d</p>
                <MetricValue value={intel.fire?.hotspotCount7d ?? region?.fire?.hotspotCount7d} decimals={0} />
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-1">Tendencia 90d</p>
                <span className="font-semibold">
                  {trend ? trendLabel[trend] ?? trend : '—'}
                </span>
              </div>
            </div>

            {(intel.summary || series?.historySummary) && (
              <div className="rounded-lg bg-muted/40 px-3 py-2 text-sm leading-relaxed">
                {intel.summary && <p>{intel.summary}</p>}
                {series?.historySummary && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Histórico: {series.historySummary.observations ?? series.count} obs · NDVI{' '}
                    {formatDecimal(series.historySummary.ndviMin, 2)}–
                    {formatDecimal(series.historySummary.ndviMax, 2)} · último{' '}
                    {formatDecimal(series.historySummary.ndviLatest, 2)}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2 text-xs">
              {payload.parcelKey && (
                <Badge variant="secondary">{payload.parcelKey}</Badge>
              )}
              {intel.optical?.cropHealthStatus && (
                <Badge variant="outline">{intel.optical.cropHealthStatus}</Badge>
              )}
              {intel.confidence != null && (
                <Badge variant="outline">
                  confianza {formatDecimal(intel.confidence * 100, 0)}%
                </Badge>
              )}
              <Badge variant="outline" className="gap-1">
                <ArrowRightLeft className="h-3 w-3" />
                DB local + geo-data
              </Badge>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">
                Serie NDVI histórica ({series?.count ?? 0} escenas)
              </p>
              <GeodataHistoricalChart data={series?.series ?? []} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
