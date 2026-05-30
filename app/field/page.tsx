'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useFields } from '@/hooks/use-fields';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Droplets, Thermometer, Wind, Download, WifiOff } from 'lucide-react';
import { prefetchFieldMapTiles } from '@/lib/offline-map-cache';
import { boundsToBbox } from '@/lib/services/copernicus/bounds';
import { toast } from 'sonner';

export default function FieldMonitoring() {
  const { fields, loading } = useFields();
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

  const healthColors = {
    excellent: 'bg-health-excellent text-white',
    good: 'bg-health-good text-white',
    warning: 'bg-health-warning text-black',
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
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  useEffect(() => {
    const onOnline = () => setOfflineReady(false);
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, []);

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
    return <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="p-4 space-y-4 pb-4">
      {/* Field Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Select Field</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedField.id} onValueChange={handleFieldChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fields.map((field) => (
                <SelectItem key={field.id} value={field.id}>
                  {field.name} • {field.crop}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Current Zone Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Current Zone</CardTitle>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                healthColors[selectedZone.health]
              }`}
            >
              {selectedZone.health.charAt(0).toUpperCase() +
                selectedZone.health.slice(1)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select
            value={selectedZone.id}
            onValueChange={(zoneId) => setSelectedZoneId(zoneId)}
          >
            <SelectTrigger>
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

          {/* Live Data Display */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-center gap-2 mb-1">
                <Droplets className="h-4 w-4 text-health-good" />
                <span className="text-xs text-muted-foreground">Moisture</span>
              </div>
              <p className="text-xl font-bold text-foreground">
                {selectedZone.soilMoistureAverage.toFixed(0)}%
              </p>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-center gap-2 mb-1">
                <Thermometer className="h-4 w-4 text-health-warning" />
                <span className="text-xs text-muted-foreground">Temp</span>
              </div>
              <p className="text-xl font-bold text-foreground">
                {selectedZone.temperatureAverage.toFixed(0)}°C
              </p>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-center gap-2 mb-1">
                <Wind className="h-4 w-4 text-health-excellent" />
                <span className="text-xs text-muted-foreground">NDVI</span>
              </div>
              <p className="text-xl font-bold text-foreground">
                {selectedZone.ndviAverage.toFixed(2)}
              </p>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-center gap-2 mb-1">
                <Wind className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">NDMI</span>
              </div>
              <p className="text-xl font-bold text-foreground">
                {selectedZone.ndmiAverage.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disease Risks */}
      {selectedZone.diseaseRisks.length > 0 && (
        <Card className="border-health-warning/30 bg-health-warning/5">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-health-warning flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  Disease Risks Detected
                </h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {selectedZone.diseaseRisks.map((risk) => (
                    <li key={risk} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-health-warning" />
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        {!isOnline && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
            <WifiOff className="h-4 w-4" />
            Modo offline — datos locales disponibles
          </div>
        )}
        <Button className="w-full" asChild>
          <Link href={`/field/capture?field=${selectedField.id}&zoneId=${selectedZone.id}`}>
            Take Photo for Analysis
          </Link>
        </Button>
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={handlePrefetchMap}
          disabled={prefetching}
        >
          <Download className="h-4 w-4" />
          {prefetching
            ? 'Descargando mapa...'
            : offlineReady
              ? 'Mapa offline listo'
              : 'Descargar mapa del campo'}
        </Button>
        <Button variant="outline" className="w-full" asChild>
          <Link href="/field/history">View Historical Data</Link>
        </Button>
      </div>

      {/* Last Update */}
      <div className="text-center text-xs text-muted-foreground">
        <p>Last updated: {new Date(selectedZone.lastUpdate).toLocaleTimeString()}</p>
        <p>Observations: {selectedZone.observationCount}</p>
      </div>
    </div>
  );
}
