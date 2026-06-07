import type { ReactNode } from 'react';
import { APP_NAME, APP_TAGLINE } from '@/lib/constants/app-brand';
import { Satellite, FlaskConical, Shield } from 'lucide-react';
import { FadeIn, StaggerList } from '@/components/ui/motion';
import { AuraLogo } from '@/components/brand/aura-logo';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

const features = [
  {
    icon: Satellite,
    title: 'Monitoreo satelital',
    description: 'Copernicus Sentinel-1/2/3 en tiempo casi real',
  },
  {
    icon: FlaskConical,
    title: 'Laboratorio científico',
    description: 'Fusión multisensor con reglas e IA',
  },
  {
    icon: Shield,
    title: 'Alertas inteligentes',
    description: 'Detección temprana de riesgos en el campo',
  },
];

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen">
      <div className="auth-panel hidden flex-col justify-between p-10 lg:flex lg:w-[52%] xl:w-[55%] xl:p-14">
        <FadeIn className="flex items-center gap-4">
          <AuraLogo variant="full" size={148} priority className="max-h-24 w-auto" />
          <div className="sr-only">
            <p>{APP_NAME}</p>
            <p>{APP_TAGLINE}</p>
          </div>
        </FadeIn>

        <div className="max-w-md space-y-8">
          <FadeIn className="space-y-3">
            <h2 className="text-3xl font-bold leading-tight xl:text-4xl text-gradient-brand">
              Inteligencia agrícola para decisiones en el campo
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              Plataforma de monitoreo, análisis satelital y validación científica
              para cultivos en América Latina.
            </p>
          </FadeIn>

          <StaggerList className="space-y-4">
            {features.map(({ icon: Icon, title: featureTitle, description }) => (
              <li key={featureTitle} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/25">
                  <Icon className="h-5 w-5 text-primary" aria-hidden />
                </div>
                <div>
                  <p className="font-medium text-foreground">{featureTitle}</p>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </li>
            ))}
          </StaggerList>
        </div>

        <p className="text-xs text-muted-foreground/70">
          Datos satelitales vía Copernicus · Hackathon Seguridad Alimentaria 2026
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-10">
        <div className="mb-8 flex flex-col items-center gap-2 lg:hidden">
          <AuraLogo variant="mark" size={44} priority />
          <span className="text-lg font-bold">{APP_NAME}</span>
        </div>

        <FadeIn className="w-full max-w-md space-y-6">
          <div className="space-y-1 text-center lg:text-left">
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <div className="glass-card rounded-2xl border p-6 shadow-xl shadow-black/25 sm:p-8">
            {children}
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
