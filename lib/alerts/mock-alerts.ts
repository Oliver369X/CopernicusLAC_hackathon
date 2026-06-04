import { alertEngine, type Alert } from '@/lib/alerts/alert-engine';
import { MOCK_FIELDS } from '@/lib/mock-data/fields';

/** Fallback sync for dev without Supabase readings */
export function generateAllAlertsMock(): Alert[] {
  const allAlerts: Alert[] = [];
  for (const field of MOCK_FIELDS) {
    for (const zone of field.zones) {
      allAlerts.push(
        ...alertEngine.checkThresholds(
          field.crop,
          field.id,
          zone.id,
          zone.ndviAverage,
          zone.ndmiAverage,
          zone.temperatureAverage,
          zone.soilMoistureAverage,
          field.daysFromPlanting
        ),
        ...alertEngine.checkAnomalies(
          field.crop,
          field.id,
          zone.id,
          zone.ndviAverage,
          zone.ndviAverage * 0.95,
          0.08
        )
      );
    }
  }
  return allAlerts;
}
