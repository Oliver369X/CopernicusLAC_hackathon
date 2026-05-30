'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Field } from '@/lib/types/field';
import { boundsToBbox } from '@/lib/services/copernicus/bounds';

import 'leaflet/dist/leaflet.css';

type MapLayer = 'ndvi' | 'ndre' | 'truecolor';

interface SatelliteMapProps {
  field: Field;
  layer?: MapLayer;
}

function FitBounds({ field }: { field: Field }) {
  const map = useMap();

  useEffect(() => {
    const [west, south, east, north] = boundsToBbox(field.bounds);
    map.fitBounds(
      L.latLngBounds([south, west], [north, east]),
      { padding: [20, 20] }
    );
  }, [field, map]);

  return null;
}

function SatelliteImageOverlay({
  field,
  layer,
}: {
  field: Field;
  layer: MapLayer;
}) {
  const map = useMap();

  const bbox = useMemo(() => {
    const [west, south, east, north] = boundsToBbox(field.bounds);
    return `${west},${south},${east},${north}`;
  }, [field.bounds]);

  useEffect(() => {
    const url = `/api/satellite/tiles?layer=${layer}&bbox=${bbox}&width=512&height=512`;
    const [west, south, east, north] = boundsToBbox(field.bounds);
    const bounds = L.latLngBounds([south, west], [north, east]);

    const img = L.imageOverlay(url, bounds, { opacity: 0.85, interactive: false });
    img.addTo(map);

    return () => {
      map.removeLayer(img);
    };
  }, [map, bbox, layer, field.bounds]);

  return null;
}

export default function SatelliteMap({ field, layer = 'ndvi' }: SatelliteMapProps) {
  const zonePolygons = useMemo(
    () =>
      field.zones.map((zone) => ({
        id: zone.id,
        name: zone.name,
        positions: zone.bounds.map((p) => [p.lat, p.lng] as [number, number]),
      })),
    [field.zones]
  );

  return (
    <div className="h-[360px] w-full rounded-lg overflow-hidden border border-border">
      <MapContainer
        center={[field.center.lat, field.center.lng]}
        zoom={14}
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <SatelliteImageOverlay field={field} layer={layer} />
        {zonePolygons.map((zone) => (
          <Polygon
            key={zone.id}
            positions={zone.positions}
            pathOptions={{ color: '#ffffff', weight: 2, fillOpacity: 0.05 }}
          />
        ))}
        <FitBounds field={field} />
      </MapContainer>
    </div>
  );
}
