'use client';



import { useCallback, useEffect, useState } from 'react';

import Link from 'next/link';

import { useRouter } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';

import { Button } from '@/components/ui/button';

import { MetricValue } from '@/components/ui/metric-value';

import { GeodataHistoricalChart } from '@/components/science/geodata-historical-chart';

import {

  DEMO_PERSONA_NARRATIVES,

  DEMO_PERSONAS,

  getDemoTourLinks,

  type DemoPersonaId,

} from '@/lib/integrations/geodata/demo-scenarios';

import type {

  GeodataLabComparePayload,

  GeodataLabPayload,

} from '@/lib/integrations/geodata/types';

import { parseJsonResponse } from '@/lib/fetch/parse-json-response';

import { formatDecimal } from '@/lib/i18n/format-number';

import {

  Building2,

  Sprout,

  Satellite,

  Loader2,

  ArrowRightLeft,

  GitCompareArrows,

} from 'lucide-react';

import type { ScienceCropId } from '@/lib/science/types';
import type { ScienceSeriesPoint } from '@/components/charts/science-timeseries-chart';
import { PLAIN_METRIC_LABELS } from '@/lib/onboarding/science-lab-copy';



interface GeodataLabPanelProps {
  fieldId: string;
  crop: ScienceCropId;
  localSeries?: ScienceSeriesPoint[];
  audience?: 'cooperative' | 'smallholder';
  plainLanguage?: boolean;
  preferCompare?: boolean;
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



function MetricStrip({

  payload,

  compact = false,

  plainLanguage = false,

}: {

  payload: GeodataLabPayload;

  compact?: boolean;

  plainLanguage?: boolean;

}) {

  const intel = payload.intelligence;

  const series = payload.series;

  const region = payload.region;

  const trend = series?.historySummary?.trend ?? intel?.historySummary?.trend;



  if (!intel) {

    return (

      <p className="text-xs text-muted-foreground py-2 text-center">

        Sin inteligencia parcela para {payload.parcelKey ?? payload.fieldId}

      </p>

    );

  }



  return (

    <div className={`grid gap-2 text-sm ${compact ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>

      <div className="rounded-lg border p-2.5">

        <p className="text-[10px] text-muted-foreground mb-0.5">
          {plainLanguage ? PLAIN_METRIC_LABELS.ndvi : 'NDVI'}
        </p>

        <MetricValue value={intel.optical?.ndviMean} decimals={2} />

      </div>

      <div className="rounded-lg border p-2.5">

        <p className="text-[10px] text-muted-foreground mb-0.5">
          {plainLanguage ? PLAIN_METRIC_LABELS.sarMoisture : 'SAR humedad'}
        </p>

        <MetricValue value={intel.sar?.soilMoisture} decimals={2} />

      </div>

      <div className="rounded-lg border p-2.5">

        <p className="text-[10px] text-muted-foreground mb-0.5">
          {plainLanguage ? PLAIN_METRIC_LABELS.hotspots : 'Hotspots 7d'}
        </p>

        <MetricValue value={intel.fire?.hotspotCount7d ?? region?.fire?.hotspotCount7d} decimals={0} />

      </div>

      <div className="rounded-lg border p-2.5">

        <p className="text-[10px] text-muted-foreground mb-0.5">
          {plainLanguage ? PLAIN_METRIC_LABELS.trend : 'Tendencia'}
        </p>

        <span className="text-sm font-semibold">{trend ? trendLabel[trend] ?? trend : '—'}</span>

      </div>

    </div>

  );

}



function PersonaSnapshot({

  payload,

  persona,

  tourHref,

}: {

  payload: GeodataLabPayload;

  persona: DemoPersonaId;

  tourHref: string;

}) {

  const meta = DEMO_PERSONAS[persona];

  const intel = payload.intelligence;

  const series = payload.series;



  return (

    <div className={`rounded-xl border p-3 space-y-3 ${personaStyles[persona]}`}>

      <div className="flex flex-wrap items-start justify-between gap-2">

        <div>

          <Badge variant="outline" className="text-[10px] mb-1">

            {meta.areaLabel}

          </Badge>

          <p className="font-semibold text-sm">{meta.label}</p>

          <p className="text-xs opacity-80">{meta.subtitle}</p>

        </div>

        <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>

          <Link href={tourHref}>Abrir en Lab</Link>

        </Button>

      </div>

      <p className="text-xs leading-relaxed">{DEMO_PERSONA_NARRATIVES[persona]}</p>

      {payload.highlight && (

        <p className="text-xs font-medium">{payload.highlight}</p>

      )}

      <MetricStrip payload={payload} compact plainLanguage />

      {(intel?.summary || series?.historySummary) && (

        <p className="text-xs leading-relaxed opacity-90">

          {intel?.summary}

          {series?.historySummary && (

            <span className="block text-muted-foreground mt-1">

              {series.historySummary.observations ?? series.count} obs · NDVI{' '}

              {formatDecimal(series.historySummary.ndviMin, 2)}–

              {formatDecimal(series.historySummary.ndviMax, 2)}

            </span>

          )}

        </p>

      )}

      <GeodataHistoricalChart

        data={series?.series ?? []}

        aria-label={`Serie histórica ${meta.label}`}

      />

    </div>

  );

}



export function GeodataLabPanel({ fieldId, crop, localSeries, audience = 'cooperative', plainLanguage = false, preferCompare = false }: GeodataLabPanelProps) {

  const router = useRouter();

  const [payload, setPayload] = useState<GeodataLabPayload | null>(null);

  const [compare, setCompare] = useState<GeodataLabComparePayload | null>(null);

  const [compareMode, setCompareMode] = useState(preferCompare);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);



  const tour = getDemoTourLinks(crop);



  useEffect(() => {
    if (preferCompare) setCompareMode(true);
  }, [preferCompare]);

  const load = useCallback(async () => {

    setLoading(true);

    setError(null);

    try {

      if (compareMode) {

        const res = await fetch(

          `/api/integrations/geodata/lab/compare?crop=${encodeURIComponent(crop)}`

        );

        const { data, error: parseError } = await parseJsonResponse<GeodataLabComparePayload>(res);

        setCompare(data);

        setPayload(null);

        if (!data?.enabled) {

          setError(parseError ?? 'Geo-Data desactivado — activá GEODATA_ENABLED en .env.local');

        }

      } else {

        const res = await fetch(

          `/api/integrations/geodata/lab?fieldId=${encodeURIComponent(fieldId)}`

        );

        const { data, error: parseError } = await parseJsonResponse<GeodataLabPayload>(res);

        setPayload(data);

        setCompare(null);

        if (!data?.enabled) {

          setError(parseError ?? 'Geo-Data desactivado — activá GEODATA_ENABLED en .env.local');

        }

      }

    } catch {

      setError('No se pudo cargar inteligencia geo-data');

      setPayload(null);

      setCompare(null);

    } finally {

      setLoading(false);

    }

  }, [fieldId, crop, compareMode]);



  useEffect(() => {

    void load();

  }, [load]);



  const switchPersona = (href: string) => {

    router.push(href);

  };



  const persona = payload?.persona;

  const personaMeta = persona ? DEMO_PERSONAS[persona] : null;

  const intel = payload?.intelligence;

  const series = payload?.series;

  const region = payload?.region;

  const trend = series?.historySummary?.trend ?? intel?.historySummary?.trend;

  const isDemoField = fieldId.startsWith('field-sj-') || fieldId.startsWith('field-pf-');
  const isProducerView = audience === 'smallholder';

  const panelTitle = isProducerView
    ? 'Tu historial satelital'
    : 'Lab analítico · Data-Historica';
  const panelBlurb = isProducerView
    ? 'Serie de verdor de tu parcela en San Julián. Detectar estrés a tiempo protege la cosecha y la seguridad alimentaria de tu familia.'
    : 'Misma región SC-BO, dos escalas productivas: cooperativa con zonas vs finca familiar. Datos históricos Sentinel (~300 escenas demo).';
  const compareLabel = isProducerView ? 'Vs cooperativa' : 'Comparar escala';

  return (
    <Card className="glass-card border-violet-500/20 overflow-hidden">

      <CardHeader className="pb-3 space-y-3">

        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">

          <div className="space-y-1">

            <Badge variant="secondary" className="text-[10px] w-fit">

              {plainLanguage ? 'Paso 1 · Cómo va tu parcela' : 'Paso 0 · Contexto histórico'}

            </Badge>

            <CardTitle className="text-base flex items-center gap-2 pt-1">

              <Satellite className="h-4 w-4 text-violet-600" />

              {panelTitle}

            </CardTitle>

            <p className="text-xs text-muted-foreground max-w-2xl">

              {panelBlurb}

            </p>

          </div>

          <div className="flex flex-wrap gap-2">

            <Button

              variant={compareMode ? 'default' : 'outline'}

              size="sm"

              onClick={() => setCompareMode(true)}

            >

              <GitCompareArrows className="h-3.5 w-3.5 mr-1" />

              {compareLabel}

            </Button>

            <Button

              variant={!compareMode ? 'default' : 'outline'}

              size="sm"

              onClick={() => setCompareMode(false)}

            >

              Campo actual

            </Button>

          </div>

        </div>



        {!compareMode && (
          <div className="flex flex-wrap gap-2">
            {isProducerView ? (
              <>
                <Button
                  variant={persona === 'smallholder' || !persona ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => switchPersona(tour.smallholder)}
                >
                  <Sprout className="h-3.5 w-3.5 mr-1" />
                  Mi parcela
                </Button>
                <Button
                  variant={persona === 'cooperative' ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => switchPersona(tour.cooperative)}
                >
                  <Building2 className="h-3.5 w-3.5 mr-1" />
                  Ver cooperativa
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant={persona === 'cooperative' || !persona ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => switchPersona(tour.cooperative)}
                >
                  <Building2 className="h-3.5 w-3.5 mr-1" />
                  Cooperativa SJ
                </Button>
                <Button
                  variant={persona === 'smallholder' ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => switchPersona(tour.smallholder)}
                >
                  <Sprout className="h-3.5 w-3.5 mr-1" />
                  Finca María PF
                </Button>
              </>
            )}
          </div>
        )}



        {!compareMode && personaMeta && (

          <div

            className={`rounded-lg border px-3 py-2 text-xs flex flex-wrap items-center gap-2 ${personaStyles[persona!]}`}

          >

            <Badge variant="outline" className="text-[10px]">

              {personaMeta.areaLabel}

            </Badge>

            <span className="font-medium">{personaMeta.label}</span>

            <span className="text-muted-foreground">{personaMeta.subtitle}</span>

            {payload?.historyWindow && (
              <Badge variant="secondary" className="text-[10px]">
                Histórico {payload.historyWindow}
              </Badge>
            )}

            {payload?.highlight && (

              <span className="w-full sm:w-auto sm:ml-auto text-foreground/80">

                {payload.highlight}

              </span>

            )}

          </div>

        )}

        {!compareMode && persona && (

          <p className="text-xs text-muted-foreground">{DEMO_PERSONA_NARRATIVES[persona]}</p>

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



        {!loading && compareMode && compare?.enabled && (

          <div className="grid lg:grid-cols-2 gap-4">

            <PersonaSnapshot

              payload={compare.cooperative}

              persona="cooperative"

              tourHref={tour.cooperative}

            />

            <PersonaSnapshot

              payload={compare.smallholder}

              persona="smallholder"

              tourHref={tour.smallholder}

            />

          </div>

        )}



        {!loading && !compareMode && payload?.enabled && intel && (

          <>

            <MetricStrip payload={payload} plainLanguage={plainLanguage} />



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

              {isDemoField && (

                <Badge variant="outline" className="gap-1">

                  <ArrowRightLeft className="h-3 w-3" />

                  Demo San Julián

                </Badge>

              )}

              <Badge variant="outline">

                Tendencia: {trend ? trendLabel[trend] ?? trend : '—'}

              </Badge>

            </div>



            <div>

              <p className="text-sm font-medium mb-2">

                {plainLanguage
                  ? payload?.historyWindow
                    ? 'Verdor en 3 años'
                    : 'Verdor mes a mes'
                  : payload?.historyWindow
                    ? `Serie NDVI · ${payload.historyWindow} · ${series?.count ?? 0} escenas`
                    : `Serie NDVI histórica · ${series?.count ?? 0} escenas`}

                {localSeries && localSeries.length > 0 && (
                  <span className="text-muted-foreground font-normal">
                    {' '}
                    · {plainLanguage
                      ? payload?.historyWindow
                        ? 'mediciones locales 3 años'
                        : 'últimas semanas'
                      : payload?.historyWindow
                        ? `DB local ${localSeries.length} pts (3y)`
                        : `DB local ${localSeries.length} pts (90d)`}
                  </span>
                )}

              </p>

              <GeodataHistoricalChart

                data={series?.series ?? []}

                localOverlay={localSeries?.map((p) => ({ date: p.date, ndvi: p.ndvi }))}

              />

            </div>

          </>

        )}

      </CardContent>

    </Card>

  );

}


