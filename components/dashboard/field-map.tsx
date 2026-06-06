'use client';

import { useMemo } from 'react';
import { Field, FieldZone } from '@/lib/types/field';
import { SatelliteData } from '@/lib/mock-data/satellite-data';
import { healthColors, brandColors, healthLabelEs, zoneHealthMapColors } from '@/lib/design/tokens';
import { formatDecimal } from '@/lib/i18n/format-number';

interface FieldMapProps {
  field: Field;
  satelliteData: SatelliteData;
  satelliteSource?: string;
  selectedZoneId?: string | null;
  onZoneClick?: (zone: FieldZone) => void;
}

export default function FieldMap({
  field,
  satelliteData,
  satelliteSource,
  selectedZoneId,
  onZoneClick,
}: FieldMapProps) {
  // Create SVG representation of the field with satellite data overlay
  const svgContent = useMemo(() => {
    // Handle both old field format and new multi-field format
    const bounds = field.bounds ?? [
      { lat: field.center.lat - 0.01, lng: field.center.lng - 0.01 },
      { lat: field.center.lat + 0.01, lng: field.center.lng - 0.01 },
      { lat: field.center.lat + 0.01, lng: field.center.lng + 0.01 },
      { lat: field.center.lat - 0.01, lng: field.center.lng + 0.01 },
    ];

    // Convert geographic bounds to SVG coordinates
    const minLat = Math.min(
      bounds[0].lat,
      bounds[1].lat,
      bounds[2].lat,
      bounds[3].lat
    );
    const maxLat = Math.max(
      bounds[0].lat,
      bounds[1].lat,
      bounds[2].lat,
      bounds[3].lat
    );
    const minLng = Math.min(
      bounds[0].lng,
      bounds[1].lng,
      bounds[2].lng,
      bounds[3].lng
    );
    const maxLng = Math.max(
      bounds[0].lng,
      bounds[1].lng,
      bounds[2].lng,
      bounds[3].lng
    );

    const width = 600;
    const height = 400;
    const padding = 40;

    const scale = (value: number, min: number, max: number): number => {
      return ((value - min) / (max - min)) * (width - 2 * padding) + padding;
    };

    // Generate heat map for NDVI
    const gridSize = satelliteData.ndvi.length;
    const cellWidth = (width - 2 * padding) / gridSize;
    const cellHeight = (height - 2 * padding) / gridSize;

    const colors = {
      excellent: healthColors.excellent,
      good: healthColors.good,
      warning: healthColors.warning,
      critical: healthColors.critical,
    };

    return {
      width,
      height,
      padding,
      scale,
      cellWidth,
      cellHeight,
      gridSize,
      colors,
      minLat,
      maxLat,
      minLng,
      maxLng,
      ndvi: satelliteData.ndvi,
    };
  }, [field, satelliteData]);

  const getColorForNDVI = (ndvi: number): string => {
    if (ndvi > 0.6) return svgContent.colors.excellent;
    if (ndvi > 0.4) return svgContent.colors.good;
    if (ndvi > 0.2) return svgContent.colors.warning;
    return svgContent.colors.critical;
  };

  return (
    <div className="w-full overflow-auto rounded-lg border border-border bg-muted/30">
      <svg
        width={svgContent.width}
        height={svgContent.height}
        className="w-full h-auto"
        viewBox={`0 0 ${svgContent.width} ${svgContent.height}`}
      >
        {/* Background */}
        <rect
          width={svgContent.width}
          height={svgContent.height}
          fill={brandColors.surfaceElevated}
        />

        {/* NDVI Heat Map Grid */}
        {svgContent.ndvi.map((row, y) =>
          row.map((ndvi, x) => (
            <rect
              key={`cell-${x}-${y}`}
              x={svgContent.padding + x * svgContent.cellWidth}
              y={svgContent.padding + y * svgContent.cellHeight}
              width={svgContent.cellWidth}
              height={svgContent.cellHeight}
              fill={getColorForNDVI(ndvi)}
              opacity={0.7}
              stroke="none"
            />
          ))
        )}

        {/* Field Zones */}
        {field.zones && field.zones.map((zone) => {
          // Handle both old and new zone format
          const zoneBounds = zone.bounds ?? [
            { lat: field.center.lat - 0.005, lng: field.center.lng - 0.005 },
            { lat: field.center.lat + 0.005, lng: field.center.lng - 0.005 },
            { lat: field.center.lat + 0.005, lng: field.center.lng + 0.005 },
            { lat: field.center.lat - 0.005, lng: field.center.lng + 0.005 },
          ];

          const points = zoneBounds.map(
            (p) =>
              `${svgContent.scale(
                p.lng,
                svgContent.minLng,
                svgContent.maxLng
              )},${svgContent.scale(p.lat, svgContent.minLat, svgContent.maxLat)}`
          );

          const strokeColor = zoneHealthMapColors[zone.health];
          const selected = zone.id === selectedZoneId;

          return (
            <g
              key={zone.id}
              className={onZoneClick ? 'cursor-pointer' : undefined}
              onClick={() => onZoneClick?.(zone)}
              role={onZoneClick ? 'button' : undefined}
              tabIndex={onZoneClick ? 0 : undefined}
              onKeyDown={(e) => {
                if (onZoneClick && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onZoneClick(zone);
                }
              }}
            >
              <title>
                {zone.name} · {formatDecimal(zone.area)} ha ·{' '}
                {healthLabelEs[zone.health]}
              </title>
              <polygon
                points={points.join(' ')}
                fill={strokeColor}
                fillOpacity={selected ? 0.25 : 0.1}
                stroke={strokeColor}
                strokeWidth={selected ? 3 : 2}
                opacity={0.9}
              />
              <text
                x={svgContent.scale(
                  (zoneBounds[0].lng + zoneBounds[2].lng) / 2,
                  svgContent.minLng,
                  svgContent.maxLng
                )}
                y={svgContent.scale(
                  (zoneBounds[0].lat + zoneBounds[2].lat) / 2,
                  svgContent.minLat,
                  svgContent.maxLat
                )}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="14"
                fontWeight="bold"
                fill={brandColors.foregroundMuted}
                className="pointer-events-none"
              >
                {zone.name}
              </text>
            </g>
          );
        })}

        {/* Legend */}
        <g>
          <rect
            x={svgContent.padding}
            y={svgContent.height - 60}
            width={150}
            height={45}
            fill={brandColors.oceanDeep}
            stroke={brandColors.border}
            rx="4"
          />
          <text
            x={svgContent.padding + 8}
            y={svgContent.height - 42}
            fontSize="12"
            fontWeight="bold"
            fill={brandColors.foregroundMuted}
          >
            Salud NDVI:
          </text>
          {[
            { label: healthLabelEs.excellent, color: svgContent.colors.excellent },
            { label: healthLabelEs.good, color: svgContent.colors.good },
            { label: healthLabelEs.warning, color: svgContent.colors.warning },
            { label: healthLabelEs.critical, color: svgContent.colors.critical },
          ].map((item, i) => (
            <g key={item.label}>
              <rect
                x={svgContent.padding + 8 + (i % 2) * 75}
                y={svgContent.height - 32 + (i > 1 ? 14 : 0)}
                width={8}
                height={8}
                fill={item.color}
                opacity={0.7}
              />
              <text
                x={svgContent.padding + 20 + (i % 2) * 75}
                y={svgContent.height - 25 + (i > 1 ? 14 : 0)}
                fontSize="11"
                fill={brandColors.mistSlate}
              >
                {item.label}
              </text>
            </g>
          ))}
        </g>

        {/* Metadata */}
        <text
          x={svgContent.width - svgContent.padding}
          y={svgContent.padding + 16}
          textAnchor="end"
          fontSize="12"
          fill={brandColors.mistSlate}
        >
          {new Date(satelliteData.timestamp).toLocaleDateString()}
        </text>
        <text
          x={svgContent.width - svgContent.padding}
          y={svgContent.padding + 32}
          textAnchor="end"
          fontSize="12"
          fill={brandColors.mistSlate}
        >
          Nubes: {Number.isFinite(satelliteData.cloudCover) ? satelliteData.cloudCover.toFixed(0) : '—'}%
        </text>
        <text
          x={svgContent.width - svgContent.padding}
          y={svgContent.padding + 48}
          textAnchor="end"
          fontSize="12"
          fill={brandColors.mistSlate}
        >
          {satelliteData.isRealGrid
            ? 'Grilla Copernicus S2'
            : satelliteData.gridPending || satelliteSource === 'copernicus'
              ? 'Métricas Copernicus · grilla pendiente'
              : 'Grilla sintética'}
        </text>
      </svg>
    </div>
  );
}
