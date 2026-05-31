'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, MapPin, Calendar, ChevronRight, ImageOff } from 'lucide-react';
import { formatDateTimeEs } from '@/lib/i18n/format-date';
import { formatDecimal } from '@/lib/i18n/format-number';
import {
  labelDiseaseName,
  labelObservationSeverity,
  isHealthyDiagnosis,
} from '@/lib/i18n/observation-labels';
import { cn } from '@/lib/utils';

export interface ObservationCardData {
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

function cardTone(diagnosis: ObservationCardData['diagnosis']) {
  if (!diagnosis) return 'border-border/60 bg-muted/10';
  const primary = diagnosis.diseases[0];
  if (isHealthyDiagnosis(primary?.name, primary?.probability)) {
    return 'border-health-excellent/35 bg-health-excellent/5';
  }
  if (diagnosis.severity === 'high') {
    return 'border-health-critical/35 bg-health-critical/5';
  }
  if (diagnosis.severity === 'medium') {
    return 'border-health-warning/35 bg-health-warning/5';
  }
  return 'border-health-good/35 bg-health-good/5';
}

export function ObservationHistoryCard({ obs }: { obs: ObservationCardData }) {
  const [imgError, setImgError] = useState(false);
  const primary = obs.diagnosis?.diseases[0];
  const title = primary ? labelDiseaseName(primary.name) : 'Observación de campo';
  const healthy = isHealthyDiagnosis(primary?.name, primary?.probability);

  return (
    <Link href={`/field/diagnostics?observationId=${obs.id}`} className="block">
      <Card className={cn('glass-card border-l-4', cardTone(obs.diagnosis))}>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="mt-0.5 shrink-0">
              {healthy ? (
                <CheckCircle2 className="h-6 w-6 text-health-excellent" />
              ) : (
                <AlertCircle className="h-6 w-6 text-health-warning" />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-foreground">{title}</h3>
                  {obs.diagnosis && (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Confianza {formatDecimal(obs.diagnosis.confidence, 0)}% · Severidad{' '}
                      {labelObservationSeverity(obs.diagnosis.severity)}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 shrink-0" />
                  {formatDateTimeEs(obs.timestamp)}
                </span>
                {obs.gps && (
                  <span className="inline-flex items-center gap-1.5 tabular-nums">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {formatDecimal(obs.gps.lat, 4)}, {formatDecimal(obs.gps.lng, 4)}
                  </span>
                )}
              </div>

              {obs.imageUrl && !imgError ? (
                <div className="relative mt-2 aspect-[16/9] w-full overflow-hidden rounded-lg bg-muted">
                  <img
                    src={obs.imageUrl}
                    alt={title}
                    className="h-full w-full object-cover"
                    onError={() => setImgError(true)}
                  />
                </div>
              ) : obs.imageUrl && imgError ? (
                <div className="mt-2 flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 rounded-lg bg-muted text-muted-foreground">
                  <ImageOff className="h-8 w-8 opacity-50" />
                  <span className="text-xs">Imagen no disponible</span>
                </div>
              ) : null}

              {obs.notes && (
                <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
                  {obs.notes}
                </p>
              )}

              <p className="text-xs text-muted-foreground">
                {obs.photographerName}
                {obs.source === 'local' && ' · guardado en el dispositivo'}
                {obs.source === 'mock' && ' · demo'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
