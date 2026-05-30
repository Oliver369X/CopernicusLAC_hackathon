'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
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
    try {
      const z = zoneId || selectedField.zones[0]?.id;
      const [aRes, tRes, eRes] = await Promise.all([
        fetch(`/api/science/${profile.crop}/analysis?fieldId=${selectedField.id}&zoneId=${z}`),
        fetch(`/api/science/${profile.crop}/timeseries?fieldId=${selectedField.id}&zoneId=${z}&days=90`),
        fetch(`/api/science/experiments?crop=${profile.crop}&fieldId=${selectedField.id}&limit=10`),
      ]);
      const a = await aRes.json();
      const t = await tRes.json();
      const e = await eRes.json();
      setExperiments(e.experiments ?? []);
      setAnalysis(a as MultisensorAnalysis);
      setSeries(
        (t.series ?? []).map((p: { capturedAt: string; ndvi: number; ndre?: number; dpRvi?: number }) => ({
          date: p.capturedAt.split('T')[0],
          ndvi: p.ndvi,
          ndre: p.ndre ?? null,
          dpRvi: p.dpRvi ?? null,
        }))
      );
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
    const data = await res.json();
    if (res.ok) {
      toast.success('Experimento registrado');
      setAnalysis(data.result);
      loadData();
    } else {
      toast.error(data.error ?? 'Error al guardar');
    }
  };

  if (!cropFields.length) {
    return (
      <div className="p-6 text-muted-foreground">
        No hay campos de {profile.displayName} en la base de datos demo.
      </div>
    );
  }

  const healthColors = {
    excellent: 'bg-health-excellent',
    good: 'bg-health-good',
    warning: 'bg-health-warning',
    critical: 'bg-health-critical',
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{profile.displayName} — Laboratorio científico</h1>
          <p className="text-sm text-muted-foreground italic">{profile.scientificName}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Firma temporal multisensor (S2 óptico + S1 radar). No índice único mágico.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant={tab === 'client' ? 'default' : 'outline'} size="sm" onClick={() => setTab('client')}>
            Vista cliente
          </Button>
          <Button variant={tab === 'lab' ? 'default' : 'outline'} size="sm" onClick={() => setTab('lab')}>
            <FlaskConical className="h-4 w-4 mr-1" /> Experimentos
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/science/bibliography">
              <BookOpen className="h-4 w-4 mr-1" /> Bibliografía
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 flex flex-wrap gap-4">
          <Select value={selectedField.id} onValueChange={(id) => {
            setFieldId(id);
            const f = cropFields.find((x) => x.id === id);
            setZoneId(f?.zones[0]?.id ?? '');
          }}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Campo" /></SelectTrigger>
            <SelectContent>
              {cropFields.map((f) => (
                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={zoneId} onValueChange={setZoneId}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Zona" /></SelectTrigger>
            <SelectContent>
              {selectedField.zones.map((z) => (
                <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={loadData} disabled={loading} variant="outline">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Actualizar'}
          </Button>
          {analysis && (
            <>
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
                    `${profile.crop}-analysis.json`,
                    'application/json'
                  )
                }
              >
                <Download className="h-4 w-4 mr-1" /> JSON
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {analysis && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                Score fusión multisensor
                <Badge className={healthColors[analysis.healthLabel]}>{analysis.healthLabel}</Badge>
                <Badge variant="outline">{(analysis.fusionScore * 100).toFixed(0)}%</Badge>
                <Badge variant="secondary">{analysis.source}</Badge>
                {analysis.algorithmVersion && (
                  <Badge variant="outline" className="text-xs">v{analysis.algorithmVersion}</Badge>
                )}
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
            <Card className="border-primary/20">
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
                    {analysis.healthLabel}
                  </Badge>
                  <p className="mt-2 font-mono">{(analysis.fusionScore * 100).toFixed(1)}%</p>
                </div>
                <div className="border rounded-lg p-3">
                  <p className="font-medium mb-1">ML baseline (RF surrogate)</p>
                  {analysis.healthLabelMl && (
                    <Badge className={healthColors[analysis.healthLabelMl]}>
                      {analysis.healthLabelMl}
                    </Badge>
                  )}
                  <p className="mt-2 font-mono">
                    {analysis.fusionScoreMl != null
                      ? `${(analysis.fusionScoreMl * 100).toFixed(1)}%`
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

          <Card>
            <CardHeader><CardTitle className="text-base">Índices vs objetivo agronómico</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1">Índice</th>
                    <th className="text-left py-1">Valor</th>
                    <th className="text-left py-1">Objetivo</th>
                  </tr>
                </thead>
                <tbody>
                  {[...profile.primaryOptical, ...profile.primaryRadar].map((idx) => {
                    const val =
                      (analysis.optical as Record<string, number | undefined>)[idx.id] ??
                      (analysis.radar as Record<string, number | undefined>)[idx.id];
                    return (
                      <tr key={idx.id} className="border-b border-border/50">
                        <td className="py-1">{idx.label}</td>
                        <td className="py-1 font-mono">{val != null ? val.toFixed(3) : '—'}</td>
                        <td className="py-1 text-muted-foreground">{idx.objective}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Óptico Sentinel-2</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(analysis.optical).map(([k, v]) => (
                  v != null && (
                    <div key={k} className="flex justify-between border-b py-1">
                      <span className="uppercase text-muted-foreground">{k}</span>
                      <span className="font-mono">{typeof v === 'number' ? v.toFixed(3) : v}</span>
                    </div>
                  )
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Radar Sentinel-1</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(analysis.radar).map(([k, v]) => (
                  v != null && (
                    <div key={k} className="flex justify-between border-b py-1">
                      <span className="uppercase text-muted-foreground">{k}</span>
                      <span className="font-mono">{typeof v === 'number' ? v.toFixed(3) : v}</span>
                    </div>
                  )
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Serie temporal (90 d)</CardTitle></CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="ndvi" stroke="#22c55e" dot={false} name="NDVI" />
                  <Line type="monotone" dataKey="ndre" stroke="#8b5cf6" dot={false} name="NDRE" />
                  <Line type="monotone" dataKey="dpRvi" stroke="#f97316" dot={false} name="DpRVI" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {tab === 'client' && (
            <Card>
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
            <Card>
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
                        {exp.hypothesis.slice(0, 80)}… · {new Date(exp.created_at).toLocaleDateString()}
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
    </div>
  );
}
