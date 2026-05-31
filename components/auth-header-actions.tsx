'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, Leaf, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type AuthLayoutVariant = 'sidebar' | 'header' | 'collapsed';

interface AuthHeaderActionsProps {
  layout?: AuthLayoutVariant;
}

export function AuthHeaderActions({ layout = 'sidebar' }: AuthHeaderActionsProps) {
  const router = useRouter();
  const authEnabled = process.env.NEXT_PUBLIC_AUTH_ENABLED === 'true';

  const handleLogout = async () => {
    if (!authEnabled) return;
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  if (!authEnabled) {
    if (layout === 'collapsed') {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" className="size-10" asChild>
              <Link href="/login" aria-label="Acceso demo">
                <LogIn className="h-4 w-4" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Demo (sin login)</TooltipContent>
        </Tooltip>
      );
    }

    if (layout === 'header') {
      return (
        <Button variant="outline" size="sm" className="h-10 gap-2" asChild>
          <Link href="/login">
            <LogIn className="h-4 w-4" />
            <span className="hidden sm:inline">Entrar</span>
          </Link>
        </Button>
      );
    }

    return (
      <Button variant="outline" size="sm" className="h-11 w-full justify-start gap-2" asChild>
        <Link href="/login">
          <LogIn className="h-4 w-4 shrink-0" />
          Demo (sin login)
        </Link>
      </Button>
    );
  }

  if (layout === 'collapsed') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="size-10"
            onClick={handleLogout}
            aria-label="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Cerrar sesión</TooltipContent>
      </Tooltip>
    );
  }

  if (layout === 'header') {
    return (
      <Button
        variant="outline"
        size="sm"
        className="h-10 gap-2"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Salir</span>
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <div
        className={cn(
          'flex items-center gap-3 rounded-lg border border-sidebar-border/80 bg-muted/30 px-3 py-2.5'
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/25">
          <User className="h-4 w-4 text-primary" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-foreground">Sesión activa</p>
          <p className="flex items-center gap-1 truncate text-[10px] text-muted-foreground">
            <Leaf className="h-3 w-3 shrink-0 text-secondary" aria-hidden />
            Copernicus LAC
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="h-11 w-full justify-start gap-2"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4 shrink-0" />
        Cerrar sesión
      </Button>
    </div>
  );
}
