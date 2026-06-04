'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SatelliteSyncProgress } from '@/components/onboarding/satellite-sync-progress';
import { AlertTriangle, MapPin } from 'lucide-react';
import type { Alert } from '@/lib/alerts/alert-engine';

interface PipelineStats {
  zonesTotal: number;
  zonesWithSatellite: number;
}

export function PilotOverviewCard({ alerts }: { alerts: Alert[] }) {
  const [pipeline, setPipeline] = useState<PipelineStats | null>(null);

  useEffect(() => {
    fetch('/api/health/data-pipeline')
      .then((r) => r.json())
      .then((d: PipelineStats) => setPipeline(d))
      .catch(() => undefined);
  }, []);

  const syncPct =
    pipeline && pipeline.zonesTotal > 0
      ? Math.round((pipeline.zonesWithSatellite / pipeline.zonesTotal) * 100)
      : null;

  const critical = alerts.filter((a) => !a.resolved && a.severity === 'critical').slice(0, 3);
  const topZones = alerts
    .filter((a) => !a.resolved && a.zoneId)
    .slice(0, 3);

  return (
    <Card className="glass-card border-primary/20">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          Vista piloto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <SatelliteSyncProgress />
        {syncPct !== null && (
          <p>
            Cobertura satélite: <strong>{syncPct}%</strong> ({pipeline?.zonesWithSatellite}/
            {pipeline?.zonesTotal} zonas)
          </p>
        )}
        {critical.length > 0 && (
          <div>
            <p className="font-medium flex items-center gap-1 text-destructive">
              <AlertTriangle className="h-3.5 w-3.5" />
              Alertas críticas ({critical.length})
            </p>
            <ul className="mt-1 space-y-1 text-muted-foreground">
              {critical.map((a) => (
                <li key={a.id}>{a.title}</li>
              ))}
            </ul>
          </div>
        )}
        {topZones.length > 0 && (
          <div>
            <p className="font-medium">Zonas a revisar</p>
            <ul className="mt-1 space-y-1">
              {topZones.map((a) => (
                <li key={a.id}>
                  <Link
                    href={a.zoneId ? `/monitor?field=${a.fieldId}` : '/monitor'}
                    className="text-primary underline"
                  >
                    {a.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        <Button size="sm" variant="outline" asChild>
          <Link href="/monitor">Abrir monitor</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
