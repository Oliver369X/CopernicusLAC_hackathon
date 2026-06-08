'use client';

import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Loader2, Satellite } from 'lucide-react';

interface ImportJobStatus {
  job: {
    status: string;
    percent: number;
    zonesDone: number;
    zonesTotal: number;
    error: string | null;
  } | null;
}

export function SatelliteSyncProgressPlain({ poll = true }: { poll?: boolean }) {
  const [data, setData] = useState<ImportJobStatus | null>(null);

  useEffect(() => {
    if (!poll) return;
    let cancelled = false;

    async function load() {
      const res = await fetch('/api/import-jobs/latest');
      const json = (await res.json()) as ImportJobStatus;
      if (!cancelled) setData(json);
    }

    void load();
    const id = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [poll]);

  const job = data?.job;
  if (!job || job.status === 'completed') return null;

  if (job.status === 'failed') {
    return (
      <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        No pudimos traer la foto del satélite. Intentá de nuevo más tarde.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-4 space-y-3">
      <p className="flex items-center gap-2 text-sm font-medium">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <Satellite className="h-4 w-4 text-primary" />
        Esperando la primera foto del satélite
      </p>
      <Progress value={job.percent} className="h-2" />
      <p className="text-xs text-muted-foreground">
        Esto puede tardar unos minutos la primera vez.
      </p>
    </div>
  );
}
