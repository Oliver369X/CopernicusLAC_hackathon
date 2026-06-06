'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { parseJsonResponse } from '@/lib/fetch/parse-json-response';
import { useOrgBilling } from '@/hooks/use-org-billing';
import { getDefaultZoneSplit } from '@/lib/billing/plans';
import type { ImportBillingPreview } from '@/lib/billing/types';
import { formatDecimal } from '@/lib/i18n/format-number';

interface PreviewField {
  tempId: string;
  name: string;
  crop: string;
  areaHa: number;
  zoneCount: number;
}

interface PreviewResponse {
  fields: PreviewField[];
  errors: Array<{ message: string }>;
  warnings: string[];
  billing?: ImportBillingPreview;
  effectiveZoneSplit?: number;
}

export function ImportStep({
  onComplete,
}: {
  onComplete: (result: { zoneCount: number }) => void;
}) {
  const { billing, refresh: refreshBilling } = useOrgBilling();
  const [file, setFile] = useState<File | null>(null);
  const [zoneSplit, setZoneSplit] = useState(4);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const isHectareModel = billing?.billingModel === 'hectare';
  const effectiveZoneSplit = isHectareModel
    ? 1
    : zoneSplit;

  const usagePercent = billing?.usagePercent ?? 0;
  const progressClass =
    usagePercent >= 100
      ? '[&>div]:bg-health-critical'
      : usagePercent >= 80
        ? '[&>div]:bg-health-warning'
        : '[&>div]:bg-[var(--aura-green)]';

  const projectedBilling = preview?.billing;

  async function runDryRun(f: File) {
    setLoading(true);
    const fd = new FormData();
    fd.append('file', f);
    const res = await fetch(
      `/api/fields/import?dryRun=1&zoneSplit=${effectiveZoneSplit}`,
      { method: 'POST', body: fd }
    );
    const { data, error } = await parseJsonResponse<PreviewResponse & { error?: string; code?: string }>(res);
    setLoading(false);
    if (!res.ok) {
      toast.error(data?.error ?? error ?? 'Error en la vista previa');
      return;
    }
    if (error) {
      toast.error(error);
      return;
    }
    setPreview(data ?? null);
    if (data?.warnings?.length) {
      data.warnings.forEach((w) => toast.message(w));
    }
  }

  async function confirmImport() {
    if (!file) return;
    setLoading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`/api/fields/import?zoneSplit=${effectiveZoneSplit}`, {
      method: 'POST',
      body: fd,
    });
    const { data, error } = await parseJsonResponse<{
      zoneCount: number;
      errors?: Array<{ message: string }>;
      error?: string;
      code?: string;
    }>(res);
    setLoading(false);
    if (!res.ok) {
      toast.error(data?.error ?? error ?? 'No se pudo importar');
      return;
    }
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(`Importados ${data?.zoneCount ?? 0} zonas`);
    await refreshBilling();
    onComplete({ zoneCount: data?.zoneCount ?? 0 });
  }

  const usageLabel = useMemo(() => {
    if (!billing) return null;
    return `Usás ${formatDecimal(billing.totalHa)} de ${formatDecimal(billing.hectareLimit)} ha incluidas`;
  }, [billing]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Importar parcelas</h2>
        <p className="text-sm text-muted-foreground mt-1">
          GeoJSON, KML, Shapefile (.zip) o CSV. Columnas: nombre, cultivo (soybean/wheat/maize),
          área ha.
        </p>
      </div>

      {billing && (
        <div className="space-y-2 rounded-lg border border-border p-4">
          <p className="text-sm font-medium">{usageLabel}</p>
          <Progress
            value={Math.min(100, billing.usagePercent)}
            className={`h-2 ${progressClass}`}
          />
          {billing.estimatedMonthlyUsd > 0 && (
            <p className="text-xs text-muted-foreground">
              Estimado actual: ${formatDecimal(billing.estimatedMonthlyUsd)}/mes
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" size="sm" asChild>
          <a href="/api/fields/import/template" download>
            <Download className="mr-2 h-4 w-4" />
            Plantilla CSV
          </a>
        </Button>
      </div>

      {!isHectareModel && billing && (
        <div className="space-y-2">
          <Label htmlFor="zone-split">Subzonas por lote (si el archivo no trae zonas)</Label>
          <Input
            id="zone-split"
            type="number"
            min={1}
            max={billing.maxZoneSplit}
            value={zoneSplit}
            onChange={(e) => setZoneSplit(Number(e.target.value))}
            className="max-w-[120px]"
          />
          <p className="text-xs text-muted-foreground">
            Default cooperativa: {getDefaultZoneSplit('zone')} zonas
          </p>
        </div>
      )}

      <label className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border p-10 cursor-pointer hover:bg-muted/40">
        <Upload className="h-8 w-8 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {file ? file.name : 'Arrastrá o elegí un archivo'}
        </span>
        <input
          type="file"
          accept=".geojson,.json,.kml,.csv,.zip"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              setFile(f);
              void runDryRun(f);
            }
          }}
        />
      </label>

      {loading && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Procesando…
        </p>
      )}

      {preview && (
        <div className="space-y-3">
          <p className="text-sm font-medium">{preview.fields.length} lotes listos</p>
          {projectedBilling && (
            <p className="text-sm text-muted-foreground">
              Proyectado: {formatDecimal(projectedBilling.projectedTotalHa)} ha · Estimado:{' '}
              {projectedBilling.estimatedMonthlyUsd > 0
                ? `$${formatDecimal(projectedBilling.estimatedMonthlyUsd)}/mes`
                : 'sin costo'}
            </p>
          )}
          {preview.errors.length > 0 && (
            <ul className="text-sm text-destructive space-y-1">
              {preview.errors.slice(0, 5).map((e, i) => (
                <li key={i}>{e.message}</li>
              ))}
            </ul>
          )}
          <div className="max-h-48 overflow-auto rounded-lg border text-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-2 text-left">Nombre</th>
                  <th className="p-2 text-left">Cultivo</th>
                  <th className="p-2 text-right">ha</th>
                </tr>
              </thead>
              <tbody>
                {preview.fields.map((f) => (
                  <tr key={f.tempId} className="border-b">
                    <td className="p-2">{f.name}</td>
                    <td className="p-2">{f.crop}</td>
                    <td className="p-2 text-right">{f.areaHa}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button
            disabled={!preview.fields.length || loading}
            onClick={() => void confirmImport()}
          >
            Importar {preview.fields.length} lotes
          </Button>
        </div>
      )}
    </div>
  );
}
