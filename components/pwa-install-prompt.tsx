'use client';

import { useEffect, useState } from 'react';
import { X, Download, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'doctor-soya-pwa-dismissed';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY) === '1') return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setShowPrompt(false);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  if (!showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-labelledby="pwa-install-title"
      className={cn(
        'fixed z-50 animate-fade-in-up motion-reduce:animate-none',
        'inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))]',
        'sm:inset-x-auto sm:right-4 sm:left-auto sm:max-w-sm'
      )}
    >
      <div className="glass-card overflow-hidden rounded-2xl border-primary/20 shadow-xl shadow-primary/10">
        <div className="h-1 w-full bg-gradient-to-r from-primary via-secondary to-primary/50" />
        <div className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-md shadow-primary/25">
              <Leaf className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h3
                id="pwa-install-title"
                className="font-semibold text-foreground"
              >
                Instalar Doctor Soya
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Acceso rápido desde tu pantalla de inicio y trabajo sin conexión
                en el campo.
              </p>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={dismiss}
              className="h-10 sm:min-w-[5.5rem]"
            >
              Ahora no
            </Button>
            <Button
              size="sm"
              onClick={handleInstall}
              className="h-10 gap-2 sm:min-w-[5.5rem]"
            >
              <Download className="h-4 w-4" />
              Instalar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
