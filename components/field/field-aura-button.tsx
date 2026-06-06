'use client';

import { useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ASSISTANT_NAME } from '@/lib/constants/app-brand';
import { AuraAssistantPanel } from '@/components/agents/aura-assistant-panel';
import {
  buildScreenContext,
  getScreenQuickPrompts,
} from '@/lib/agents/screen-context';
import { cn } from '@/lib/utils';

type FieldAuraButtonProps = {
  variant?: 'header' | 'nav';
};

export function FieldAuraButton({ variant = 'header' }: FieldAuraButtonProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const fieldId = searchParams.get('field') ?? undefined;
  const zoneId = searchParams.get('zoneId') ?? searchParams.get('zone') ?? undefined;

  const screenContext = useMemo(
    () => buildScreenContext(pathname, { field: fieldId, zone: zoneId }),
    [pathname, fieldId, zoneId]
  );

  const quickPrompts = useMemo(() => {
    const base = getScreenQuickPrompts(pathname);
    return [
      '¿Qué significan estos números?',
      '¿Está bien o mal este NDVI?',
      '¿Qué hago con este diagnóstico?',
      ...base,
    ].slice(0, 4);
  }, [pathname]);

  return (
    <>
      {variant === 'nav' ? (
        <button
          type="button"
          className="flex min-h-[52px] w-full touch-manipulation flex-col items-center justify-end gap-0.5 pb-1"
          onClick={() => setOpen(true)}
          aria-label={`Abrir ${ASSISTANT_NAME}`}
        >
          <span
            className={cn(
              'flex h-11 w-11 -mt-5 items-center justify-center rounded-full',
              'bg-primary text-primary-foreground shadow-lg shadow-primary/30',
              'ring-2 ring-background active:scale-95 transition-transform'
            )}
          >
            <Sparkles className="h-5 w-5" aria-hidden />
          </span>
          <span className="max-w-full truncate text-[10px] font-semibold text-primary">
            {ASSISTANT_NAME}
          </span>
        </button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="hidden size-11 shrink-0 border-primary/30 md:inline-flex"
          onClick={() => setOpen(true)}
          aria-label={`Abrir ${ASSISTANT_NAME}`}
        >
          <Sparkles className="h-5 w-5 text-primary" />
        </Button>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[min(88dvh,640px)] rounded-t-2xl p-0 pb-[env(safe-area-inset-bottom)]"
        >
          <SheetHeader className="border-b border-border px-4 py-3 text-left">
            <SheetTitle className="text-base">{ASSISTANT_NAME}</SheetTitle>
            <SheetDescription className="text-xs">
              Métricas, diagnóstico y próximos pasos en campo.
            </SheetDescription>
          </SheetHeader>
          <div className="max-h-[calc(min(88dvh,640px)-4.5rem)] overflow-y-auto overscroll-contain px-3 py-3 sm:px-4">
            <AuraAssistantPanel
              bare
              fieldId={fieldId}
              zoneId={zoneId}
              screenContext={screenContext}
              quickPrompts={quickPrompts}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
