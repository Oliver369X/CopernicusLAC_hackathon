'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  PanelLeftClose,
  PanelLeft,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AuthHeaderActions } from '@/components/auth-header-actions';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  AUTH_ROUTES,
  MARKETING_ROUTES,
  FIELD_ROUTE_PREFIX,
  SIDEBAR_COLLAPSED_KEY,
  getPageTitle,
} from '@/lib/navigation/config';
import { APP_NAME } from '@/lib/constants/app-brand';
import { OnboardingGuard } from '@/components/auth/onboarding-guard';
import { AuraAssistantFab } from '@/components/agents/aura-assistant-fab';
import { AuraLogo } from '@/components/brand/aura-logo';
import { TechnicalModeToggle } from '@/components/layout/technical-mode-toggle';
import { usePlainExperience } from '@/hooks/use-plain-experience';
import { getDefaultHomeHref } from '@/lib/navigation/experience';

function useHomeHref() {
  const { billing, technicalMode } = usePlainExperience();
  return getDefaultHomeHref(billing, technicalMode);
}

function BrandMark({ className }: { className?: string }) {
  const homeHref = useHomeHref();
  return (
    <Link
      href={homeHref}
      className={cn('flex shrink-0 items-center justify-center', className)}
      aria-label={`${APP_NAME} — inicio`}
    >
      <AuraLogo variant="mark" size={36} className="rounded-lg" />
    </Link>
  );
}

function Brand({ collapsed = false }: { collapsed?: boolean }) {
  const homeHref = useHomeHref();
  return (
    <Link
      href={homeHref}
      className={cn(
        'group flex items-center gap-3 rounded-lg transition-opacity hover:opacity-90',
        collapsed ? 'justify-center px-0' : 'px-1'
      )}
    >
      <AuraLogo
        variant="mark"
        size={36}
        className="shrink-0 transition-transform duration-200 group-hover:scale-105 motion-reduce:group-hover:scale-100"
      />
      {!collapsed && (
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-foreground">{APP_NAME}</p>
          <p className="truncate text-[10px] text-muted-foreground">
            Copernicus LAC
          </p>
        </div>
      )}
      <span className="sr-only">{APP_NAME} — inicio</span>
    </Link>
  );
}

function DesktopSidebar({
  collapsed,
  onToggleCollapse,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  return (
    <aside
      className={cn(
        'hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:flex-col',
        'border-r border-sidebar-border bg-sidebar/95 backdrop-blur-xl',
        'transition-[width] duration-300 ease-out motion-reduce:transition-none',
        collapsed ? 'lg:w-[4.75rem]' : 'lg:w-64'
      )}
    >
      <div
        className={cn(
          'flex h-16 shrink-0 items-center border-b border-sidebar-border',
          collapsed ? 'justify-center px-2' : 'px-4'
        )}
      >
        <Brand collapsed={collapsed} />
      </div>

      <SidebarNav collapsed={collapsed} className="flex-1" />

      <div className="shrink-0 space-y-2 border-t border-sidebar-border p-3">
        <TechnicalModeToggle collapsed={collapsed} />
        <AuthHeaderActions layout={collapsed ? 'collapsed' : 'sidebar'} />
        <Button
          type="button"
          variant="ghost"
          size={collapsed ? 'icon' : 'sm'}
          onClick={onToggleCollapse}
          className={cn(
            'w-full text-muted-foreground hover:text-foreground',
            collapsed && 'size-10'
          )}
          aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'}
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4" />
              <span className="ml-2">Contraer</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}

function MobileNavSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="lg:hidden size-11 shrink-0 border-primary/25 bg-background/60"
          aria-label="Abrir menú de navegación"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="flex w-[min(18.5rem,88vw)] max-w-none flex-col gap-0 border-sidebar-border bg-sidebar p-0 [&>button]:top-[max(1rem,env(safe-area-inset-top))]"
      >
        <SheetHeader className="shrink-0 border-b border-sidebar-border px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <SheetTitle className="text-left">
            <Brand />
          </SheetTitle>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col">
          <SidebarNav
            onNavigate={() => onOpenChange(false)}
            className="flex-1 px-2"
          />
          <div className="shrink-0 space-y-3 border-t border-sidebar-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <TechnicalModeToggle />
            <AuthHeaderActions layout="sidebar" />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function AppHeader({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileOpenChange,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex min-h-14 items-center gap-3 border-b border-border/60',
        'bg-background/85 px-4 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70',
        'pt-[env(safe-area-inset-top)] sm:px-6'
      )}
    >
      <MobileNavSheet open={mobileOpen} onOpenChange={onMobileOpenChange} />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="hidden size-10 lg:inline-flex"
        onClick={onToggleCollapse}
        aria-label={collapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'}
      >
        {collapsed ? (
          <PanelLeft className="h-5 w-5" />
        ) : (
          <PanelLeftClose className="h-5 w-5" />
        )}
      </Button>

      <div className="flex min-w-0 flex-1 items-center gap-2.5 lg:hidden">
        <BrandMark />
        <p className="line-clamp-2 min-w-0 flex-1 text-sm font-semibold leading-tight text-foreground">
          {pageTitle}
        </p>
      </div>

      <p className="hidden min-w-0 flex-1 truncate text-base font-semibold text-foreground lg:block">
        {pageTitle}
      </p>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="size-10 border-border/80 lg:hidden"
          asChild
        >
          <Link href="/alerts" aria-label="Ver alertas">
            <Bell className="h-4 w-4" />
          </Link>
        </Button>
        <div className="lg:hidden">
          <AuthHeaderActions layout="header" />
        </div>
        <div className="hidden lg:block">
          <AuthHeaderActions layout="header" />
        </div>
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored === 'true') setCollapsed(true);
    setHydrated(true);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  };

  if (MARKETING_ROUTES.includes(pathname)) {
    return <>{children}</>;
  }

  if (AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    return <>{children}</>;
  }

  if (pathname.startsWith(FIELD_ROUTE_PREFIX)) {
    return <>{children}</>;
  }

  const sidebarCollapsed = hydrated && collapsed;
  const mainOffset = sidebarCollapsed ? 'lg:pl-[4.75rem]' : 'lg:pl-64';

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-screen min-h-[100dvh] bg-background">
        <DesktopSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleCollapse}
        />

        <div
          className={cn(
            'flex min-w-0 flex-1 flex-col transition-[padding] duration-300 ease-out motion-reduce:transition-none',
            mainOffset
          )}
        >
          <AppHeader
            collapsed={sidebarCollapsed}
            onToggleCollapse={toggleCollapse}
            mobileOpen={mobileOpen}
            onMobileOpenChange={setMobileOpen}
          />

          <main className="min-w-0 flex-1 overflow-x-hidden page-gradient pb-[env(safe-area-inset-bottom)]">
            <OnboardingGuard>{children}</OnboardingGuard>
          </main>
          <AuraAssistantFab />
        </div>
      </div>
    </TooltipProvider>
  );
}
