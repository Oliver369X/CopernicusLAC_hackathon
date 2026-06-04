'use client';

import { useEffect, useState } from 'react';
import { useFields } from '@/hooks/use-fields';
import { useAnalyticsSummary } from '@/hooks/use-analytics-summary';
import type { InsightsContextPayload } from '@/lib/data/insights-context';

export function useInsightsContext() {
  const { fields, loading: fieldsLoading } = useFields();
  const { summary, loading: summaryLoading } = useAnalyticsSummary();
  const [context, setContext] = useState<InsightsContextPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/insights/context')
      .then((r) => r.json())
      .then((data) => {
        setContext(data as InsightsContextPayload);
        setError(null);
      })
      .catch(() => {
        setError('No se pudo cargar el contexto de insights');
        setContext(null);
      })
      .finally(() => setLoading(false));
  }, []);

  return {
    fields,
    summary,
    context,
    loading: fieldsLoading || summaryLoading || loading,
    error,
    hasSatelliteData: (context?.satelliteZoneCount ?? 0) > 0,
  };
}
