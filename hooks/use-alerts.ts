'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import type { Alert } from '@/lib/alerts/alert-engine';
import { generateAllAlerts } from '@/lib/alerts/generate-alerts';
import { parseJsonResponse } from '@/lib/fetch/parse-json-response';

function dedupeAlerts(alerts: Alert[]): Alert[] {
  const seen = new Map<string, Alert>();
  for (const alert of alerts) {
    if (!seen.has(alert.id)) {
      seen.set(alert.id, alert);
    }
  }
  return Array.from(seen.values());
}

function mapApiAlert(raw: Record<string, unknown>): Alert {
  return {
    id: String(raw.id),
    fieldId: String(raw.fieldId ?? raw.field_id ?? ''),
    cropType: 'soybean',
    zoneId: String(raw.zoneId ?? raw.zone_id ?? ''),
    type: raw.type as Alert['type'],
    severity: raw.severity as Alert['severity'],
    title: String(raw.title),
    description: String(raw.description),
    recommendation: String(raw.recommendation),
    timestamp: new Date(String(raw.timestamp ?? raw.created_at)),
    metrics: (raw.metrics as Alert['metrics']) ?? {},
    actionsTaken: [],
    readBy: [],
    resolved: Boolean(raw.resolved),
    resolvedAt: raw.resolved ? new Date() : undefined,
  };
}

export function useAlerts() {
  const [baseAlerts, setBaseAlerts] = useState<Alert[]>(() =>
    dedupeAlerts(generateAllAlerts())
  );
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());
  const [source, setSource] = useState<'engine' | 'database'>('engine');

  useEffect(() => {
    fetch('/api/alerts')
      .then((r) =>
        parseJsonResponse<{ alerts?: Record<string, unknown>[]; source?: string }>(r)
      )
      .then(({ data }) => {
        if (data?.alerts?.length) {
          setBaseAlerts(dedupeAlerts(data.alerts.map(mapApiAlert)));
          setSource(data.source === 'database' ? 'database' : 'engine');
        }
      })
      .catch(() => undefined);
  }, []);

  const alerts = useMemo(
    () =>
      baseAlerts.map((alert) =>
        resolvedIds.has(alert.id)
          ? { ...alert, resolved: true, resolvedAt: new Date() }
          : alert
      ),
    [baseAlerts, resolvedIds]
  );

  const stats = useMemo(() => {
    const unresolved = alerts.filter((a) => !a.resolved);
    const critical = unresolved.filter((a) => a.severity === 'critical');
    return {
      total: alerts.length,
      unresolved: unresolved.length,
      critical: critical.length,
    };
  }, [alerts]);

  const resolveAlert = useCallback(async (id: string) => {
    setResolvedIds((prev) => new Set(prev).add(id));
    await fetch('/api/alerts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, resolved: true }),
    }).catch(() => undefined);
  }, []);

  return { alerts, stats, resolveAlert, source };
}

export type { Alert };
