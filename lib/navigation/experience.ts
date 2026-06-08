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
  Home,
} from 'lucide-react';
import type { NavGroup } from '@/lib/navigation/config';
import { PLAIN_NAV_LABELS } from '@/lib/i18n/plain-labels';

export const TECHNICAL_MODE_STORAGE_KEY = 'ds_technical_mode_v1';

/** Pequeña agricultora / finca familiar — modelo por hectáreas. */
export function isSmallFarmerExperience(
  billing: Pick<OrgBillingProfile, 'billingModel'> | null | undefined
): boolean {
  return billing?.billingModel === 'hectare';
}

/** Cooperativa puede activar modo técnico; hectare nunca. */
export function canAccessTechnicalMode(
  billing: Pick<OrgBillingProfile, 'billingModel'> | null | undefined
): boolean {
  return billing?.billingModel === 'zone';
}

/**
 * Experiencia productor (sin jerga). Por defecto true para todos.
 * Solo cooperativa con toggle técnico activo ve UI analítica.
 */
export function isPlainExperience(
  billing: Pick<OrgBillingProfile, 'billingModel'> | null | undefined,
  technicalMode = false
): boolean {
  if (!canAccessTechnicalMode(billing)) return true;
  return !technicalMode;
}

/** Alias usado en science/dashboard — plain o pequeña agricultora. */
export function isSimpleProductorMode(
  billing: Pick<OrgBillingProfile, 'billingModel'> | null | undefined,
  technicalMode = false
): boolean {
  return isPlainExperience(billing, technicalMode);
}

export interface NavItemDef {
  href: string;
  label: string;
  icon: LucideIcon;
}

const plainNavGroups: NavGroup[] = [
  {
    label: 'Mi finca',
    items: [
      { href: '/inicio', label: PLAIN_NAV_LABELS.inicio, icon: Home },
      { href: '/monitor', label: PLAIN_NAV_LABELS.mapa, icon: Satellite },
      { href: '/science', label: PLAIN_NAV_LABELS.cultivo, icon: FlaskConical },
      { href: '/alerts', label: PLAIN_NAV_LABELS.alertas, icon: Bell },
    ],
  },
  {
    label: 'Herramientas',
    items: [
      { href: '/gestion', label: PLAIN_NAV_LABELS.parcelas, icon: Settings },
      { href: '/field', label: PLAIN_NAV_LABELS.fotos, icon: Sprout },
    ],
  },
];

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

const smallFarmerNavGroups: NavGroup[] = plainNavGroups;

export function getNavGroupsForBilling(
  billingModel: BillingModel | null | undefined
): NavGroup[] {
  return billingModel === 'hectare' ? smallFarmerNavGroups : cooperativeNavGroups;
}

export function getNavGroupsForExperience(
  billing: Pick<OrgBillingProfile, 'billingModel'> | null | undefined,
  technicalMode = false
): NavGroup[] {
  if (isPlainExperience(billing, technicalMode)) {
    return plainNavGroups;
  }
  return cooperativeNavGroups;
}

/** Home por defecto según experiencia. */
export function getDefaultHomeHref(
  billing: Pick<OrgBillingProfile, 'billingModel'> | null | undefined,
  technicalMode = false
): string {
  return isPlainExperience(billing, technicalMode) ? '/inicio' : '/dashboard';
}

/** Rutas solo en modo técnico cooperativo. */
export const COOPERATIVE_ONLY_PREFIXES = ['/analytics', '/insights', '/dashboard'];

export const TECHNICAL_ONLY_PREFIXES = [
  '/analytics',
  '/insights',
  '/science/compare',
  '/science/studies',
  '/science/bibliography',
];

export function isCooperativeOnlyRoute(pathname: string): boolean {
  return COOPERATIVE_ONLY_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export function isTechnicalOnlyRoute(pathname: string): boolean {
  return TECHNICAL_ONLY_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export function shouldBlockTechnicalRoute(
  pathname: string,
  billing: Pick<OrgBillingProfile, 'billingModel'> | null | undefined,
  technicalMode = false
): boolean {
  if (!isPlainExperience(billing, technicalMode)) return false;
  return isTechnicalOnlyRoute(pathname) || pathname === '/dashboard';
}
