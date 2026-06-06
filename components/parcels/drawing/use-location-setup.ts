'use client';

import { useState, useCallback } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';
import { toast } from 'sonner';

interface UseLocationSetupProps {
  mapRef: React.RefObject<MapRef | null>;
  mapReady: boolean;
}

export function useLocationSetup({ mapRef }: UseLocationSetupProps) {
  const [showLocationPrompt, setShowLocationPrompt] = useState(true);
  const [isLocating, setIsLocating] = useState(false);

  const flyToCoords = useCallback(
    (lng: number, lat: number, zoom = 14) => {
      mapRef.current?.flyTo({ center: [lng, lat], zoom, duration: 1200 });
    },
    [mapRef]
  );

  const handleUseGPS = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Tu navegador no soporta geolocalización');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { longitude, latitude } = pos.coords;
        setIsLocating(false);
        setShowLocationPrompt(false);
        flyToCoords(longitude, latitude, 14);
      },
      () => {
        setIsLocating(false);
        toast.error('No se pudo obtener tu ubicación');
      },
      { timeout: 8000 }
    );
  }, [flyToCoords]);

  const handleLocationSearch = useCallback(
    async (query: string) => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ', Bolivia')}&format=json&limit=1`
        );
        const data = (await res.json()) as Array<{ lat: string; lon: string }>;
        if (data.length > 0) {
          const lng = parseFloat(data[0].lon);
          const lat = parseFloat(data[0].lat);
          setShowLocationPrompt(false);
          flyToCoords(lng, lat, 12);
        } else {
          toast.error('No se encontró esa ubicación');
        }
      } catch {
        toast.error('Error al buscar ubicación');
      }
    },
    [flyToCoords]
  );

  return {
    showLocationPrompt,
    setShowLocationPrompt,
    isLocating,
    handleUseGPS,
    handleLocationSearch,
  };
}
