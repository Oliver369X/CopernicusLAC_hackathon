'use client';

import { useCallback, useEffect, useState } from 'react';
import { useOrgBilling } from '@/hooks/use-org-billing';
import {
  canAccessTechnicalMode,
  isPlainExperience,
  TECHNICAL_MODE_STORAGE_KEY,
} from '@/lib/navigation/experience';

export function usePlainExperience() {
  const { billing, loading: billingLoading } = useOrgBilling();
  const [technicalMode, setTechnicalModeState] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const canToggleTechnical = canAccessTechnicalMode(billing);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(TECHNICAL_MODE_STORAGE_KEY);
    setTechnicalModeState(stored === '1');
    setHydrated(true);
  }, []);

  const setTechnicalMode = useCallback(
    (enabled: boolean) => {
      if (!canAccessTechnicalMode(billing)) return;
      setTechnicalModeState(enabled);
      if (typeof window !== 'undefined') {
        localStorage.setItem(TECHNICAL_MODE_STORAGE_KEY, enabled ? '1' : '0');
      }
    },
    [billing]
  );

  const plain = isPlainExperience(billing, technicalMode);
  const loading = billingLoading || !hydrated;

  return {
    plain,
    technicalMode: canToggleTechnical && technicalMode,
    setTechnicalMode,
    canToggleTechnical,
    billing,
    loading,
  };
}
