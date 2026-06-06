'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, CloudOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  className?: string;
  showWhenOnline?: boolean;
  /** Texto más corto en pantallas chicas */
  compact?: boolean;
}

export function ConnectionStatus({
  className,
  showWhenOnline = false,
  compact = false,
}: ConnectionStatusProps) {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (online && !showWhenOnline) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs',
        online
          ? 'border-health-excellent/30 bg-health-excellent/10 text-health-excellent'
          : 'border-health-warning/40 bg-health-warning/10 text-health-warning',
        className
      )}
      role="status"
    >
      {online ? (
        <>
          <Wifi className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>{compact ? 'En línea · sync activa' : 'Conectado — sincronización activa'}</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>
            {compact
              ? 'Sin conexión · guardado local'
              : 'Modo sin conexión — los datos se guardan en el dispositivo'}
          </span>
        </>
      )}
    </div>
  );
}

export function OfflineMapBadge({ ready }: { ready: boolean }) {
  if (!ready) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary ring-1 ring-primary/25">
      <CloudOff className="h-3 w-3" aria-hidden />
      Mapa offline
    </span>
  );
}
