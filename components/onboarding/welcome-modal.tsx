'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sprout, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePlainExperience } from '@/hooks/use-plain-experience';

const STORAGE_KEY = 'ds_welcome_dismissed';

export function WelcomeModal() {
  const [open, setOpen] = useState(false);
  const [hasFields, setHasFields] = useState(false);
  const { plain } = usePlainExperience();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(STORAGE_KEY) === '1') return;

    fetch('/api/org/status')
      .then((r) => r.json())
      .then((data: { fieldCount?: number }) => {
        const count = data.fieldCount ?? 0;
        setHasFields(count > 0);
        setOpen(true);
      })
      .catch(() => {});
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1');
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && dismiss()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sprout className="h-5 w-5 text-primary" />
            Bienvenida
          </DialogTitle>
          <DialogDescription>
            {hasFields
              ? plain
                ? 'Tu parcela ya está registrada. Empezá viendo cómo va hoy.'
                : 'Ya tenés parcelas cargadas.'
              : plain
                ? 'Marcá tu parcela en el mapa para recibir lecturas del satélite.'
                : 'Empezá registrando tu parcela en el mapa o importando un archivo con tus lotes.'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-2">
          {hasFields ? (
            <>
              <Button asChild className="min-h-[44px] w-full">
                <Link href="/inicio" onClick={dismiss}>
                  Ver mi finca hoy
                </Link>
              </Button>
              <Button asChild variant="outline" className="min-h-[44px] w-full">
                <Link href="/science" onClick={dismiss}>
                  Cómo va mi cultivo
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild className="min-h-[44px] w-full">
                <Link href="/setup/parcel" onClick={dismiss}>
                  <Sprout className="h-4 w-4 mr-2" />
                  Registrar mi parcela
                </Link>
              </Button>
              {!plain && (
                <Button asChild variant="outline" className="min-h-[44px] w-full">
                  <Link href="/setup/import" onClick={dismiss}>
                    Importar archivo
                  </Link>
                </Button>
              )}
            </>
          )}
          <Button variant="ghost" size="sm" onClick={dismiss} className="gap-2">
            <X className="h-4 w-4" />
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
