'use client';

import { useState } from 'react';
import type { Alert } from '@/lib/alerts/alert-engine';
import { generateAllAlerts } from '@/lib/alerts/generate-alerts';

export function useRealtimeAlerts() {
  const [alerts] = useState<Alert[]>(() => generateAllAlerts());
  return alerts;
}
