import type { BillingModel, OrgBillingProfile } from '@/lib/billing/types';
import type { LucideIcon } from 'lucide-react';
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
import type { NavGroup } from '@/lib/navigation/config';

/** Pequeña agricultora / finca familiar — modelo por hectáreas, sin lab ni analítica avanzada. */
export function isSmallFarmerExperience(
  billing: Pick<OrgBillingProfile, 'billingModel'> | null | undefined
): boolean {
  return billing?.billingModel === 'hectare';
}

export interface NavItemDef {
  href: string;
  label: string;
  icon: LucideIcon;
}

const cooperativeNavGroups: NavGroup[] = [
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
    items: [{ href: '/science', label: 'Lab. Científico', icon: FlaskConical }],
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

const smallFarmerNavGroups: NavGroup[] = [
  {
    label: 'Mi finca',
    items: [
      { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
      { href: '/monitor', label: 'Mapa satelital', icon: Satellite },
      { href: '/alerts', label: 'Alertas', icon: Bell },
    ],
  },
  {
    label: 'Herramientas',
    items: [
      { href: '/gestion', label: 'Parcelas y equipo', icon: Settings },
      { href: '/field', label: 'Campo (fotos)', icon: Sprout },
    ],
  },
];

export function getNavGroupsForBilling(
  billingModel: BillingModel | null | undefined
): NavGroup[] {
  return billingModel === 'hectare' ? smallFarmerNavGroups : cooperativeNavGroups;
}

/** Rutas solo para cooperativas / modelo por zonas. */
export const COOPERATIVE_ONLY_PREFIXES = ['/science', '/analytics', '/insights'];

export function isCooperativeOnlyRoute(pathname: string): boolean {
  return COOPERATIVE_ONLY_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}
