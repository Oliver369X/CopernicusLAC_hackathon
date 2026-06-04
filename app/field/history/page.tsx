'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllObservations as getMockObservations } from '@/lib/mock-data/crop-data';
import { getAllObservations, type StoredObservation } from '@/lib/offline-storage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Loader2 } from 'lucide-react';
import { FieldPageIntro } from '@/components/field/field-page-intro';
import {
  ObservationHistoryCard,
  type ObservationCardData,
} from '@/components/field/observation-history-card';
import { parseJsonResponse } from '@/lib/fetch/parse-json-response';
import { normalizeDiagnosis } from '@/lib/field/normalize-diagnosis';

function mapStored(obs: StoredObservation): ObservationCardData {
  const vision = obs.visionAnalysis as ObservationCardData['diagnosis'] | undefined;
  return {
    id: obs.id,
    timestamp: obs.timestamp,
    notes: obs.notes,
    imageUrl: obs.imageData,
    gps: obs.location,
    diagnosis: vision,
    photographerName: 'Tú',
    source: 'local',
  };
}

export default function History() {
  const [observations, setObservations] = useState<ObservationCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const local = await getAllObservations();
      let apiObs: ObservationCardData[] = [];

      try {
        const res = await fetch('/api/observations');
        const { data } = await parseJsonResponse<{ observations?: Record<string, unknown>[] }>(
          res
        );
        apiObs = (data?.observations ?? []).map((obs) => ({
          id: String(obs.id),
          timestamp: new Date(String(obs.created_at)).getTime(),
          notes: String(obs.notes ?? ''),
          imageUrl: obs.image_path ? `/api/observations/${obs.id}/image` : undefined,
          gps:
            obs.lat != null && obs.lng != null
              ? { lat: Number(obs.lat), lng: Number(obs.lng) }
              : undefined,
          diagnosis: normalizeDiagnosis(obs.vision_result),
          photographerName: 'Usuario de campo',
          source: 'api' as const,
        }));
      } catch {
        // sin red: solo local + demo
      }

      const mock = getMockObservations().map((obs) => ({
        id: obs.id,
        timestamp: new Date(obs.timestamp).getTime(),
        notes: obs.notes ?? '',
        imageUrl: obs.imageUrl,
        gps: obs.gps,
        diagnosis: obs.diagnosis
          ? {
              diseases: obs.diagnosis.diseases.map((d) => ({
                name: d.name,
                probability: d.probability,
              })),
              confidence: obs.diagnosis.confidence,
              severity: obs.diagnosis.severity,
            }
          : undefined,
        photographerName: obs.photographerName,
        source: 'mock' as const,
      }));

      const merged = [...local.map(mapStored), ...apiObs, ...mock].sort(
        (a, b) => b.timestamp - a.timestamp
      );
      setObservations(merged);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        Cargando historial...
      </div>
    );
  }

  const countLabel = `${observations.length} observación${observations.length !== 1 ? 'es' : ''}`;

  return (
    <div className="space-y-4 pb-4">
      <FieldPageIntro
        title="Tus registros"
        description={`${countLabel} en campo y laboratorio. Tocá una tarjeta para ver el diagnóstico.`}
      />

      <div className="space-y-3 px-4">
        {observations.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-8 text-center">
              <Camera className="mx-auto mb-3 h-10 w-10 text-muted-foreground opacity-40" />
              <p className="text-sm text-muted-foreground">
                Aún no hay observaciones. Empezá tomando una foto del cultivo.
              </p>
              <Button asChild className="mt-4 h-11">
                <Link href="/field/capture">Capturar foto</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          observations.map((obs) => <ObservationHistoryCard key={obs.id} obs={obs} />)
        )}
      </div>
    </div>
  );
}
