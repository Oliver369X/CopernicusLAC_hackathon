'use client';

import { Suspense, useMemo, useState } from 'react';
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
import {
  AUTH_ROUTES,
  FIELD_ROUTE_PREFIX,
  MARKETING_ROUTES,
} from '@/lib/navigation/config';

function AuraAssistantFabInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const fieldId = searchParams.get('field') ?? undefined;
  const zoneId = searchParams.get('zone') ?? undefined;
  const crop = searchParams.get('crop') ?? undefined;

  const screenContext = useMemo(
    () => buildScreenContext(pathname, { field: fieldId, zone: zoneId, crop }),
    [pathname, fieldId, zoneId, crop]
  );

  const quickPrompts = useMemo(() => getScreenQuickPrompts(pathname), [pathname]);

  if (
    MARKETING_ROUTES.includes(pathname) ||
    AUTH_ROUTES.some((r) => pathname.startsWith(r)) ||
    pathname.startsWith(FIELD_ROUTE_PREFIX)
  ) {
    return null;
  }

  return (
    <>
      <Button
        type="button"
        size="lg"
        className="fixed z-50 bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 h-12 gap-2 rounded-full px-4 shadow-lg sm:right-6"
        onClick={() => setOpen(true)}
        aria-label={`Abrir asistente ${ASSISTANT_NAME}`}
      >
        <Sparkles className="h-4 w-4" />
        <span className="font-medium">{ASSISTANT_NAME}</span>
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
        >
          <SheetHeader className="border-b border-border px-4 py-4 text-left">
            <SheetTitle>{ASSISTANT_NAME}</SheetTitle>
            <SheetDescription>
              Preguntá sobre los datos que ves: significado, si está bien o mal, y qué hacer.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 py-4">
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

export function AuraAssistantFab() {
  return (
    <Suspense fallback={null}>
      <AuraAssistantFabInner />
    </Suspense>
  );
}
