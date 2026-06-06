'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getObservation, updateObservation } from '@/lib/offline-storage';
import type { CorrelationAnalysis } from '@/lib/mock-data/vision-analyzer';
import { buildDiagnosticsView } from '@/lib/field/build-diagnostics-view';
import { buildSpecialistReport } from '@/lib/diagnostics/build-specialist-report';
import { Button } from '@/components/ui/button';
import { Zap, Loader2, WifiOff } from 'lucide-react';
import { FieldPageIntro } from '@/components/field/field-page-intro';
import { DiagnosticSpecialistReport } from '@/components/field/diagnostic-specialist-report';
import { parseJsonResponse } from '@/lib/fetch/parse-json-response';
import { useFields } from '@/hooks/use-fields';
import { getFieldById as getMockFieldById } from '@/lib/mock-data/fields';

type SatelliteContext = {
  ndvi: number;
  ndmi: number;
  ndre?: number | null;
  stressPattern?: string;
  source?: string;
  s3Lst?: number | null;
  s1MoistureIndex?: number | null;
};

function DiagnosticsContent() {
  const searchParams = useSearchParams();
  const observationId = searchParams.get('observationId');
  const { getFieldById } = useFields();

  const [loading, setLoading] = useState(!!observationId);
  const [offlineMode, setOfflineMode] = useState(false);
  const [analysis, setAnalysis] = useState<CorrelationAnalysis | null>(null);
  const [satelliteContext, setSatelliteContext] = useState<SatelliteContext | null>(null);
  const [disclaimer, setDisclaimer] = useState('');
  const [fieldId, setFieldId] = useState<string | undefined>();
  const [zoneId, setZoneId] = useState<string | undefined>();
  const [notes, setNotes] = useState<string | undefined>();
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | undefined>();

  useEffect(() => {
    async function runAnalysis() {
      if (!observationId) {
        setLoading(false);
        return;
      }

      const local = await getObservation(observationId);
      if (!local?.imageData) {
        setLoading(false);
        return;
      }

      setFieldId(local.fieldId);
      setZoneId(local.zoneId);
      setNotes(local.notes);
      setCoordinates(local.location);

      const cropForVision =
        getFieldById(local.fieldId)?.crop ?? getMockFieldById(local.fieldId)?.crop;

      const cached = local.visionAnalysis as CorrelationAnalysis | undefined;
      if (cached?.overallHealth) {
        setAnalysis(
          buildDiagnosticsView({
            visionAnalysis: cached,
            crop: cropForVision,
          })
        );
      }

      if (!navigator.onLine) {
        setOfflineMode(true);
        setLoading(false);
        if (!cached?.overallHealth) {
          setDisclaimer(
            'Sin conexión. La foto quedó guardada en el dispositivo. Volvé a abrir esta pantalla cuando tengas red para el análisis con IA.'
          );
        }
        return;
      }

      try {
        const res = await fetch('/api/diagnostics/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            observationId,
            imageData: local.imageData,
            fieldId: local.fieldId,
            zoneId: local.zoneId,
          }),
        });
        const { data } = await parseJsonResponse<{
          visionAnalysis?: CorrelationAnalysis;
          correlation?: {
            summary?: string;
            recommendations?: string[];
          };
          disclaimer?: string;
          satelliteContext?: SatelliteContext;
        }>(res);

        const view = data
          ? buildDiagnosticsView({ ...data, crop: cropForVision })
          : null;
        if (view) {
          setAnalysis(view);
          setDisclaimer(data?.disclaimer ?? '');
          if (data?.satelliteContext) setSatelliteContext(data.satelliteContext);
          await updateObservation(observationId, {
            visionAnalysis: view as unknown as Record<string, unknown>,
          });
        }
      } catch {
        setOfflineMode(true);
        if (!cached?.overallHealth) {
          setDisclaimer(
            'No se pudo contactar al servidor. La observación sigue guardada localmente.'
          );
        }
      } finally {
        setLoading(false);
      }
    }
    void runAnalysis();
  }, [observationId]);

  const field = fieldId ? getFieldById(fieldId) : undefined;
  const zone = field?.zones.find((z) => z.id === zoneId) ?? field?.zones[0];

  const specialistReport = useMemo(() => {
    if (!analysis) return null;
    return buildSpecialistReport(analysis, {
      observationId: observationId ?? undefined,
      fieldName: field?.name ?? 'Lote de campo',
      zoneName: zone?.name ?? 'Zona de manejo',
      crop: field?.crop,
      coordinates,
      notes,
      disclaimer,
      satelliteContext: satelliteContext
        ? {
            ndvi: satelliteContext.ndvi,
            ndmi: satelliteContext.ndmi,
            ndre: satelliteContext.ndre,
            s3Lst: satelliteContext.s3Lst,
            s1MoistureIndex: satelliteContext.s1MoistureIndex,
            stressPattern: satelliteContext.stressPattern,
            source: satelliteContext.source,
          }
        : undefined,
    });
  }, [
    analysis,
    observationId,
    field,
    zone,
    coordinates,
    notes,
    disclaimer,
    satelliteContext,
  ]);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 p-8 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm">Generando informe especialista...</p>
      </div>
    );
  }

  if (!analysis || !specialistReport) {
    return (
      <div className="space-y-4 pb-4">
        <FieldPageIntro
          title={offlineMode ? 'Guardado sin conexión' : 'Sin diagnóstico aún'}
          description={
            offlineMode
              ? disclaimer ||
                'La foto está en el dispositivo. Conectate para analizarla con IA.'
              : 'Capturá una foto del cultivo para obtener un informe fitosanitario profesional.'
          }
        />
        <div className="space-y-4 text-center">
          {offlineMode ? (
            <WifiOff className="mx-auto h-12 w-12 text-health-warning opacity-60" />
          ) : (
            <Zap className="mx-auto h-12 w-12 text-muted-foreground opacity-30" />
          )}
          <Button asChild className="h-11 min-w-[44px]">
            <Link href="/field/capture">Ir a captura</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-2 pt-1">
      {offlineMode && (
        <p className="flex items-start gap-2 rounded-lg border border-health-warning/40 bg-health-warning/10 p-2.5 text-xs text-muted-foreground sm:p-3 sm:text-sm">
          <WifiOff className="mt-0.5 h-4 w-4 shrink-0" />
          Mostrando último análisis guardado en el dispositivo.
        </p>
      )}
      <DiagnosticSpecialistReport report={specialistReport} />
    </div>
  );
}

export default function Diagnostics() {
  return (
    <Suspense
      fallback={
        <div className="p-4 text-center text-sm text-muted-foreground">Cargando...</div>
      }
    >
      <DiagnosticsContent />
    </Suspense>
  );
}
