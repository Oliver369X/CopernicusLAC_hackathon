'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sprout, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const STORAGE_KEY = 'ds_welcome_dismissed';

export function WelcomeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(STORAGE_KEY) === '1') return;

    fetch('/api/org/status')
      .then((r) => r.json())
      .then((data: { fieldCount?: number }) => {
        if ((data.fieldCount ?? 0) === 0) {
          setOpen(true);
        }
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
            Bienvenida a Doctor Soya
          </DialogTitle>
          <DialogDescription>
            Empezá registrando tu parcela en el mapa o importando un archivo con tus lotes.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-2">
          <Button asChild className="min-h-[44px] w-full">
            <Link href="/setup/parcel" onClick={dismiss}>
              <Sprout className="h-4 w-4 mr-2" />
              Registrar mi parcela
            </Link>
          </Button>
          <Button asChild variant="outline" className="min-h-[44px] w-full">
            <Link href="/onboarding?step=2&mode=import" onClick={dismiss}>
              <Upload className="h-4 w-4 mr-2" />
              Importar archivo
            </Link>
          </Button>
          <Button variant="ghost" className="min-h-[44px]" onClick={dismiss}>
            <X className="h-4 w-4 mr-2" />
            Después
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
