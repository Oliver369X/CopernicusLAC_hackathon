'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllObservations as getMockObservations } from '@/lib/mock-data/crop-data';
import { getAllObservations, type StoredObservation } from '@/lib/offline-storage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, MapPin, Calendar, ChevronRight } from 'lucide-react';

interface DisplayObservation {
  id: string;
  timestamp: number;
  notes: string;
  imageUrl?: string;
  gps?: { lat: number; lng: number };
  diagnosis?: {
    diseases: Array<{ name: string; probability: number }>;
    confidence: number;
    severity: string;
  };
  photographerName: string;
  source: 'local' | 'mock' | 'api';
}

function mapStored(obs: StoredObservation): DisplayObservation {
  const vision = obs.visionAnalysis as DisplayObservation['diagnosis'] | undefined;
  return {
    id: obs.id,
    timestamp: obs.timestamp,
    notes: obs.notes,
    imageUrl: obs.imageData,
    gps: obs.location,
    diagnosis: vision,
    photographerName: 'You',
    source: 'local',
  };
}

export default function History() {
  const [observations, setObservations] = useState<DisplayObservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const local = await getAllObservations();
      let apiObs: DisplayObservation[] = [];

      try {
        const res = await fetch('/api/observations');
        const data = await res.json();
        apiObs = (data.observations ?? []).map(
          (obs: Record<string, unknown>) => ({
            id: String(obs.id),
            timestamp: new Date(String(obs.created_at)).getTime(),
            notes: String(obs.notes ?? ''),
            imageUrl: obs.image_path
              ? `/api/observations/${obs.id}/image`
              : undefined,
            gps:
              obs.lat != null && obs.lng != null
                ? { lat: Number(obs.lat), lng: Number(obs.lng) }
                : undefined,
            diagnosis: obs.vision_result as DisplayObservation['diagnosis'],
            photographerName: 'Field user',
            source: 'api' as const,
          })
        );
      } catch {
        // offline — solo local
      }

      const mock = getMockObservations().map((obs) => ({
        id: obs.id,
        timestamp: new Date(obs.timestamp).getTime(),
        notes: obs.notes ?? '',
        imageUrl: obs.imageUrl,
        gps: obs.gps,
        diagnosis: obs.diagnosis,
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

  const getStatusIcon = (diagnosis: DisplayObservation['diagnosis']) => {
    if (!diagnosis) return null;
    const primary = diagnosis.diseases[0];
    if (primary.name === 'Healthy' || primary.probability < 50) {
      return <CheckCircle2 className="h-5 w-5 text-health-excellent" />;
    }
    return <AlertCircle className="h-5 w-5 text-health-warning" />;
  };

  const getStatusColor = (diagnosis: DisplayObservation['diagnosis']) => {
    if (!diagnosis) return 'border-border bg-muted/30';
    const primary = diagnosis.diseases[0];
    if (primary.name === 'Healthy' || primary.probability < 50) {
      return 'border-health-excellent/30 bg-health-excellent/5';
    }
    if (diagnosis.severity === 'high') {
      return 'border-health-critical/30 bg-health-critical/5';
    }
    if (diagnosis.severity === 'medium') {
      return 'border-health-warning/30 bg-health-warning/5';
    }
    return 'border-health-good/30 bg-health-good/5';
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">Loading...</div>
    );
  }

  return (
    <div className="p-4 space-y-3 pb-4">
      <div className="space-y-1 mb-4">
        <h2 className="text-xl font-bold text-foreground">Observation History</h2>
        <p className="text-xs text-muted-foreground">
          {observations.length} observations recorded
        </p>
      </div>

      {observations.length === 0 ? (
        <Card>
          <CardContent className="pt-6 pb-6 text-center">
            <p className="text-sm text-muted-foreground">
              No observations yet. Start by taking a photo!
            </p>
            <Button asChild className="mt-4">
              <Link href="/field/capture">Capture Photo</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {observations.map((obs) => (
            <Link key={obs.id} href={`/field/diagnostics?observationId=${obs.id}`}>
              <Card className={`border-2 ${getStatusColor(obs.diagnosis)}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getStatusIcon(obs.diagnosis) || (
                        <div className="h-5 w-5 rounded-full border-2 border-border" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground text-sm">
                            {obs.diagnosis?.diseases[0]?.name ?? 'Observation'}
                          </h3>
                          {obs.diagnosis && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Confidence: {obs.diagnosis.confidence}%
                            </p>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          {new Date(obs.timestamp).toLocaleString()}
                        </div>
                        {obs.gps && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            {obs.gps.lat.toFixed(4)}, {obs.gps.lng.toFixed(4)}
                          </div>
                        )}
                      </div>
                      {obs.imageUrl && (
                        <div className="mt-3 rounded-md overflow-hidden h-20 bg-muted">
                          <img
                            src={obs.imageUrl}
                            alt={`Observation ${obs.id}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      {obs.notes && (
                        <p className="mt-2 text-xs text-muted-foreground italic line-clamp-2">
                          {obs.notes}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-muted-foreground">
                        by {obs.photographerName}
                        {obs.source === 'local' && ' · saved locally'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
