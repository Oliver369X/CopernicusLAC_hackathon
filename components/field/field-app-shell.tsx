'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Suspense } from 'react';
import { ChevronLeft, BarChart3, Camera, FlaskConical, Clock, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getFieldPageTitle } from '@/lib/field/page-titles';
import { ConnectionStatus } from '@/components/field/connection-status';
import { FieldAuraButton } from '@/components/field/field-aura-button';

const navBeforeAura = [
  { href: '/field', label: 'Monitor', shortLabel: 'Monitor', icon: BarChart3, exact: true },
  { href: '/field/capture', label: 'Captura', shortLabel: 'Foto', icon: Camera, exact: false },
] as const;

const navAfterAura = [
  {
    href: '/field/diagnostics',
    label: 'Diagnóstico',
    shortLabel: 'Dx',
    icon: FlaskConical,
    exact: false,
  },
  { href: '/field/history', label: 'Historial', shortLabel: 'Hist.', icon: Clock, exact: false },
] as const;

function isNavActive(pathname: string, href: string, exact: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  href,
  label,
  shortLabel,
  icon: Icon,
  exact,
  pathname,
}: {
  href: string;
  label: string;
  shortLabel: string;
  icon: typeof BarChart3;
  exact: boolean;
  pathname: string;
}) {
  const active = isNavActive(pathname, href, exact);
  return (
    <Link href={href} className="min-w-0 touch-manipulation">
      <span
        className={cn(
          'flex min-h-[52px] w-full flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 py-2',
          'text-[10px] font-medium transition-colors duration-200 motion-reduce:transition-none sm:text-xs',
          active
            ? 'bg-primary/15 text-primary ring-1 ring-primary/25'
            : 'text-muted-foreground active:bg-muted/60'
        )}
      >
        <Icon className="h-5 w-5 shrink-0" aria-hidden />
        <span className="truncate max-w-full sm:hidden">{shortLabel}</span>
        <span className="truncate max-w-full hidden sm:inline">{label}</span>
      </span>
    </Link>
  );
}

export function FieldAppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const pageTitle = getFieldPageTitle(pathname);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background page-gradient">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-12 max-w-lg items-center justify-between gap-2 px-3 sm:h-14 sm:px-4">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="icon"
              className="size-10 shrink-0 sm:size-11"
              aria-label="Volver al panel"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-primary-foreground sm:h-8 sm:w-8">
              <Leaf className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
            </div>
            <h1 className="min-w-0 truncate text-center text-sm font-bold text-foreground">
              {pageTitle}
            </h1>
          </div>
          <Suspense fallback={<div className="size-10 shrink-0 sm:size-11" aria-hidden />}>
            <FieldAuraButton variant="header" />
          </Suspense>
          {/* Espaciador en móvil donde Aura vive en la barra inferior */}
          <div className="size-10 shrink-0 md:hidden" aria-hidden />
        </div>
        <div className="mx-auto max-w-lg px-3 pb-2 sm:px-4">
          <ConnectionStatus compact showWhenOnline className="text-[10px] sm:text-[11px]" />
        </div>
      </header>

      <main className="field-mobile-main flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">
        <div className="field-mobile-container mx-auto w-full max-w-lg px-3 pb-[calc(6.25rem+env(safe-area-inset-bottom))] sm:px-4">
          {children}
        </div>
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-card/98 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
        aria-label="Navegación de campo"
      >
        <div className="mx-auto grid max-w-lg grid-cols-5 items-end gap-0 px-1 pt-2">
          {navBeforeAura.map((item) => (
            <NavLink key={item.href} {...item} pathname={pathname} />
          ))}
          <Suspense fallback={<div className="min-h-[52px]" aria-hidden />}>
            <FieldAuraButton variant="nav" />
          </Suspense>
          {navAfterAura.map((item) => (
            <NavLink key={item.href} {...item} pathname={pathname} />
          ))}
        </div>
      </nav>
    </div>
  );
}
