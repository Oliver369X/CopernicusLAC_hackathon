'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, BarChart3, Camera, FlaskConical, Clock, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getFieldPageTitle } from '@/lib/field/page-titles';

const navItems = [
  { href: '/field', label: 'Monitor', icon: BarChart3, exact: true },
  { href: '/field/capture', label: 'Captura', icon: Camera, exact: false },
  { href: '/field/diagnostics', label: 'Diagnóstico', icon: FlaskConical, exact: false },
  { href: '/field/history', label: 'Historial', icon: Clock, exact: false },
] as const;

function isNavActive(pathname: string, href: string, exact: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function FieldAppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const pageTitle = getFieldPageTitle(pathname);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background page-gradient">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
        <div className="flex h-14 items-center justify-between gap-3 px-4">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="icon"
              className="size-11 shrink-0"
              aria-label="Volver al panel"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-primary-foreground">
              <Leaf className="h-4 w-4" aria-hidden />
            </div>
            <h1 className="min-w-0 truncate text-center text-sm font-bold text-foreground sm:text-base">
              {pageTitle}
            </h1>
          </div>
          <div className="size-11 shrink-0" aria-hidden />
        </div>
      </header>

      <main className="flex-1 overflow-auto pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
        {children}
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-card/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
        aria-label="Navegación de campo"
      >
        <div className="grid grid-cols-4 gap-0.5 p-1.5">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const active = isNavActive(pathname, href, exact);
            return (
              <Link key={href} href={href} className="min-w-0">
                <span
                  className={cn(
                    'flex min-h-[52px] w-full flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-xs font-medium transition-colors duration-200 motion-reduce:transition-none',
                    active
                      ? 'bg-primary/15 text-primary ring-1 ring-primary/25'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden />
                  <span className="truncate max-w-full">{label}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
