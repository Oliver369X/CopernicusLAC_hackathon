'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { isActivePath } from '@/lib/navigation/config';
import { getNavGroupsForBilling } from '@/lib/navigation/experience';
import { useOrgBilling } from '@/hooks/use-org-billing';

interface NavLinkProps {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  collapsed = false,
  onNavigate,
}: NavLinkProps) {
  const link = (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        'group relative flex min-h-[44px] items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
        active
          ? 'bg-primary/20 text-primary shadow-sm shadow-primary/20 ring-1 ring-primary/35'
          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
      )}
    >
      {active && (
        <span
          className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-primary to-secondary shadow-[0_0_12px_var(--glow-teal)] motion-reduce:transition-none"
          aria-hidden
        />
      )}
      <Icon
        className={cn(
          'h-[1.125rem] w-[1.125rem] shrink-0 transition-colors',
          active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
        )}
        aria-hidden
      />
      {!collapsed && <span className="flex-1 truncate">{label}</span>}
      <span className="sr-only">{label}</span>
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

interface SidebarNavProps {
  collapsed?: boolean;
  onNavigate?: () => void;
  className?: string;
}

export function SidebarNav({
  collapsed = false,
  onNavigate,
  className,
}: SidebarNavProps) {
  const pathname = usePathname();
  const { billing } = useOrgBilling();
  const navGroups = getNavGroupsForBilling(billing?.billingModel);

  return (
    <nav
      className={cn(
        'flex flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-2 py-3 scrollbar-thin',
        className
      )}
      aria-label="Navegación principal"
    >
      {navGroups.map((group) => (
        <div key={group.label} className="space-y-1">
          {!collapsed && (
            <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              {group.label}
            </p>
          )}
          {collapsed && (
            <div className="mx-auto mb-1 h-px w-8 bg-sidebar-border" aria-hidden />
          )}
          <div className="space-y-0.5">
            {group.items.map((item) => (
              <NavLink
                key={item.href}
                {...item}
                active={isActivePath(pathname, item.href)}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}
