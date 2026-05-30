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
        id: `ndvi-${Date.now()}`,
        fieldId,
        cropType,
        zoneId,
        type: 'threshold',
        severity: 'critical',
        title: 'Low NDVI Detected',
        description: `Zone NDVI is ${ndvi.toFixed(2)}, below healthy range [${cropProfile.ndviRange[0]}, ${cropProfile.ndviRange[1]}]`,
        recommendation: 'Check for nutrient deficiency, water stress, or disease. Consider fertilizer application.',
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
        id: `ndmi-${Date.now()}`,
        fieldId,
        cropType,
        zoneId,
        type: 'threshold',
        severity: 'warning',
        title: 'Water Stress Detected',
        description: `NDMI (moisture index) is ${ndmi.toFixed(2)} - crop shows signs of water stress`,
        recommendation: 'Increase irrigation or monitor rainfall. Consider anti-transpirant spray.',
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
        id: `moisture-${Date.now()}`,
        fieldId,
        cropType,
        zoneId,
        type: 'threshold',
        severity: currentStage?.waterNeeds === 'high' ? 'critical' : 'warning',
        title: 'Low Soil Moisture',
        description: `Soil moisture ${soilMoisture.toFixed(0)}% is below optimal range for ${currentStage?.stage || 'growth'}`,
        recommendation: 'Initiate irrigation immediately',
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
          id: `temp-${Date.now()}`,
          fieldId,
          cropType,
          zoneId,
          type: 'threshold',
          severity: temperature > 35 || temperature < 5 ? 'critical' : 'warning',
          title: 'Temperature Outside Optimal Range',
          description: `Current temperature ${temperature.toFixed(1)}°C is outside optimal range for ${currentStage.stage}`,
          recommendation: 'Monitor crop for heat/cold stress. Consider protective measures if extreme.',
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
          id: `trend-${Date.now()}`,
          fieldId,
          cropType,
          zoneId,
          type: 'predictive',
          severity: 'warning',
          title: 'Declining Plant Health Trend',
          description: `NDVI trend shows decline of ${Math.abs(trend).toFixed(3)} over last 3 observations`,
          recommendation: 'Investigate root cause: disease, pest, water stress, or nutrient deficiency',
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
        id: `fungal-${Date.now()}`,
        fieldId,
        cropType,
        zoneId,
        type: 'predictive',
        severity: 'warning',
        title: 'High Fungal Disease Risk',
        description: `Conditions favor fungal development: High moisture (${soilMoisture}%), optimal temp (${temperature}°C)`,
        recommendation: 'Apply preventive fungicide. Improve air circulation. Monitor leaves closely.',
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
        id: `pest-${Date.now()}`,
        fieldId,
        cropType,
        zoneId,
        type: 'pest',
        severity: 'info',
        title: 'Pest Activity Predicted',
        description: 'Weather conditions favor pest multiplication (warm + humid)',
        recommendation: 'Scout field for insects. Consider preventive spray if pest pressure detected.',
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
        id: `anomaly-${Date.now()}`,
        fieldId,
        cropType,
        zoneId,
        type: 'anomaly',
        severity: ndvi < historicalAverage ? 'warning' : 'info',
        title: 'Anomalous NDVI Value Detected',
        description: `Current NDVI (${ndvi.toFixed(2)}) deviates significantly from zone average (${historicalAverage.toFixed(2)})`,
        recommendation: 'Verify sensor calibration or visual inspect zone for localized issues',
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
          id: `disease-${Date.now()}`,
          fieldId,
          cropType,
          zoneId,
          type: 'disease',
          severity: disease.transmissionRisk === 'high' ? 'critical' : 'warning',
          title: `${disease.disease} Detected`,
          description: disease.description,
          recommendation: `Apply recommended control measures: ${disease.controlMeasures.join(', ')}`,
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
