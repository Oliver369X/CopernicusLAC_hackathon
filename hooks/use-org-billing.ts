'use client';

import { useCallback, useEffect, useState } from 'react';
import type { OrgBillingProfile, OrgStatusResponse } from '@/lib/billing/types';
import { parseJsonResponse } from '@/lib/fetch/parse-json-response';

export function useOrgBilling() {
  const [billing, setBilling] = useState<OrgBillingProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/org/status');
      const { data, error: fetchError } = await parseJsonResponse<OrgStatusResponse>(res);
      if (fetchError && !data) {
        setError(fetchError);
        setBilling(null);
        return;
      }
      setBilling(data?.billing ?? null);
    } catch {
      setError('No se pudo cargar el plan');
      setBilling(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { billing, loading, error, refresh };
}
