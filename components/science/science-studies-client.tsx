'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useFields } from '@/hooks/use-fields';
import { listScienceCrops } from '@/lib/science/crops/registry';
import type { ScienceCropId } from '@/lib/science/types';
import { FlaskConical, Loader2, Upload, Play, Download } from 'lucide-react';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface ExperimentRow {
  id: string;
  crop: string;
  field_id: string;
  hypothesis: string;
  created_at: string;
  result?: { fusionScore?: number; fusionScoreMl?: number; healthLabel?: string };
}

interface ValidationRow {
  id: string;
  crop: string;
  disease_label: string | null;
  severity: string;
  health_label: string | null;
  created_at: string;
}

interface ObservationRow {
  id: string;
  field_id: string;
  zone_id: string | null;
  notes: string | null;
  created_at: string;
}

interface MetricsSummary {
  rulesPrecision: number;
  rulesRecall: number;
  mlPrecision: number;
  mlRecall: number;
  concordancePct: number;
}

export default function ScienceStudiesClient() {
  const { fields } = useFields();
  const crops = listScienceCrops();
  const fileRef = useRef<HTMLInputElement>(null);
  const [crop, setCrop] = useState<ScienceCropId>('soybean');
  const [fieldId, setFieldId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [experiments, setExperiments] = useState<ExperimentRow[]>([]);
  const [labels, setLabels] = useState<ValidationRow[]>([]);
  const [observations, setObservations] = useState<ObservationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [importErrors, setImportErrors] = useState<Array<{ rowIndex: number; message: string }>>([]);
  const [diseaseLabel, setDiseaseLabel] = useState('');
  const [severity, setSeverity] = useState('low');
  const [notes, setNotes] = useState('');
  const [observationId, setObservationId] = useState('');
  const [metricsSummary, setMetricsSummary] = useState<MetricsSummary | null>(null);
  const [metricsRunAt, setMetricsRunAt] = useState<string | null>(null);
  const [runningMetrics, setRunningMetrics] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [eRes, vRes, mRes, oRes] = await Promise.all([
        fetch(`/api/science/experiments?crop=${crop}&limit=30`),
        fetch(`/api/science/validation?crop=${crop}`),
        fetch(`/api/science/validation/metrics?crop=${crop}`),
        fetch(`/api/observations?fieldId=${fieldId || ''}&limit=20`),
      ]);
      const e = await eRes.json();
      const v = await vRes.json();
      const m = await mRes.json();
      const o = await oRes.json();
      setExperiments(e.experiments ?? []);
      setLabels(v.labels ?? []);
      setMetricsSummary(m.summary ?? null);
      setMetricsRunAt(m.runAt ?? null);
      setObservations(o.observations ?? []);
    } finally {
      setLoading(false);
    }
  }, [crop, fieldId]);

  useEffect(() => {
    if (fields[0] && !fieldId) {
      setFieldId(fields[0].id);
      setZoneId(fields[0].zones[0]?.id ?? '');
    }
  }, [fields, fieldId]);

  useEffect(() => {
    load();
  }, [load]);

  const submitValidation = async () => {
    const res = await fetch('/api/science/validation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fieldId,
        zoneId: zoneId || undefined,
        crop,
        diseaseLabel: diseaseLabel || undefined,
        severity,
        notes,
        observationId: observationId || undefined,
      }),
    });
    if (res.ok) {
      toast.success('Etiqueta de validación guardada');
      setDiseaseLabel('');
      setNotes('');
      setObservationId('');
      load();
    } else {
      const data = await res.json();
      toast.error(data.error ?? 'Error');
    }
  };

  const handleCsvUpload = async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/science/import', { method: 'POST', body: form });
    const data = await res.json();
    if (res.ok) {
      toast.success(`Importadas ${data.imported} filas (${data.joinedTimeseries} con serie satélite)`);
      setImportErrors(data.errors ?? []);
      load();
    } else {
      toast.error(data.error ?? 'Error importando');
      setImportErrors(data.errors ?? []);
    }
  };

  const runValidation = async () => {
    setRunningMetrics(true);
    try {
      const res = await fetch('/api/science/validation/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crop }),
      });
      const data = await res.json();
      if (res.ok) {
        setMetricsSummary(data.summary);
        setMetricsRunAt(new Date().toISOString());
        toast.success('Validación ejecutada');
      } else {
        toast.error(data.error ?? 'Error');
      }
    } finally {
      setRunningMetrics(false);
    }
  };

  const syncApi = async () => {
    const res = await fetch('/api/science/data/sync', { method: 'POST', body: '{}' });
    const data = await res.json();
    if (res.ok) {
      toast.success(`API: ${data.fetched ?? 0} filas, importadas ${data.imported ?? 0}`);
      load();
    } else {
      toast.error(data.error ?? 'Sync falló — configura SCIENCE_DATA_API_URL');
    }
  };

  const chartData = metricsSummary
    ? [
        {
          name: 'Precisión',
          Reglas: Math.round(metricsSummary.rulesPrecision * 100),
          ML: Math.round(metricsSummary.mlPrecision * 100),
        },
        {
          name: 'Recall',
          Reglas: Math.round(metricsSummary.rulesRecall * 100),
          ML: Math.round(metricsSummary.mlRecall * 100),
        },
        {
          name: 'Concordancia R↔ML',
          Reglas: Math.round(metricsSummary.concordancePct * 100),
          ML: Math.round(metricsSummary.concordancePct * 100),
        },
      ]
    : [];

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2">
        <FlaskConical className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Estudios y validación</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Importa etiquetas de campo (CSV/API), cruza con series satelitales y mide concordancia reglas vs ML.
      </p>

      <Card>
        <CardContent className="pt-6 flex flex-wrap gap-3">
          <Select value={crop} onValueChange={(v) => setCrop(v as ScienceCropId)}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {crops.map((c) => (
                <SelectItem key={c.crop} value={c.crop}>{c.displayName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Actualizar'}
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/science/${crop}`}>Ir al lab</Link>
          </Button>
          <Button variant="outline" asChild>
            <a href={`/api/science/import?crop=${crop}`} download>
              <Download className="h-4 w-4 mr-1" /> Plantilla CSV
            </a>
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.geojson,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleCsvUpload(f);
            }}
          />
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4 mr-1" /> Importar CSV
          </Button>
          <Button variant="secondary" onClick={syncApi}>Sync API</Button>
          <Button onClick={runValidation} disabled={runningMetrics}>
            {runningMetrics ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 mr-1" />}
            Ejecutar validación
          </Button>
        </CardContent>
      </Card>

      {importErrors.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader><CardTitle className="text-sm text-destructive">Errores de importación</CardTitle></CardHeader>
          <CardContent className="text-xs space-y-1 max-h-32 overflow-y-auto">
            {importErrors.map((e, i) => (
              <div key={i}>
                Fila {e.rowIndex}: {'message' in e ? e.message : String(e)}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {metricsSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Métricas de validación
              {metricsRunAt && (
                <Badge variant="outline" className="font-normal">
                  {new Date(metricsRunAt).toLocaleString()}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Legend />
                <Bar dataKey="Reglas" fill="#22c55e" />
                <Bar dataKey="ML" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Experimentos recientes</CardTitle></CardHeader>
          <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
            {experiments.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin experimentos aún.</p>
            )}
            {experiments.map((exp) => (
              <div key={exp.id} className="border rounded-lg p-3 text-sm space-y-1">
                <p className="font-medium line-clamp-2">{exp.hypothesis}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{exp.crop}</Badge>
                  {exp.result?.fusionScore != null && (
                    <Badge>Reglas {(exp.result.fusionScore * 100).toFixed(0)}%</Badge>
                  )}
                  {exp.result?.fusionScoreMl != null && (
                    <Badge variant="secondary">ML {(exp.result.fusionScoreMl * 100).toFixed(0)}%</Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Validación de campo</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Select value={fieldId} onValueChange={(id) => {
              setFieldId(id);
              const f = fields.find((x) => x.id === id);
              setZoneId(f?.zones[0]?.id ?? '');
            }}>
              <SelectTrigger><SelectValue placeholder="Campo" /></SelectTrigger>
              <SelectContent>
                {fields.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={observationId || 'none'} onValueChange={(v) => setObservationId(v === 'none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Observación (opcional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin observación</SelectItem>
                {observations.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.id.slice(0, 8)}… {new Date(o.created_at).toLocaleDateString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Enfermedad / condición"
              value={diseaseLabel}
              onChange={(e) => setDiseaseLabel(e.target.value)}
            />
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['none', 'low', 'medium', 'high', 'critical'].map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea placeholder="Notas" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            <Button onClick={submitValidation}>Guardar etiqueta</Button>

            <div className="pt-4 space-y-2 max-h-[160px] overflow-y-auto">
              {labels.map((l) => (
                <div key={l.id} className="text-xs border-b py-1">
                  {l.disease_label ?? '—'} · {l.severity} · {l.health_label ?? '—'}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Documentación de datos</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Ver <code className="text-xs bg-muted px-1 rounded">docs/research/data-requirements/</code> para formatos CSV/API.
        </CardContent>
      </Card>
    </div>
  );
}
