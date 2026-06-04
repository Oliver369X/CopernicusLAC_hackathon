'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageContainer, PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface OpsPayload {
  cronRuns: Array<{ job_name: string; status: string; finished_at: string }>;
  importJobs: Array<{
    org_id: string;
    status: string;
    zones_done: number;
    zones_total: number;
    updated_at: string;
  }>;
  pipeline: Record<string, string> | null;
  satelliteDelayMs?: string;
  error?: string;
}

export default function AdminOpsPage() {
  const [data, setData] = useState<OpsPayload | null>(null);

  useEffect(() => {
    fetch('/api/admin/ops')
      .then(async (r) => {
        const d = (await r.json()) as OpsPayload & { error?: string };
        if (r.status === 403) setData({ ...d, error: 'Forbidden', cronRuns: [], importJobs: [], pipeline: null });
        else setData(d);
      })
      .catch(() => setData({ cronRuns: [], importJobs: [], pipeline: null, error: 'Error' }));
  }, []);

  if (data?.error === 'Forbidden') {
    return (
      <PageContainer>
        <p className="text-sm text-muted-foreground">Acceso restringido (ADMIN_OPS_EMAILS).</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer size="wide">
      <PageHeader
        title="Operaciones"
        description="Cron, import jobs y pipeline — solo administradores."
        actions={
          <Link href="/dashboard" className="text-sm text-primary underline">
            Volver
          </Link>
        }
      />

      {data?.pipeline && (
        <Card className="glass-card mb-4">
          <CardHeader>
            <CardTitle className="text-base">Pipeline global</CardTitle>
          </CardHeader>
          <CardContent className="text-sm grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(data.pipeline).map(([k, v]) => (
              <p key={k}>
                <span className="text-muted-foreground">{k}:</span> {v}
              </p>
            ))}
            <p>
              <span className="text-muted-foreground">delay zona:</span>{' '}
              {data.satelliteDelayMs} ms
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Últimos cron</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2 max-h-80 overflow-y-auto">
            {(data?.cronRuns ?? []).map((r, i) => (
              <p key={`${r.job_name}-${i}`}>
                {r.finished_at} · <strong>{r.job_name}</strong> · {r.status}
              </p>
            ))}
            {!data?.cronRuns?.length && <p className="text-muted-foreground">Sin registros</p>}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Import jobs</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2 max-h-80 overflow-y-auto">
            {(data?.importJobs ?? []).map((j, i) => (
              <p key={i}>
                org {j.org_id.slice(0, 8)}… · {j.status} · {j.zones_done}/{j.zones_total} ·{' '}
                {j.updated_at}
              </p>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
