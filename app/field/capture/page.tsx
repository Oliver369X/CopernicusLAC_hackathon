'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Camera, Upload, Trash2, Send, MapPin } from 'lucide-react';
import { useFields } from '@/hooks/use-fields';
import { saveObservation } from '@/lib/offline-storage';
import { compressImageDataUrl, validateImageDataUrl } from '@/lib/utils/image-compress';
import { toast } from 'sonner';
import { FieldPageIntro } from '@/components/field/field-page-intro';
import { formatDecimal } from '@/lib/i18n/format-number';
import { parseJsonResponse } from '@/lib/fetch/parse-json-response';

export default function PhotoCapture() {
  return (
    <Suspense fallback={<div className="p-4 text-center text-sm text-muted-foreground">Cargando...</div>}>
      <PhotoCaptureContent />
    </Suspense>
  );
}

function PhotoCaptureContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const { fields } = useFields();
  const [fieldId, setFieldId] = useState('field-sj-norte');
  const [zoneId, setZoneId] = useState('zone-sj-n-1');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [gpsData, setGpsData] = useState<{ lat: number; lng: number } | null>(null);

  const selectedField = fields.find((f) => f.id === fieldId) ?? fields[0];

  useEffect(() => {
    const f = searchParams.get('field');
    const z = searchParams.get('zoneId');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    if (f) setFieldId(f);
    if (z) setZoneId(z);
    if (lat && lng) {
      const latN = parseFloat(lat);
      const lngN = parseFloat(lng);
      if (!Number.isNaN(latN) && !Number.isNaN(lngN)) {
        setGpsData({ lat: latN, lng: lngN });
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (fields[0] && fieldId === 'field-sj-norte' && !fields.find((f) => f.id === fieldId)) {
      setFieldId(fields[0].id);
      setZoneId(fields[0].zones[0]?.id ?? zoneId);
    }
  }, [fields, fieldId, zoneId]);

  const handleFieldChange = (id: string) => {
    setFieldId(id);
    const field = fields.find((f) => f.id === id);
    if (field?.zones[0]) setZoneId(field.zones[0].id);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGetLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsData({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          toast.error('No se pudo obtener la ubicación GPS');
        }
      );
    }
  };

  const handleClearImage = () => {
    setCapturedImage(null);
    setNotes('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!capturedImage) return;

    setSubmitting(true);
    const id = `obs-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    try {
      const compressed = await compressImageDataUrl(capturedImage);
      const validation = validateImageDataUrl(compressed);
      if (!validation.ok) {
        toast.error(validation.error ?? 'Imagen no válida');
        return;
      }

      await saveObservation({
        id,
        fieldId,
        zoneId,
        timestamp: Date.now(),
        imageData: compressed,
        notes,
        location: gpsData ?? undefined,
        synced: false,
      });

      if (navigator.onLine) {
        try {
          const res = await fetch('/api/observations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id,
              fieldId,
              zoneId,
              notes,
              location: gpsData,
              imageData: compressed,
            }),
          });
          const { error: syncError } = await parseJsonResponse(res);
          if (res.ok && !syncError) {
            const { markAsSynced } = await import('@/lib/offline-storage');
            await markAsSynced(id);
          }
        } catch {
          if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.ready;
            const syncManager = reg as ServiceWorkerRegistration & {
              sync?: { register: (tag: string) => Promise<void> };
            };
            await syncManager.sync?.register('sync-observations').catch(() => undefined);
          }
        }
      }

      toast.success('Observación guardada');
      handleClearImage();
      router.push(`/field/diagnostics?observationId=${id}`);
    } catch {
      toast.error('Error al guardar la observación');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-4">
      <FieldPageIntro
        title="Nueva observación"
        description="Elegí lote y zona, adjuntá la foto y opcionalmente GPS y notas para el diagnóstico IA."
      />

      <div className="space-y-4">
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Campo y zona</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={fieldId} onValueChange={handleFieldChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fields.map((field) => (
                <SelectItem key={field.id} value={field.id}>
                  {field.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={zoneId} onValueChange={setZoneId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {selectedField?.zones.map((zone) => (
                <SelectItem key={zone.id} value={zone.id}>
                  {zone.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {capturedImage ? (
        <Card>
          <CardContent className="pt-6">
            <div className="relative rounded-lg overflow-hidden bg-muted">
              <img src={capturedImage} alt="Captured crop" className="w-full h-auto" />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass-card border-dashed">
          <CardContent className="pt-6 pb-6">
            <div className="text-center space-y-4">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Camera className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Sin imagen seleccionada</p>
            </div>
          </CardContent>
        </Card>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      <div className="space-y-2">
        <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full gap-2">
          <Upload className="h-4 w-4" />
          {capturedImage ? 'Cambiar imagen' : 'Subir foto'}
        </Button>
        {capturedImage && (
          <Button onClick={handleClearImage} variant="outline" className="w-full gap-2 text-destructive">
            <Trash2 className="h-4 w-4" />
            Borrar foto
          </Button>
        )}
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Ubicación GPS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {gpsData ? (
            <div className="rounded-lg border border-border p-3 bg-muted/30 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="font-medium tabular-nums text-foreground">
                  {formatDecimal(gpsData.lat, 4)}, {formatDecimal(gpsData.lng, 4)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Sin ubicación registrada</p>
          )}
          <Button onClick={handleGetLocation} variant="outline" className="w-full gap-2 text-sm">
            <MapPin className="h-4 w-4" />
            {gpsData ? 'Actualizar ubicación' : 'Capturar GPS'}
          </Button>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Notas de observación</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Síntomas visibles, estado del lote..."
            className="w-full min-h-[120px] rounded-lg border border-border bg-background p-3 text-sm"
          />
        </CardContent>
      </Card>

      {capturedImage && (
        <Button onClick={handleSubmit} disabled={submitting} className="w-full gap-2">
          <Send className="h-4 w-4" />
          {submitting ? 'Guardando...' : 'Enviar a análisis IA'}
        </Button>
      )}
      </div>
    </div>
  );
}
