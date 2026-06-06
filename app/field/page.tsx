'use client';

import { useState, useEffect } from 'react';
import { useFields } from '@/hooks/use-fields';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertCircle,
  Droplets,
  Thermometer,
  Leaf,
  Waves,
  Camera,
  Download,
  History,
  Satellite,
  Loader2,
} from 'lucide-react';
import { prefetchFieldMapTiles } from '@/lib/offline-map-cache';
import { boundsToBbox } from '@/lib/services/copernicus/bounds';
import { toast } from 'sonner';
import { OfflineMapBadge } from '@/components/field/connection-status';
import { FieldPageIntro } from '@/components/field/field-page-intro';
import { FieldActionLink } from '@/components/field/field-action-link';
import { FieldMetricTile } from '@/components/field/field-metric-tile';
import { healthLabelEs, getCropLabelEs, type HealthLevel } from '@/lib/design/tokens';
import { formatDateTimeEs } from '@/lib/i18n/format-date';
import { formatDecimal } from '@/lib/i18n/format-number';
import { labelDiseaseName } from '@/lib/i18n/observation-labels';
import { cn } from '@/lib/utils';

export default function FieldMonitoring() {
  const { fields, loading, fetchError } = useFields();
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  const selectedField = fields.find((f) => f.id === selectedFieldId) ?? fields[0];
  const selectedZone =
    selectedField?.zones.find((z) => z.id === selectedZoneId) ??
    selectedField?.zones[0];

  useEffect(() => {
    if (fields.length && !selectedFieldId) {
      setSelectedFieldId(fields[0].id);
      setSelectedZoneId(fields[0].zones[0]?.id ?? null);
    }
  }, [fields, selectedFieldId]);

  const healthBadgeClass: Record<HealthLevel, string> = {
    excellent: 'bg-health-excellent text-white',
    good: 'bg-health-good text-foreground',
    warning: 'bg-health-warning text-foreground',
    critical: 'bg-health-critical text-white',
  };

  const handleFieldChange = (fieldId: string) => {
    const field = fields.find((f) => f.id === fieldId);
    if (field) {
      setSelectedFieldId(field.id);
      setSelectedZoneId(field.zones[0]?.id ?? null);
    }
  };

  const [offlineReady, setOfflineReady] = useState(false);
  const [prefetching, setPrefetching] = useState(false);

  const handlePrefetchMap = async () => {
    if (!selectedField) return;
    setPrefetching(true);
    try {
      const bbox = boundsToBbox(selectedField.bounds).join(',');
      const count = await prefetchFieldMapTiles(selectedField.id, bbox, ['ndvi', 'ndre']);
      setOfflineReady(count > 0);
      toast.success(`Mapa offline: ${count} capa(s) descargada(s)`);
    } catch {
      toast.error('No se pudo precargar el mapa');
    } finally {
      setPrefetching(false);
    }
  };

  if (loading || !selectedField || !selectedZone) {
    return (
      <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        Cargando campo...
      </div>
    );
  }

  const captureHref = `/field/capture?field=${selectedField.id}&zoneId=${selectedZone.id}`;

  return (
    <div className="space-y-4 pb-2 pt-1">
      {fetchError && (
        <p className="rounded-lg border border-health-warning/40 bg-health-warning/10 px-3 py-2.5 text-xs text-muted-foreground sm:text-sm">
          {fetchError}. Usando datos de demostración.
        </p>
      )}

      <FieldPageIntro
        title={selectedField.name}
        description={`${getCropLabelEs(selectedField.crop)} · ${selectedZone.name} · índices y acciones rápidas`}
      />

      <div className="space-y-3">
        <Card className="glass-card">
          <CardContent className="space-y-3 p-4 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-muted-foreground">Campo y zona</p>
              <span
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide sm:text-sm',
                  healthBadgeClass[selectedZone.health as HealthLevel]
                )}
              >
                {healthLabelEs[selectedZone.health as HealthLevel]}
              </span>
            </div>
            <Select value={selectedField.id} onValueChange={handleFieldChange}>
              <SelectTrigger className="h-11 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fields.map((field) => (
                  <SelectItem key={field.id} value={field.id}>
                    {field.name} · {getCropLabelEs(field.crop)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedZone.id}
              onValueChange={(zoneId) => setSelectedZoneId(zoneId)}
            >
              <SelectTrigger className="h-11 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {selectedField.zones.map((zone) => (
                  <SelectItem key={zone.id} value={zone.id}>
                    {zone.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="grid grid-cols-2 gap-2 pt-1 sm:gap-3">
              <FieldMetricTile
                icon={Droplets}
                label="Humedad del suelo"
                value={`${formatDecimal(selectedZone.soilMoistureAverage, 0)}%`}
                iconClassName="text-health-good"
              />
              <FieldMetricTile
                icon={Thermometer}
                label="Temperatura"
                value={`${formatDecimal(selectedZone.temperatureAverage, 0)}°C`}
                iconClassName="text-health-warning"
              />
              <FieldMetricTile
                icon={Leaf}
                label="NDVI"
                value={formatDecimal(selectedZone.ndviAverage, 2)}
                iconClassName="text-health-excellent"
              />
              <FieldMetricTile
                icon={Waves}
                label="NDMI"
                value={formatDecimal(selectedZone.ndmiAverage, 2)}
                iconClassName="text-primary"
              />
            </div>
          </CardContent>
        </Card>

        {selectedZone.diseaseRisks.length > 0 && (
          <Card className="glass-card border-health-warning/30 bg-health-warning/5">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-health-warning" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground sm:text-base">
                    Riesgos detectados en la zona
                  </h3>
                  <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                    {selectedZone.diseaseRisks.map((risk) => (
                      <li key={risk} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-health-warning" />
                        {labelDiseaseName(risk)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          <FieldActionLink
            href={captureHref}
            icon={Camera}
            title="Tomar foto para análisis"
            description="Captura en esta zona y diagnóstico con IA"
            variant="primary"
          />
          <FieldActionLink
            href="/field/history"
            icon={History}
            title="Historial de observaciones"
            description={`${selectedZone.observationCount} registro(s) en este lote`}
          />
          <FieldActionLink
            icon={Download}
            title={
              prefetching
                ? 'Descargando mapa...'
                : offlineReady
                  ? 'Mapa offline listo'
                  : 'Descargar mapa del campo'
            }
            description="Capas NDVI/NDRE para uso sin conexión"
            onClick={handlePrefetchMap}
            disabled={prefetching}
          />
          <FieldActionLink
            href="/monitor"
            icon={Satellite}
            title="Monitoreo satelital completo"
            description="Vista ampliada Copernicus en el panel principal"
            variant="ghost"
          />
        </div>

        {offlineReady && (
          <div className="flex justify-center">
            <OfflineMapBadge ready />
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Última actualización: {formatDateTimeEs(selectedZone.lastUpdate)}
        </p>
      </div>
    </div>
  );
}
