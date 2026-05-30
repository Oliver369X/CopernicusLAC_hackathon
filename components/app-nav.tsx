'use client';

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
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/monitor', label: 'Monitor', icon: Satellite },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/insights', label: 'Insights', icon: Lightbulb },
  { href: '/science', label: 'Science Lab', icon: FlaskConical },
  { href: '/alerts', label: 'Alerts', icon: Bell },
  { href: '/field', label: 'Field App', icon: Sprout },
];

export function AppNav() {
  const pathname = usePathname();

  if (pathname.startsWith('/field') || pathname.startsWith('/login') || pathname.startsWith('/register')) {
    return null;
  }

  return (
    <nav className="border-b border-border bg-muted/30">
      <div className="flex items-center gap-1 overflow-x-auto px-4 py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
