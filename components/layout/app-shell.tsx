'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Satellite,
  BarChart3,
  Lightbulb,
  Bell,
  FlaskConical,
  Sprout,
  Menu,
  Leaf,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AuthHeaderActions } from '@/components/auth-header-actions';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const navGroups = [
  {
    label: 'Principal',
    items: [
      { href: '/dashboard', label: 'Panel', icon: LayoutDashboard },
      { href: '/monitor', label: 'Monitoreo', icon: Satellite },
    ],
  },
  {
    label: 'Análisis',
    items: [
      { href: '/analytics', label: 'Analítica', icon: BarChart3 },
      { href: '/insights', label: 'Perspectivas', icon: Lightbulb },
    ],
  },
  {
    label: 'Investigación',
    items: [
      { href: '/science', label: 'Lab. Científico', icon: FlaskConical },
    ],
  },
  {
    label: 'Operaciones',
    items: [
      { href: '/alerts', label: 'Alertas', icon: Bell },
      { href: '/field', label: 'App de Campo', icon: Sprout },
    ],
  },
];

const AUTH_ROUTES = ['/login', '/register'];

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
        active
          ? 'bg-primary/15 text-primary shadow-sm ring-1 ring-primary/20'
          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
      )}
    >
      <Icon
        className={cn(
          'h-4 w-4 shrink-0 transition-colors',
          active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
        )}
      />
      <span className="flex-1">{label}</span>
      {active && <ChevronRight className="h-3.5 w-3.5 text-primary/60" />}
    </Link>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-6 px-3 py-4">
      {navGroups.map((group) => (
        <div key={group.label} className="space-y-1">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            {group.label}
          </p>
          <div className="space-y-0.5">
            {group.items.map((item) => (
              <NavLink
                key={item.href}
                {...item}
                active={isActive(pathname, item.href)}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-3 px-3 py-1 group">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-500 text-primary-foreground shadow-lg shadow-primary/25 transition-transform group-hover:scale-105">
        <Leaf className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-foreground">Doctor Soya</p>
        <p className="truncate text-[10px] text-muted-foreground">
          Monitoreo agrícola
        </p>
      </div>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    return <>{children}</>;
  }

  if (pathname.startsWith('/field')) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-border/60 bg-sidebar/80 backdrop-blur-xl">
        <div className="flex h-16 items-center border-b border-border/60 px-4">
          <Brand />
        </div>
        <SidebarNav />
        <div className="border-t border-border/60 p-4">
          <AuthHeaderActions />
        </div>
      </aside>

      <div className="flex flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl sm:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-sidebar">
              <SheetHeader className="border-b border-border/60 px-4 py-4">
                <SheetTitle className="text-left">
                  <Brand />
                </SheetTitle>
              </SheetHeader>
              <SidebarNav onNavigate={() => setMobileOpen(false)} />
              <div className="absolute bottom-0 left-0 right-0 border-t border-border/60 p-4">
                <AuthHeaderActions />
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex flex-1 items-center justify-between gap-4">
            <div className="lg:hidden">
              <Brand />
            </div>
            <div className="hidden lg:block" />
            <div className="lg:hidden">
              <AuthHeaderActions />
            </div>
          </div>
        </header>

        <main className="flex-1 page-gradient">{children}</main>
      </div>
    </div>
  );
}
