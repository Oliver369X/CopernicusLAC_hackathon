'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SCIENCE_LAB_TOUR_STORAGE_KEY } from '@/lib/onboarding/science-lab-copy';
import { getDemoTourLinks } from '@/lib/integrations/geodata/demo-scenarios';
import { Satellite, Sprout, Building2, ArrowRight, X } from 'lucide-react';

interface ScienceLabTourProps {
  /** Forzar apertura (ej. botón "Ver tutorial") */
  forceOpen?: boolean;
  onClose?: () => void;
  simpleMode?: boolean;
}

const STEPS_COOP = [
  {
    title: 'Tu laboratorio satelital',
    body: 'Acá ves cómo evolucionó tu campo con fotos del satélite. No necesitás ser agrónomo: empezá con una pregunta simple.',
  },
  {
    title: 'Paso 1 — Elegí qué te preocupa',
    body: '¿Amarillo? ¿Comparar con otro productor? ¿Solo ver el año pasado? La app te lleva al gráfico correcto.',
  },
  {
    title: 'Paso 2 — Mirá el historial',
    body: 'El gráfico verde muestra el verdor del cultivo mes a mes. Podés comparar chacra chica vs cooperativa.',
  },
  {
    title: 'Paso 3 — Guardá tu seguimiento',
    body: 'Anotá en tus palabras qué observaste. Podés volver la próxima semana y ver si mejoró.',
  },
];

const STEPS_SMALL = [
  {
    title: 'Bienvenida, María',
    body: 'Esta pantalla te muestra cómo va tu parcela desde el satélite — en castellano simple, sin fórmulas raras.',
  },
  {
    title: 'Tocá lo que te preocupa',
    body: 'Elegí una tarjeta: parcela amarilla, comparar con la cooperativa, o "no estoy segura".',
  },
  {
    title: 'Mirá el gráfico de tu chacra',
    body: 'La línea verde es el vigor de tu cultivo. Si baja varias semanas seguidas, conviene revisar riego o plaga.',
  },
  {
    title: 'Listo para empezar',
    body: 'Te llevamos directo a tu soja. Siempre podés repetir este tutorial desde el botón Ayuda.',
  },
];

export function ScienceLabTour({ forceOpen, onClose, simpleMode = false }: ScienceLabTourProps) {
  const router = useRouter();
  const [open, setOpen] = useState(Boolean(forceOpen));
  const [step, setStep] = useState(0);
  const steps = simpleMode ? STEPS_SMALL : STEPS_COOP;
  const current = steps[step];

  useEffect(() => {
    if (forceOpen) {
      setOpen(true);
      setStep(0);
    }
  }, [forceOpen]);

  useEffect(() => {
    if (forceOpen || typeof window === 'undefined') return;
    if (localStorage.getItem(SCIENCE_LAB_TOUR_STORAGE_KEY) === '1') return;
    setOpen(true);
  }, [forceOpen]);

  function finish(navigate?: boolean) {
    localStorage.setItem(SCIENCE_LAB_TOUR_STORAGE_KEY, '1');
    setOpen(false);
    onClose?.();
    if (navigate) {
      const href = simpleMode
        ? getDemoTourLinks('soybean').smallholder
        : getDemoTourLinks('soybean').cooperative;
      router.push(href);
    }
  }

  function dismiss() {
    finish(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && dismiss()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {simpleMode ? (
              <Sprout className="h-5 w-5 text-amber-600" />
            ) : (
              <Building2 className="h-5 w-5 text-sky-600" />
            )}
            {current.title}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed pt-1">
            {current.body}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-1 py-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-muted'}`}
            />
          ))}
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline" className="gap-1">
            <Satellite className="h-3 w-3" />
            Paso {step + 1} de {steps.length}
          </Badge>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          {step < steps.length - 1 ? (
            <Button className="min-h-[44px]" onClick={() => setStep((s) => s + 1)}>
              Siguiente
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button className="min-h-[44px]" onClick={() => finish(true)}>
              {simpleMode ? 'Ver mi parcela de soja' : 'Abrir Lab de soja'}
            </Button>
          )}
          {step > 0 && (
            <Button variant="outline" className="min-h-[44px]" onClick={() => setStep((s) => s - 1)}>
              Atrás
            </Button>
          )}
          <Button variant="ghost" className="min-h-[44px]" onClick={dismiss}>
            <X className="h-4 w-4 mr-2" />
            {step === steps.length - 1 ? 'Entendido, lo exploro solo' : 'Saltar tutorial'}
          </Button>
          {simpleMode && step === steps.length - 1 && (
            <Button variant="link" className="text-xs" asChild>
              <Link href="/monitor">Ir al mapa de mi finca</Link>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Botón para reabrir el tutorial */
export function ScienceLabTourTrigger({
  simpleMode,
  className,
}: {
  simpleMode?: boolean;
  className?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={className}
        onClick={() => setShow(true)}
      >
        Ayuda · tutorial
      </Button>
      {show && (
        <ScienceLabTour forceOpen simpleMode={simpleMode} onClose={() => setShow(false)} />
      )}
    </>
  );
}
