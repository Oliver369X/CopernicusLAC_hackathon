import { generateAllAlertsMock } from '@/lib/cron/jobs';
import type { Alert } from './alert-engine';

/** @deprecated Use generateAlertsFromDb via lib/cron/jobs */
export function generateAllAlerts(): Alert[] {
  return generateAllAlertsMock();
}
