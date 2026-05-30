'use client';

import { useEffect, useState } from 'react';
import type { AnalyticsSummary } from '@/lib/data/analytics-from-db';

export function useAnalyticsSummary() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/summary')
      .then((r) => r.json())
      .then((data) => setSummary(data as AnalyticsSummary))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, []);

  return { summary, loading };
}
