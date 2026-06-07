'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ScienceTimeseriesChart } from '@/components/charts/science-timeseries-chart';
import {
  healthLabelEs,
  type HealthLevel,
} from '@/lib/design/tokens';
import { PageContainer, PageHeader } from '@/components/layout/page-header';
import { formatDecimal } from '@/lib/i18n/format-number';
import { MetricValue } from '@/components/ui/metric-value';
import {
  HorizontalScrollRow,
  ResponsiveToolbar,
  BadgeRow,
} from '@/components/layout/responsive-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useFields } from '@/hooks/use-fields';
import type { CropScienceProfile } from '@/lib/science/types';
import type { MultisensorAnalysis } from '@/lib/science/types';
import { analysisToCsvRow, downloadBlob, experimentToJson } from '@/lib/science/export';
import { FlaskConical, BookOpen, Loader2, Download, GitCompare, Satellite } from 'lucide-react';
import { DataProvenanceBanner } from '@/components/science/data-provenance-banner';
import { LabGuidancePanel } from '@/components/science/lab-guidance-panel';
import { GeodataLabPanel } from '@/components/science/geodata-lab-panel';
import { ScienceLabTour, ScienceLabTourTrigger } from '@/components/onboarding/science-lab-tour';
import { toast } from 'sonner';
import Link from 'next/link';
import { parseJsonResponse } from '@/lib/fetch/parse-json-response';
import { formatDateEs } from '@/lib/i18n/format-date';
import { FieldContextBar } from '@/components/layout/field-context-bar';
import {
  buildMonitorUrl,
  buildStudiesUrl,
} from '@/lib/navigation/context-links';
import { getStudySite } from '@/lib/science/study-sites';
import {
  listLocalExperiments,
  mergeExperiments,
  saveLocalExperiment,
  type ExperimentRow,
} from '@/lib/science/experiments-local';
import type { ScienceCropId } from '@/lib/science/types';
import { mergeLabDemoFields } from '@/lib/integrations/geodata/demo-fields';
import { getHistoryDaysForField, hasThreeYearHistory } from '@/lib/integrations/geodata/history-window';
import type { LabGoalOption } from '@/lib/onboarding/science-lab-copy';
import { useOrgBilling } from '@/hooks/use-org-billing';
import { isSmallFarmerExperience } from '@/lib/navigation/experience';

const HYPOTHESIS_TEMPLATES: Partial<Record<ScienceCropId, string[]>> = {
  soybean: [
    'H3: NDRE cae antes que NDVI en roya asiática; DpRVI confirma biomasa',
    'H3b: MSI > 1.8 y LSWI < 0 indican patrón SDS',
    'H3c: DpRVI confirma caída de biomasa bajo nubes',
  ],
  wheat: [
    'H1: Caída NDRE/REDSI precede síntomas roya en 7–14 días',
    'H1b: REDSI detecta roya amarilla antes que NDVI',
  ],
  corn: [
    'H2: NDRE detecta estrés en dosel denso antes que NDVI',
    'H2b: EVI cae con mancha foliar gris en V12–VT',
  ],
  coffee: ['H4: Texturas SAR + NDVI discriminan agroforestería vs full sun'],
  cacao: ['H4: Texturas SAR + NDVI discriminan agroforestería vs full sun'],
};

interface ScienceCropClientProps {
  profile: CropScienceProfile;
}

function ScienceCropClientInner({ profile }: ScienceCropClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fields } = useFields();
  const { billing } = useOrgBilling();
  const simpleMode = isSmallFarmerExperience(billing);
  const baseCropFields = fields.filter((f) => f.crop === profile.crop);
  const cropFields = simpleMode
    ? baseCropFields
    : mergeLabDemoFields(baseCropFields, profile.crop);
  const [fieldId, setFieldId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [analysis, setAnalysis] = useState<MultisensorAnalysis | null>(null);
  const [series, setSeries] = useState<Array<{ date: string; ndvi: number; ndre: number | null; dpRvi: number | null }>>([]);
  const [timeseriesMeta, setTimeseriesMeta] = useState<{
    source?: 'geodata' | 'satellite_readings' | 'none' | 'pending';
    dataQuality?: 'cdse' | 'demo' | 'mixed' | 'empty';
    parcelKey?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [hypothesis, setHypothesis] = useState(
    profile.crop === 'wheat'
      ? 'H1: Caída NDRE/REDSI precede síntomas roya en 7–14 días'
      : profile.crop === 'soybean'
        ? 'H3: NDRE cae antes que NDVI en roya asiática; DpRVI confirma biomasa'
        : profile.crop === 'coffee' || profile.crop === 'cacao'
          ? 'H4: Texturas SAR + NDVI discriminan agroforestería vs full sun'
          : 'H2: NDRE detecta estrés en dosel denso antes que NDVI'
  );
  const [tab, setTab] = useState<'client' | 'lab'>('client');
  const [chartMode, setChartMode] = useState<'90d' | 'week'>('90d');
  const [asOf, setAsOf] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [experiments, setExperiments] = useState<ExperimentRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [preferCompare, setPreferCompare] = useState(false);
  const [labGoalId, setLabGoalId] = useState<string | null>(null);

  const selectedField = cropFields.find((f) => f.id === fieldId) ?? cropFields[0];
  const studySite = selectedField
    ? getStudySite(selectedField.id, zoneId || (selectedField.zones[0]?.id ?? ''))
    : undefined;

  const syncUrl = useCallback(
    (
      nextFieldId: string,
      nextZoneId: string,
      nextTab: 'client' | 'lab',
      nextAsOf?: string
    ) => {
      const params = new URLSearchParams();
      params.set('field', nextFieldId);
      if (nextZoneId) params.set('zone', nextZoneId);
      if (nextTab !== 'client') params.set('tab', nextTab);
      if (nextAsOf) params.set('asOf', nextAsOf);
      router.replace(`/science/${profile.crop}?${params.toString()}`, { scroll: false });
    },
    [router, profile.crop]
  );

  useEffect(() => {
    const urlField = searchParams.get('field');
    const urlZone = searchParams.get('zone');
    const urlTab = searchParams.get('tab');
    const urlAsOf = searchParams.get('asOf');
    if (urlTab === 'lab' || urlTab === 'client') setTab(urlTab);
    if (urlAsOf) setAsOf(urlAsOf);

    if (urlField && cropFields.some((f) => f.id === urlField)) {
      setFieldId(urlField);
      const f = cropFields.find((x) => x.id === urlField);
      if (urlZone && f?.zones.some((z) => z.id === urlZone)) {
        setZoneId(urlZone);
      } else if (f?.zones[0]) {
        setZoneId(f.zones[0].id);
      }
    } else if (cropFields[0] && !fieldId) {
      setFieldId(cropFields[0].id);
      setZoneId(cropFields[0].zones[0]?.id ?? '');
    }
  }, [searchParams, cropFields, fieldId]);

  const loadData = useCallback(async () => {
    if (!selectedField) return;
    setLoading(true);
    setLoadError(null);
    try {
      const z = zoneId || selectedField.zones[0]?.id;
      const asOfParam = asOf ? `&asOf=${encodeURIComponent(asOf)}` : '';
      let timeseriesUrl = `/api/science/${profile.crop}/timeseries?fieldId=${selectedField.id}&zoneId=${z}`;
      if (chartMode === 'week') {
        const to = new Date().toISOString().split('T')[0];
        const from = new Date();
        from.setUTCDate(from.getUTCDate() - 6);
        timeseriesUrl += `&from=${from.toISOString().split('T')[0]}&to=${to}`;
      } else {
        const days = getHistoryDaysForField(selectedField.id);
        timeseriesUrl += `&days=${days}`;
      }
      const [aRes, tRes, eRes] = await Promise.all([
        fetch(`/api/science/${profile.crop}/analysis?fieldId=${selectedField.id}&zoneId=${z}${asOfParam}`),
        fetch(timeseriesUrl),
        fetch(`/api/science/experiments?crop=${profile.crop}&fieldId=${selectedField.id}&limit=10`),
      ]);

      const aResult = await parseJsonResponse<MultisensorAnalysis>(aRes);
      const tResult = await parseJsonResponse<{
        series?: Array<{
          capturedAt: string;
          ndvi: number;
          ndre?: number;
          dpRvi?: number;
        }>;
        source?: 'geodata' | 'satellite_readings' | 'none' | 'pending';
        dataQuality?: 'cdse' | 'demo' | 'mixed' | 'empty';
        parcelKey?: string;
      }>(tRes, { series: [] });
      const eResult = await parseJsonResponse<{ experiments?: ExperimentRow[] }>(eRes, {
        experiments: [],
      });

      if (!aResult.data) {
        const msg = aResult.error ?? 'No se pudo cargar el análisis multisensor';
        setLoadError(msg);
        toast.error(msg);
        return;
      }

      const remote = eResult.data?.experiments ?? [];
      const local = listLocalExperiments({
        crop: profile.crop,
        fieldId: selectedField.id,
      });
      setExperiments(mergeExperiments(remote, local));
      setAnalysis(aResult.data);
      setTimeseriesMeta({
        source: tResult.data?.source,
        dataQuality: tResult.data?.dataQuality,
        parcelKey: tResult.data?.parcelKey,
      });
      setSeries(
        (tResult.data?.series ?? []).map((p) => ({
          date: p.capturedAt.split('T')[0],
          ndvi: p.ndvi,
          ndre: p.ndre ?? null,
          dpRvi: p.dpRvi ?? null,
        }))
      );
    } catch {
      const msg = 'Error de red al cargar datos científicos';
      setLoadError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedField, zoneId, profile.crop, asOf, chartMode]);

  useEffect(() => {
    if (selectedField) loadData();
  }, [selectedField, zoneId, loadData, asOf, chartMode]);

  const refreshSatellite = async () => {
    if (!selectedField) return;
    setRefreshing(true);
    try {
      const z = zoneId || selectedField.zones[0]?.id;
      const res = await fetch(`/api/science/${profile.crop}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldId: selectedField.id, zoneId: z }),
      });
      const { data, error } = await parseJsonResponse<{
        ok?: boolean;
        error?: string;
        analysis?: MultisensorAnalysis;
      }>(res);
      if (res.ok && data?.analysis) {
        setAnalysis(data.analysis);
        toast.success('Satélite actualizado');
        loadData();
      } else {
        toast.error(data?.error ?? error ?? 'No se pudo actualizar satélite');
      }
    } catch {
      toast.error('Error de red al actualizar satélite');
    } finally {
      setRefreshing(false);
    }
  };

  const runExperiment = async () => {
    const res = await fetch('/api/science/experiments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        crop: profile.crop,
        fieldId: selectedField?.id,
        zoneId,
        hypothesis,
      }),
    });
    const { data, error } = await parseJsonResponse<{
      error?: string;
      result?: MultisensorAnalysis;
      saved?: boolean;
      experiment?: { id: string };
    }>(res);
    if (res.ok && data?.result) {
      if (data.experiment?.id || data.saved !== false) {
        toast.success('Guardado en nube');
      } else {
        saveLocalExperiment({
          crop: profile.crop,
          fieldId: selectedField?.id ?? '',
          zoneId: zoneId || (selectedField?.zones[0]?.id ?? ''),
          hypothesis,
          notes: null,
          result: data.result,
        });
        toast.success('Guardado local (modo demo)');
      }
      setAnalysis(data.result);
      loadData();
    } else {
      toast.error(data?.error ?? error ?? 'Error al guardar');
    }
  };

  const prevExperiment = experiments[1];
  const lastExperiment = experiments[0];
  const fusionDelta =
    lastExperiment?.result?.fusionScore != null &&
    prevExperiment?.result?.fusionScore != null
      ? (lastExperiment.result.fusionScore - prevExperiment.result.fusionScore) * 100
      : null;
  const ndreDelta =
    lastExperiment?.result?.optical?.ndre != null &&
    prevExperiment?.result?.optical?.ndre != null
      ? (lastExperiment.result.optical.ndre ?? 0) -
        (prevExperiment.result.optical.ndre ?? 0)
      : null;

  const handleLabGoal = useCallback(
    (goal: LabGoalOption) => {
      setHypothesis(goal.hypothesis);
      setLabGoalId(goal.id);
      setPreferCompare(Boolean(goal.opensCompare));
      if (goal.loadsAnalysis && !loading) {
        void loadData();
      }
    },
    [loading, loadData]
  );

  const setTabAndSync = (nextTab: 'client' | 'lab') => {
    setTab(nextTab);
    if (selectedField) {
      syncUrl(selectedField.id, zoneId, nextTab, asOf || undefined);
    }
  };

  const handleAsOfChange = (value: string) => {
    const next = value === 'latest' ? '' : value;
    setAsOf(next);
    if (selectedField) {
      syncUrl(selectedField.id, zoneId, tab, next || undefined);
    }
  };

  if (!cropFields.length) {
    return (
      <PageContainer size="wide">
        <Card className="glass-card">
          <CardContent className="space-y-4 py-8 text-center text-sm text-muted-foreground">
            <p>
              No hay campos de {profile.displayName} en la cartera demo.
            </p>
            <Button variant="outline" asChild>
              <Link href="/science">Volver al laboratorio</Link>
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const healthColors = {
    excellent: 'bg-health-excellent',
    good: 'bg-health-good',
    warning: 'bg-health-warning',
    critical: 'bg-health-critical',
  };

  const healthLabel = (level: string) =>
    healthLabelEs[level as HealthLevel] ?? level;

  return (
    <PageContainer size="wide" className="space-y-6">
      <PageHeader
        title={simpleMode ? 'Seguimiento de tu parcela' : undefined}
        description={
          simpleMode
            ? 'Mirá cómo va tu cultivo con fotos del satélite — en palabras simples.'
            : `${profile.scientificName} · Firma temporal multisensor (S2 óptico + S1 radar).`
        }
        actions={
          <HorizontalScrollRow aria-label="Vistas del laboratorio">
            <ScienceLabTourTrigger simpleMode={simpleMode} className="h-10 shrink-0" />
            <Button
              variant={tab === 'client' ? 'default' : 'outline'}
              size="sm"
              className="h-10 shrink-0 snap-start"
              onClick={() => setTabAndSync('client')}
            >
              {simpleMode ? 'Resumen' : 'Vista cliente'}
            </Button>
            <Button
              variant={tab === 'lab' ? 'default' : 'outline'}
              size="sm"
              className="h-10 shrink-0 snap-start"
              onClick={() => setTabAndSync('lab')}
            >
              <FlaskConical className="h-4 w-4 mr-1" />
              {simpleMode ? 'Seguimiento' : 'Experimentos'}
            </Button>
            <Button variant="outline" size="sm" className="h-10 shrink-0 snap-start" asChild>
              <Link href="/science/bibliography">
                <BookOpen className="h-4 w-4 mr-1" /> Bibliografía
              </Link>
            </Button>
          </HorizontalScrollRow>
        }
      />

      {selectedField && (
        <FieldContextBar
          fieldId={selectedField.id}
          zoneId={zoneId}
          crop={profile.crop}
          currentPage="science"
        />
      )}

      <DataProvenanceBanner
        provenance={analysis?.provenance}
        timeseriesSource={timeseriesMeta.source}
        dataQuality={timeseriesMeta.dataQuality}
        parcelKey={timeseriesMeta.parcelKey}
      />

      <Card className="glass-card">
        <CardContent className="pt-6">
          <ResponsiveToolbar>
          <Select value={selectedField.id} onValueChange={(id) => {
            setFieldId(id);
            const f = cropFields.find((x) => x.id === id);
            const z = f?.zones[0]?.id ?? '';
            setZoneId(z);
            syncUrl(id, z, tab, asOf || undefined);
          }}>
            <SelectTrigger className="h-10 w-full min-w-[140px] shrink-0 sm:w-[200px]"><SelectValue placeholder="Campo" /></SelectTrigger>
            <SelectContent>
              {cropFields.map((f) => (
                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={zoneId}
            onValueChange={(z) => {
              setZoneId(z);
              syncUrl(selectedField.id, z, tab, asOf || undefined);
            }}
          >
            <SelectTrigger className="h-10 w-full min-w-[120px] shrink-0 sm:w-[160px]"><SelectValue placeholder="Zona" /></SelectTrigger>
            <SelectContent>
              {selectedField.zones.map((z) => (
                <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(analysis?.provenance?.availableDates?.length ?? 0) > 0 && (
            <Select
              value={asOf || 'latest'}
              onValueChange={handleAsOfChange}
            >
              <SelectTrigger className="h-10 w-full min-w-[140px] shrink-0 sm:w-[180px]">
                <SelectValue placeholder="Fecha lectura" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Última en DB</SelectItem>
                {analysis?.provenance?.availableDates.map((d) => (
                  <SelectItem key={d} value={d}>
                    {formatDateEs(d)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={chartMode} onValueChange={(v) => setChartMode(v as '90d' | 'week')}>
            <SelectTrigger className="h-10 w-full min-w-[120px] shrink-0 sm:w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="90d">Serie 90d</SelectItem>
              <SelectItem value="week">Modo semana</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadData} disabled={loading} variant="outline" className="h-10 shrink-0">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Actualizar'}
          </Button>
          <Button
            onClick={refreshSatellite}
            disabled={refreshing || loading}
            variant="secondary"
            className="h-10 shrink-0"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Satellite className="h-4 w-4 mr-1" /> Actualizar satélite
              </>
            )}
          </Button>
          {analysis && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-10 shrink-0"
                onClick={() =>
                  downloadBlob(
                    analysisToCsvRow(analysis),
                    `${profile.crop}-analysis.csv`,
                    'text/csv'
                  )
                }
              >
                <Download className="h-4 w-4 mr-1" /> CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-10 shrink-0"
                onClick={() =>
                  downloadBlob(
                    experimentToJson({
                      crop: profile.crop,
                      fieldId: selectedField.id,
                      zoneId,
                      hypothesis,
                      notes: null,
                      result: analysis,
                    }),
                    `${profile.crop}-analysis.json`,
                    'application/json'
                  )
                }
              >
                <Download className="h-4 w-4 mr-1" /> JSON
              </Button>
            </>
          )}
          </ResponsiveToolbar>
        </CardContent>
      </Card>

      {tab === 'lab' && (
        <>
          <ScienceLabTour simpleMode={simpleMode} />
          <LabGuidancePanel
            simpleMode={simpleMode}
            onChooseGoal={handleLabGoal}
            selectedGoalId={labGoalId as LabGoalOption['id'] | null}
          />
        </>
      )}

      {tab === 'lab' && selectedField && (
        <GeodataLabPanel
          fieldId={selectedField.id}
          crop={profile.crop}
          localSeries={series}
          audience={simpleMode ? 'smallholder' : 'cooperative'}
          plainLanguage={simpleMode}
          preferCompare={preferCompare}
        />
      )}

      {tab === 'lab' && (
        <div className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">
                {simpleMode ? '2. Tu nota de seguimiento' : '1. Hipótesis'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(HYPOTHESIS_TEMPLATES[profile.crop]?.length ?? 0) > 0 && (
                <Select value={hypothesis} onValueChange={setHypothesis}>
                  <SelectTrigger><SelectValue placeholder="Plantilla de hipótesis" /></SelectTrigger>
                  <SelectContent>
                    {(HYPOTHESIS_TEMPLATES[profile.crop] ?? []).map((h) => (
                      <SelectItem key={h} value={h}>{h.slice(0, 60)}…</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Textarea
                value={hypothesis}
                onChange={(e) => setHypothesis(e.target.value)}
                rows={3}
                placeholder={
                  simpleMode
                    ? 'Ej.: La parcela se ve más seca que la semana pasada…'
                    : 'Describí qué querés comprobar con satélite…'
                }
              />
              {!simpleMode && (
                <p className="text-xs text-muted-foreground">
                  {selectedField.zones.find((z) => z.id === zoneId)?.name ?? '—'}
                  {studySite ? ` · ${studySite.cohort} · ${studySite.phenologyNote}` : ''}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">
                {simpleMode ? '3. Ver lectura de hoy' : '2. Ejecutar'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!analysis ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    {simpleMode
                      ? 'Tocá el botón para traer la última foto del satélite de tu parcela.'
                      : 'Revisá el contexto histórico arriba, luego cargá el análisis multisensor.'}
                  </p>
                  <Button onClick={loadData} disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : simpleMode ? (
                      'Ver estado de mi parcela'
                    ) : (
                      'Cargar análisis'
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    {simpleMode
                      ? `Lectura lista · ${healthLabel(analysis.healthLabel)}`
                      : `Fase: ${analysis.temporal.phenologyPhase ?? '—'} (${analysis.temporal.phenologyMatch}) · muestras: ${analysis.temporal.sampleCount}`}
                  </p>
                  <Button onClick={runExperiment}>
                    {simpleMode ? 'Guardar seguimiento' : 'Ejecutar experimento'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {analysis && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base">
                  {simpleMode ? '4. Resultado' : '3. Resultado'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div className="border rounded-lg p-3">
                    <p className="text-muted-foreground text-xs">
                      {simpleMode ? 'Estado general' : 'Fusión reglas'}
                    </p>
                    <MetricValue value={analysis.fusionScore * 100} decimals={1} />
                  </div>
                  {!simpleMode && (
                    <div className="border rounded-lg p-3">
                      <p className="text-muted-foreground text-xs">Fusión ML</p>
                      <MetricValue
                        value={analysis.fusionScoreMl != null ? analysis.fusionScoreMl * 100 : null}
                        decimals={1}
                      />
                    </div>
                  )}
                </div>
                {analysis.anomalyFlags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {analysis.anomalyFlags.map((f) => (
                      <Badge key={f} variant="destructive">{f}</Badge>
                    ))}
                  </div>
                )}
                {experiments.length >= 2 && fusionDelta != null && (
                  <p className="text-xs text-muted-foreground">
                    Δ fusionScore vs anterior: {fusionDelta >= 0 ? '+' : ''}
                    {formatDecimal(fusionDelta, 1)} pp
                    {ndreDelta != null && ` · Δ NDRE: ${formatDecimal(ndreDelta, 3)}`}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      downloadBlob(
                        analysisToCsvRow(analysis),
                        `${profile.crop}-analysis.csv`,
                        'text/csv'
                      )
                    }
                  >
                    <Download className="h-4 w-4 mr-1" /> CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      downloadBlob(
                        experimentToJson({
                          crop: profile.crop,
                          fieldId: selectedField.id,
                          zoneId,
                          hypothesis,
                          notes: null,
                          result: analysis,
                        }),
                        `${profile.crop}-experiment.json`,
                        'application/json'
                      )
                    }
                  >
                    <Download className="h-4 w-4 mr-1" /> JSON
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={buildMonitorUrl({ fieldId: selectedField.id, zoneId })}>
                      Ver en monitor
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={buildStudiesUrl({
                        fieldId: selectedField.id,
                        zoneId,
                        crop: profile.crop,
                      })}
                    >
                      Registrar etiqueta
                    </Link>
                  </Button>
                </div>
                {experiments.length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <p className="text-xs font-medium">Historial reciente</p>
                    {experiments.slice(0, 5).map((exp) => (
                      <div key={exp.id} className="text-xs text-muted-foreground border-b py-1">
                        {exp.hypothesis.slice(0, 80)}
                        {exp.hypothesis.length > 80 ? '…' : ''} · {formatDateEs(exp.created_at)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!analysis && !loadError && (
            <Card className="glass-card border-dashed">
              <CardContent className="py-4 text-sm text-muted-foreground">
                <p>
                  {simpleMode
                    ? 'Tip: elegí una tarjeta arriba (ej. “No estoy segura”) y te guiamos sola.'
                    : 'Usá Comparar escala arriba para cooperativa vs Finca María antes de formular la hipótesis.'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {loadError && !analysis && (
        <Card className="glass-card border-health-critical/40 bg-health-critical/5">
          <CardContent className="flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-foreground">{loadError}</p>
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
      )}

      {analysis && (
        <>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex flex-col items-start gap-2 text-base sm:flex-row sm:flex-wrap sm:items-center">
                <span>Score fusión multisensor</span>
                <BadgeRow>
                <Badge className={healthColors[analysis.healthLabel]}>
                  {healthLabel(analysis.healthLabel)}
                </Badge>
                <Badge variant="outline">
                  {formatDecimal(analysis.fusionScore * 100, 0)}%
                </Badge>
                <Badge variant="secondary">{analysis.source}</Badge>
                {analysis.algorithmVersion && (
                  <Badge variant="outline" className="text-xs">v{analysis.algorithmVersion}</Badge>
                )}
                </BadgeRow>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{analysis.narrative}</p>
              {analysis.productionClass && (
                <p className="text-xs mt-2 text-muted-foreground">
                  Sistema producción estimado: <strong>{analysis.productionClass}</strong>
                </p>
              )}
              {analysis.anomalyFlags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {analysis.anomalyFlags.map((f) => (
                    <Badge key={f} variant="destructive">{f}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {(analysis.fusionScoreMl != null || analysis.healthLabelMl) && (
            <Card className="glass-card border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <GitCompare className="h-4 w-4" />
                  Reglas vs ML baseline
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="border rounded-lg p-3">
                  <p className="font-medium mb-1">Reglas (fusión ponderada)</p>
                  <Badge className={healthColors[analysis.healthLabel]}>
                    {healthLabel(analysis.healthLabel)}
                  </Badge>
                  <MetricValue
                    className="mt-2"
                    value={analysis.fusionScore * 100}
                    decimals={1}
                  />
                </div>
                <div className="border rounded-lg p-3">
                  <p className="font-medium mb-1">ML baseline (RF surrogate)</p>
                  {analysis.healthLabelMl && (
                    <Badge className={healthColors[analysis.healthLabelMl]}>
                      {healthLabel(analysis.healthLabelMl)}
                    </Badge>
                  )}
                  <MetricValue
                    className="mt-2"
                    value={
                      analysis.fusionScoreMl != null
                        ? analysis.fusionScoreMl * 100
                        : null
                    }
                    decimals={1}
                  />
                </div>
                <p className="md:col-span-2 text-xs text-muted-foreground">
                  Concordancia:{' '}
                  {analysis.mlConcordance ? 'Sí — reglas y ML coinciden' : 'No — revisar índices clave'}
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="glass-card">
            <CardHeader><CardTitle className="text-base">Índices vs objetivo agronómico</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-2 text-left font-medium text-muted-foreground">Índice</th>
                    <th className="py-2 text-left font-medium text-muted-foreground">Valor</th>
                    <th className="py-2 text-left font-medium text-muted-foreground">Objetivo</th>
                  </tr>
                </thead>
                <tbody>
                  {[...profile.primaryOptical, ...profile.primaryRadar].map((idx) => {
                    const val =
                      (analysis.optical as Record<string, unknown>)[idx.id] ??
                      (analysis.radar as Record<string, unknown>)[idx.id];
                    return (
                      <tr key={idx.id} className="border-b border-border/50">
                        <td className="py-2">{idx.label}</td>
                        <td className="py-2">
                          <MetricValue value={val} decimals={2} />
                        </td>
                        <td className="py-2 text-muted-foreground">{idx.objective}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-base">Óptico Sentinel-2</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(analysis.optical).map(([k, v]) => (
                  v != null && (
                    <div key={k} className="flex justify-between border-b py-1">
                      <span className="uppercase text-muted-foreground">{k}</span>
                      <MetricValue value={v} decimals={2} />
                    </div>
                  )
                ))}
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-base">Radar Sentinel-1</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(analysis.radar).map(([k, v]) => (
                  v != null && (
                    <div key={k} className="flex justify-between border-b py-1">
                      <span className="uppercase text-muted-foreground">{k}</span>
                      <MetricValue value={v} decimals={2} />
                    </div>
                  )
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="glass-card min-w-0 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base sm:text-lg">Serie temporal (90 d)</CardTitle>
            </CardHeader>
            <CardContent className="min-w-0 pt-0">
              <ScienceTimeseriesChart data={series} />
            </CardContent>
          </Card>

          {tab === 'client' && (
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-base">Interpretación agronómica</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {profile.diseaseIndices.map((d) => (
                  <div key={d.disease} className="border rounded-lg p-3">
                    <p className="font-medium">{d.disease}</p>
                    <p className="text-muted-foreground text-xs">{d.thresholdNotes}</p>
                    <p className="text-xs mt-1">Índices: {d.indices.join(', ')}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </PageContainer>
  );
}

export default function ScienceCropClient(props: ScienceCropClientProps) {
  return (
    <Suspense
      fallback={
        <PageContainer size="wide">
          <div className="py-12 text-center text-sm text-muted-foreground">Cargando laboratorio…</div>
        </PageContainer>
      }
    >
      <ScienceCropClientInner {...props} />
    </Suspense>
  );
}
