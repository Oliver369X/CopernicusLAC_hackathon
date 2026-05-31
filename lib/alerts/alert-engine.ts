import { CropType, getCropProfile, getCropDiseases, getCropGrowthStage } from '@/lib/mock-data/crops';

export type AlertType =
  | 'threshold'
  | 'predictive'
  | 'anomaly'
  | 'disease'
  | 'weather'
  | 'pest'
  | 'fire_proximity'
  | 'hotspot_stress'
  | 'climate_viability';
export type AlertChannel = 'in-app' | 'email' | 'sms' | 'push';
export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface Alert {
  id: string;
  fieldId: string;
  cropType: CropType;
  zoneId: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  recommendation: string;
  timestamp: Date;
  metrics: {
    ndvi?: number;
    ndmi?: number;
    temperature?: number;
    soilMoisture?: number;
    [key: string]: number | undefined;
  };
  actionsTaken: string[];
  readBy: string[];
  resolved: boolean;
  resolvedAt?: Date;
}

export interface AlertConfig {
  enabled: boolean;
  channels: AlertChannel[];
  severity: AlertSeverity;
  cooldown: number; // minutes
}

export interface AlertSettings {
  threshold: AlertConfig;
  predictive: AlertConfig;
  anomaly: AlertConfig;
  disease: AlertConfig;
  weather: AlertConfig;
  pest: AlertConfig;
}

/** ID estable por tipo + campo + zona (evita colisiones con Date.now()). */
export function createAlertId(
  prefix: string,
  fieldId: string,
  zoneId: string,
  suffix?: string
): string {
  const base = `${prefix}-${fieldId}-${zoneId}`;
  return suffix ? `${base}-${suffix}` : base;
}

export class AlertEngine {
  private fieldAlerts: Map<string, Alert[]> = new Map();
  private alertHistory: Alert[] = [];

  // Threshold-based alerts
  checkThresholds(
    cropType: CropType,
    fieldId: string,
    zoneId: string,
    ndvi: number,
    ndmi: number,
    temperature: number,
    soilMoisture: number,
    daysFromPlanting: number
  ): Alert[] {
    const alerts: Alert[] = [];
    const cropProfile = getCropProfile(cropType);
    const currentStage = getCropGrowthStage(cropType, daysFromPlanting);

    // NDVI check
    if (ndvi < cropProfile.ndviRange[0]) {
      alerts.push({
        id: createAlertId('ndvi', fieldId, zoneId),
        fieldId,
        cropType,
        zoneId,
        type: 'threshold',
        severity: 'critical',
        title: 'NDVI bajo detectado',
        description: `NDVI de la zona es ${ndvi.toFixed(2)}, por debajo del rango saludable [${cropProfile.ndviRange[0]}, ${cropProfile.ndviRange[1]}]`,
        recommendation: 'Revisar deficiencia nutricional, estrés hídrico o enfermedad. Valorar fertilización.',
        timestamp: new Date(),
        metrics: { ndvi, ndmi, temperature, soilMoisture },
        actionsTaken: [],
        readBy: [],
        resolved: false,
      });
    }

    // NDMI check (moisture)
    if (ndmi < 0.3) {
      alerts.push({
        id: createAlertId('ndmi', fieldId, zoneId),
        fieldId,
        cropType,
        zoneId,
        type: 'threshold',
        severity: 'warning',
        title: 'Estrés hídrico detectado',
        description: `NDMI (índice de humedad) es ${ndmi.toFixed(2)} — el cultivo muestra signos de estrés hídrico`,
        recommendation: 'Aumentar riego o monitorear lluvias. Valorar antitranspirante.',
        timestamp: new Date(),
        metrics: { ndvi, ndmi, temperature, soilMoisture },
        actionsTaken: [],
        readBy: [],
        resolved: false,
      });
    }

    // Soil moisture check
    const optimalMoisture = currentStage?.waterNeeds === 'high' ? [60, 80] : [50, 70];
    if (soilMoisture < optimalMoisture[0]) {
      alerts.push({
        id: createAlertId('moisture', fieldId, zoneId),
        fieldId,
        cropType,
        zoneId,
        type: 'threshold',
        severity: currentStage?.waterNeeds === 'high' ? 'critical' : 'warning',
        title: 'Humedad de suelo baja',
        description: `Humedad del suelo ${soilMoisture.toFixed(0)}% está por debajo del óptimo para ${currentStage?.stage || 'crecimiento'}`,
        recommendation: 'Iniciar riego de inmediato',
        timestamp: new Date(),
        metrics: { ndvi, ndmi, temperature, soilMoisture },
        actionsTaken: [],
        readBy: [],
        resolved: false,
      });
    }

    // Temperature check
    if (currentStage) {
      const [minTemp, maxTemp] = currentStage.waterNeeds === 'high' ? [18, 30] : [10, 35];
      if (temperature < minTemp || temperature > maxTemp) {
        alerts.push({
          id: createAlertId('temp', fieldId, zoneId),
          fieldId,
          cropType,
          zoneId,
          type: 'threshold',
          severity: temperature > 35 || temperature < 5 ? 'critical' : 'warning',
          title: 'Temperatura fuera de rango óptimo',
          description: `Temperatura actual ${temperature.toFixed(1)}°C fuera del rango óptimo para ${currentStage.stage}`,
          recommendation: 'Monitorear estrés por calor/frío. Valorar medidas de protección si es extremo.',
          timestamp: new Date(),
          metrics: { ndvi, ndmi, temperature, soilMoisture },
          actionsTaken: [],
          readBy: [],
          resolved: false,
        });
      }
    }

    return alerts;
  }

  // Predictive alerts based on patterns
  checkPredictiveRisks(
    cropType: CropType,
    fieldId: string,
    zoneId: string,
    historicalNdvi: number[],
    temperature: number,
    soilMoisture: number
  ): Alert[] {
    const alerts: Alert[] = [];
    const cropProfile = getCropProfile(cropType);

    // NDVI trend - detect decline
    if (historicalNdvi.length >= 3) {
      const recent = historicalNdvi.slice(-3);
      const trend = recent[2] - recent[0];

      if (trend < -0.1) {
        alerts.push({
          id: createAlertId('trend', fieldId, zoneId),
          fieldId,
          cropType,
          zoneId,
          type: 'predictive',
          severity: 'warning',
          title: 'Tendencia de salud en descenso',
          description: `NDVI bajó ${Math.abs(trend).toFixed(3)} en las últimas 3 observaciones`,
          recommendation: 'Investigar causa: enfermedad, plaga, estrés hídrico o deficiencia nutricional',
          timestamp: new Date(),
          metrics: { ndvi: recent[2] },
          actionsTaken: [],
          readBy: [],
          resolved: false,
        });
      }
    }

    // Fungal disease risk (high humidity + warm temp)
    if (soilMoisture > 80 && temperature > 20 && temperature < 28) {
      alerts.push({
        id: createAlertId('fungal', fieldId, zoneId),
        fieldId,
        cropType,
        zoneId,
        type: 'predictive',
        severity: 'warning',
        title: 'Alto riesgo de enfermedad fúngica',
        description: `Condiciones favorables: humedad alta (${soilMoisture}%), temperatura óptima (${temperature}°C)`,
        recommendation: 'Aplicar fungicida preventivo. Mejorar circulación de aire. Monitorear hojas.',
        timestamp: new Date(),
        metrics: { temperature, soilMoisture },
        actionsTaken: [],
        readBy: [],
        resolved: false,
      });
    }

    // Pest activity risk
    if (temperature > 25 && temperature < 32 && soilMoisture > 60) {
      alerts.push({
        id: createAlertId('pest', fieldId, zoneId),
        fieldId,
        cropType,
        zoneId,
        type: 'pest',
        severity: 'info',
        title: 'Actividad de plagas prevista',
        description: 'Clima favorable a multiplicación de plagas (cálido y húmedo)',
        recommendation: 'Relevar el campo. Valorar aplicación preventiva si hay presión de plagas.',
        timestamp: new Date(),
        metrics: { temperature, soilMoisture },
        actionsTaken: [],
        readBy: [],
        resolved: false,
      });
    }

    return alerts;
  }

  // Anomaly detection
  checkAnomalies(
    cropType: CropType,
    fieldId: string,
    zoneId: string,
    ndvi: number,
    historicalAverage: number,
    historicalStdDev: number
  ): Alert[] {
    const alerts: Alert[] = [];

    // More than 2 std devs from mean = anomaly
    const zScore = Math.abs((ndvi - historicalAverage) / (historicalStdDev || 0.1));

    if (zScore > 2) {
      alerts.push({
        id: createAlertId('anomaly', fieldId, zoneId),
        fieldId,
        cropType,
        zoneId,
        type: 'anomaly',
        severity: ndvi < historicalAverage ? 'warning' : 'info',
        title: 'Valor anómalo de NDVI',
        description: `NDVI actual (${ndvi.toFixed(2)}) se desvía del promedio de zona (${historicalAverage.toFixed(2)})`,
        recommendation: 'Verificar calibración o inspección visual de la zona',
        timestamp: new Date(),
        metrics: { ndvi },
        actionsTaken: [],
        readBy: [],
        resolved: false,
      });
    }

    return alerts;
  }

  // Disease-specific alerts
  checkDiseases(
    cropType: CropType,
    fieldId: string,
    zoneId: string,
    detectedDisease: string,
    confidence: number
  ): Alert[] {
    const alerts: Alert[] = [];

    if (confidence > 0.6) {
      const diseases = getCropDiseases(cropType);
      const disease = diseases.find((d) => d.disease === detectedDisease);

      if (disease) {
        alerts.push({
          id: createAlertId('disease', fieldId, zoneId, detectedDisease),
          fieldId,
          cropType,
          zoneId,
          type: 'disease',
          severity: disease.transmissionRisk === 'high' ? 'critical' : 'warning',
          title: `${disease.disease} detectada`,
          description: disease.description,
          recommendation: `Medidas de control: ${disease.controlMeasures.join(', ')}`,
          timestamp: new Date(),
          metrics: {},
          actionsTaken: [],
          readBy: [],
          resolved: false,
        });
      }
    }

    return alerts;
  }

  // Generate alert digest
  generateAlertDigest(alerts: Alert[]): string {
    const critical = alerts.filter((a) => a.severity === 'critical');
    const warning = alerts.filter((a) => a.severity === 'warning');

    let digest = '📋 Alert Digest\n\n';

    if (critical.length > 0) {
      digest += `🔴 CRITICAL (${critical.length}):\n`;
      critical.forEach((a) => {
        digest += `• ${a.title}: ${a.description}\n`;
      });
      digest += '\n';
    }

    if (warning.length > 0) {
      digest += `🟡 WARNING (${warning.length}):\n`;
      warning.forEach((a) => {
        digest += `• ${a.title}\n`;
      });
    }

    return digest;
  }
}

export const alertEngine = new AlertEngine();
