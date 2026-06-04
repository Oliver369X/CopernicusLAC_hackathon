'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { parseJsonResponse } from '@/lib/fetch/parse-json-response';

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
}

export function ImportStep({
  onComplete,
}: {
  onComplete: (result: { zoneCount: number }) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [zoneSplit, setZoneSplit] = useState(4);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function runDryRun(f: File) {
    setLoading(true);
    const fd = new FormData();
    fd.append('file', f);
    const res = await fetch(`/api/fields/import?dryRun=1&zoneSplit=${zoneSplit}`, {
      method: 'POST',
      body: fd,
    });
    const { data, error } = await parseJsonResponse<PreviewResponse>(res);
    setLoading(false);
    if (error) {
      toast.error(error);
      return;
    }
    setPreview(data ?? null);
  }

  async function confirmImport() {
    if (!file) return;
    setLoading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`/api/fields/import?zoneSplit=${zoneSplit}`, {
      method: 'POST',
      body: fd,
    });
    const { data, error } = await parseJsonResponse<{
      zoneCount: number;
      errors?: Array<{ message: string }>;
    }>(res);
    setLoading(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(`Importados ${data?.zoneCount ?? 0} zonas`);
    onComplete({ zoneCount: data?.zoneCount ?? 0 });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Importar parcelas</h2>
        <p className="text-sm text-muted-foreground mt-1">
          GeoJSON, KML, Shapefile (.zip) o CSV. Columnas: nombre, cultivo (soybean/wheat/maize),
          área ha. Ver plantilla CSV o video de capacitación piloto BID.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" size="sm" asChild>
          <a href="/api/fields/import/template" download>
            <Download className="mr-2 h-4 w-4" />
            Plantilla CSV
          </a>
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="zone-split">Subzonas por lote (si el archivo no trae zonas)</Label>
        <Input
          id="zone-split"
          type="number"
          min={1}
          max={8}
          value={zoneSplit}
          onChange={(e) => setZoneSplit(Number(e.target.value))}
          className="max-w-[120px]"
        />
      </div>

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
