'use client';

import { useState } from 'react';
import { MapPin, Navigation, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface LocationPromptProps {
  onUseGPS: () => void;
  onSearch: (query: string) => void;
  onSkip: () => void;
  isLocating: boolean;
}

export function LocationPrompt({ onUseGPS, onSearch, onSkip, isLocating }: LocationPromptProps) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    await onSearch(query.trim());
    setSearching(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card shadow-lg">
        <div className="px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="font-medium text-foreground">¿Dónde está tu parcela?</p>
              <p className="text-xs text-muted-foreground">Centrá el mapa antes de dibujar</p>
            </div>
          </div>
        </div>
        <div className="p-5 space-y-3">
          <Button
            type="button"
            className="w-full min-h-[44px] justify-start gap-3"
            onClick={onUseGPS}
            disabled={isLocating}
          >
            {isLocating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
            Usar mi ubicación actual
          </Button>
          <form onSubmit={(e) => void handleSearch(e)} className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar municipio o localidad..."
                className="pl-9"
              />
            </div>
            <Button
              type="submit"
              variant="outline"
              className="w-full min-h-[44px]"
              disabled={!query.trim() || searching}
            >
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar en mapa'}
            </Button>
          </form>
          <Button type="button" variant="ghost" className="w-full" onClick={onSkip}>
            Usar vista por defecto (Santa Cruz)
          </Button>
        </div>
      </div>
    </div>
  );
}
