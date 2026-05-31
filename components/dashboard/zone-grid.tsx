'use client';

import type { FieldZone } from '@/lib/types/field';
import { AlertCircle, TrendingUp } from 'lucide-react';
import { healthLabelEs, type HealthLevel } from '@/lib/design/tokens';

interface ZoneGridProps {
  zones: FieldZone[];
  selectedZone: FieldZone | null;
  onZoneSelect: (zone: FieldZone) => void;
}

const healthColors = {
  excellent: 'border-health-excellent bg-health-excellent/5 hover:bg-health-excellent/10',
  good: 'border-health-good bg-health-good/5 hover:bg-health-good/10',
  warning: 'border-health-warning bg-health-warning/5 hover:bg-health-warning/10',
  critical: 'border-health-critical bg-health-critical/5 hover:bg-health-critical/10',
};

const healthText = {
  excellent: 'text-health-excellent',
  good: 'text-health-good',
  warning: 'text-health-warning',
  critical: 'text-health-critical',
};

export default function ZoneGrid({
  zones,
  selectedZone,
  onZoneSelect,
}: ZoneGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {zones.map((zone) => (
        <button
          type="button"
          key={zone.id}
          onClick={() => onZoneSelect(zone)}
          className={`min-h-[44px] cursor-pointer rounded-lg border-2 p-4 text-left transition-all duration-200 motion-reduce:transition-none ${
            healthColors[zone.health]
          } ${selectedZone?.id === zone.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
        >
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-foreground">{zone.name}</h3>
            {zone.diseaseRisks.length > 0 && (
              <AlertCircle className={`h-4 w-4 flex-shrink-0 ${healthText[zone.health]}`} />
            )}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Salud:</span>
              <span className={`font-medium ${healthText[zone.health]}`}>
                {healthLabelEs[zone.health as HealthLevel]}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">NDVI:</span>
              <span className="font-medium">{zone.ndviAverage.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Moisture:</span>
              <span className="font-medium">
                {zone.soilMoistureAverage.toFixed(0)}%
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Temp:</span>
              <span className="font-medium">{zone.temperatureAverage.toFixed(0)}°C</span>
            </div>
          </div>

          {zone.diseaseRisks.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Risks:</p>
              <div className="flex flex-wrap gap-1">
                {zone.diseaseRisks.map((risk) => (
                  <span
                    key={risk}
                    className="inline-flex items-center gap-1 rounded-full bg-health-warning/20 px-2 py-1 text-xs text-health-warning"
                  >
                    <TrendingUp className="h-3 w-3" />
                    {risk}
                  </span>
                ))}
              </div>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
