'use client';

import { useCallback, useEffect, useState } from 'react';
import { ScienceTimeseriesChart } from '@/components/charts/science-timeseries-chart';
import {
  healthLabelEs,
  type HealthLevel,
} from '@/lib/design/tokens';
import { PageContainer, PageHeader } from '@/components/layout/page-header';
import { formatDecimal } from '@/lib/i18n/format-number';
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
import { FlaskConical, BookOpen, Loader2, Download, GitCompare } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { parseJsonResponse } from '@/lib/fetch/parse-json-response';
import { formatDateEs } from '@/lib/i18n/format-date';

interface ScienceCropClientProps {
  profile: CropScienceProfile;
}

export default function ScienceCropClient({ profile }: ScienceCropClientProps) {
  const { fields } = useFields();
  const cropFields = fields.filter((f) => f.crop === profile.crop);
  const [fieldId, setFieldId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [analysis, setAnalysis] = useState<MultisensorAnalysis | null>(null);
  const [series, setSeries] = useState<Array<{ date: string; ndvi: number; ndre: number | null; dpRvi: number | null }>>([]);
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
  const [experiments, setExperiments] = useState<Array<{ id: string; hypothesis: string; created_at: string }>>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const selectedField = cropFields.find((f) => f.id === fieldId) ?? cropFields[0];

  useEffect(() => {
    if (cropFields[0] && !fieldId) {
      setFieldId(cropFields[0].id);
      setZoneId(cropFields[0].zones[0]?.id ?? '');
    }
  }, [cropFields, fieldId]);

  const loadData = useCallback(async () => {
    if (!selectedField) return;
    setLoading(true);
    setLoadError(null);
    try {
      const z = zoneId || selectedField.zones[0]?.id;
      const [aRes, tRes, eRes] = await Promise.all([
        fetch(`/api/science/${profile.crop}/analysis?fieldId=${selectedField.id}&zoneId=${z}`),
        fetch(`/api/science/${profile.crop}/timeseries?fieldId=${selectedField.id}&zoneId=${z}&days=90`),
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
      }>(tRes, { series: [] });
      const eResult = await parseJsonResponse<{ experiments?: typeof experiments }>(eRes, {
        experiments: [],
      });

      if (!aResult.data) {
        const msg = aResult.error ?? 'No se pudo cargar el análisis multisensor';
        setLoadError(msg);
        toast.error(msg);
        return;
      }

      setExperiments(eResult.data?.experiments ?? []);
      setAnalysis(aResult.data);
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
  }, [selectedField, zoneId, profile.crop]);

  useEffect(() => {
    if (selectedField) loadData();
  }, [selectedField, zoneId, loadData]);

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
    const { data, error } = await parseJsonResponse<{ error?: string; result?: MultisensorAnalysis }>(
      res
    );
    if (res.ok && data?.result) {
      toast.success('Experimento registrado');
      setAnalysis(data.result);
      loadData();
    } else {
      toast.error(data?.error ?? error ?? 'Error al guardar');
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
        description={`${profile.scientificName} · Firma temporal multisensor (S2 óptico + S1 radar).`}
        actions={
          <HorizontalScrollRow aria-label="Vistas del laboratorio">
            <Button
              variant={tab === 'client' ? 'default' : 'outline'}
              size="sm"
              className="h-10 shrink-0 snap-start"
              onClick={() => setTab('client')}
            >
              Vista cliente
            </Button>
            <Button
              variant={tab === 'lab' ? 'default' : 'outline'}
              size="sm"
              className="h-10 shrink-0 snap-start"
              onClick={() => setTab('lab')}
            >
              <FlaskConical className="h-4 w-4 mr-1" /> Experimentos
            </Button>
            <Button variant="outline" size="sm" className="h-10 shrink-0 snap-start" asChild>
              <Link href="/science/bibliography">
                <BookOpen className="h-4 w-4 mr-1" /> Bibliografía
              </Link>
            </Button>
          </HorizontalScrollRow>
        }
      />

      <Card className="glass-card">
        <CardContent className="pt-6">
          <ResponsiveToolbar>
          <Select value={selectedField.id} onValueChange={(id) => {
            setFieldId(id);
            const f = cropFields.find((x) => x.id === id);
            setZoneId(f?.zones[0]?.id ?? '');
          }}>
            <SelectTrigger className="h-10 w-full min-w-[140px] shrink-0 sm:w-[200px]"><SelectValue placeholder="Campo" /></SelectTrigger>
            <SelectContent>
              {cropFields.map((f) => (
                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={zoneId} onValueChange={setZoneId}>
            <SelectTrigger className="h-10 w-full min-w-[120px] shrink-0 sm:w-[160px]"><SelectValue placeholder="Zona" /></SelectTrigger>
            <SelectContent>
              {selectedField.zones.map((z) => (
                <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={loadData} disabled={loading} variant="outline" className="h-10 shrink-0">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Actualizar'}
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
                  <p className="mt-2 font-mono tabular-nums">
                    {formatDecimal(analysis.fusionScore * 100, 1)}%
                  </p>
                </div>
                <div className="border rounded-lg p-3">
                  <p className="font-medium mb-1">ML baseline (RF surrogate)</p>
                  {analysis.healthLabelMl && (
                    <Badge className={healthColors[analysis.healthLabelMl]}>
                      {healthLabel(analysis.healthLabelMl)}
                    </Badge>
                  )}
                  <p className="mt-2 font-mono tabular-nums">
                    {analysis.fusionScoreMl != null
                      ? `${formatDecimal(analysis.fusionScoreMl * 100, 1)}%`
                      : '—'}
                  </p>
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
                        <td className="py-2 font-mono tabular-nums">
                          {formatDecimal(val, 2)}
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
                      <span className="font-mono tabular-nums">
                        {formatDecimal(v, 2)}
                      </span>
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
                      <span className="font-mono tabular-nums">
                        {formatDecimal(v, 2)}
                      </span>
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

          {tab === 'lab' && (
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-base">Registrar experimento</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Textarea value={hypothesis} onChange={(e) => setHypothesis(e.target.value)} rows={3} />
                <p className="text-xs text-muted-foreground">
                  Fase fenológica: {analysis.temporal.phenologyPhase ?? '—'} ({analysis.temporal.phenologyMatch}) ·
                  muestras: {analysis.temporal.sampleCount}
                </p>
                <Button onClick={runExperiment}>Ejecutar y guardar en DB</Button>
                {experiments.length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <p className="text-xs font-medium">Historial reciente</p>
                    {experiments.slice(0, 5).map((exp) => (
                      <div key={exp.id} className="text-xs text-muted-foreground border-b py-1">
                        {exp.hypothesis.slice(0, 80)}… · {formatDateEs(exp.created_at)}
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Referencias: {profile.references.join(' · ')}
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </PageContainer>
  );
}
