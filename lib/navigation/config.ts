import type { LucideIcon } from 'lucide-react';
import { APP_NAME } from '@/lib/constants/app-brand';
import { getScienceProfile, isScienceCrop } from '@/lib/science/crops/registry';
import {
  LayoutDashboard,
  Satellite,
  BarChart3,
  Lightbulb,
  Bell,
  FlaskConical,
  Sprout,
  Settings,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
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
      { href: '/gestion', label: 'Gestión', icon: Settings },
      { href: '/alerts', label: 'Alertas', icon: Bell },
      { href: '/field', label: 'App de Campo', icon: Sprout },
    ],
  },
];

const pageTitles: Record<string, string> = {
  '/inicio': 'Tu finca hoy',
  '/dashboard': 'Panel de control',
  '/monitor': 'Mapa de mi parcela',
  '/analytics': 'Analítica',
  '/insights': 'Perspectivas avanzadas',
  '/science': 'Cómo va mi cultivo',
  '/alerts': 'Avisos de tu parcela',
  '/alerts/settings': 'Configuración de alertas',
  '/gestion': 'Gestión de finca',
  '/onboarding': 'Configuración inicial',
};

export const AUTH_ROUTES = ['/login', '/register'];
/** Rutas públicas sin sidebar ni onboarding guard */
export const MARKETING_ROUTES = ['/', '/privacidad'];
export const FIELD_ROUTE_PREFIX = '/field';
export const SIDEBAR_COLLAPSED_KEY = 'doctor-soya-sidebar-collapsed';

const ROOT_NAV_HREFS = ['/dashboard', '/inicio'];

export function isActivePath(pathname: string, href: string): boolean {
  return (
    pathname === href ||
    (!ROOT_NAV_HREFS.includes(href) && pathname.startsWith(href))
  );
}

const scienceSubpageTitles: Record<string, string> = {
  '/science/compare': 'Comparar cultivos',
  '/science/studies': 'Estudios y validación',
  '/science/bibliography': 'Bibliografía científica',
};

export function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (scienceSubpageTitles[pathname]) return scienceSubpageTitles[pathname];

  const cropPage = pathname.match(/^\/science\/([\w-]+)$/);
  if (cropPage && isScienceCrop(cropPage[1])) {
    return `${getScienceProfile(cropPage[1]).displayName} — Laboratorio`;
  }

  for (const [path, title] of Object.entries(pageTitles)) {
    if (path !== '/dashboard' && pathname.startsWith(path)) {
      return title;
    }
  }

  return APP_NAME;
}

export function findNavItem(pathname: string): NavItem | undefined {
  for (const group of navGroups) {
    for (const item of group.items) {
      if (isActivePath(pathname, item.href)) return item;
    }
  }
  return undefined;
}
