'use client';

import { FileStack, MapPin } from 'lucide-react';
import {
  QGIS_EXPORT_STEPS,
  SUPPORTED_IMPORT_FORMATS,
} from '@/lib/parcel-import/supported-formats';

export function ImportMigrationGuide({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={
        compact
          ? 'rounded-lg border border-border bg-muted/30 p-4 text-sm space-y-3'
          : 'rounded-xl border border-dashed border-primary/30 bg-primary/5 p-5 space-y-4'
      }
    >
      <div className="flex items-start gap-3">
        <FileStack className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-foreground">¿Ya tenés parcelas en QGIS u otro GIS?</p>
          <p className="text-muted-foreground text-xs mt-1">
            Migrá sin redibujar: exportá tus capas y subilas acá.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {SUPPORTED_IMPORT_FORMATS.map((f) => (
          <span
            key={f.id}
            className="rounded-full border border-border bg-card px-2.5 py-1 text-xs text-foreground"
          >
            {f.label}
          </span>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          Exportar desde QGIS
        </p>
        <ol className="list-decimal list-inside text-xs text-muted-foreground space-y-1">
          {QGIS_EXPORT_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      {!compact && (
        <p className="text-xs text-muted-foreground">
          También aceptamos KML/KMZ (Google Earth), Shapefile en ZIP y CSV con coordenadas.
          MultiPolygon se divide en una parcela por polígono.
        </p>
      )}
    </div>
  );
}
