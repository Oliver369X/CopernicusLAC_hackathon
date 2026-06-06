'use client';

import Link from 'next/link';
import {
  Satellite,
  Camera,
  Bell,
  FlaskConical,
  Users,
  Map,
  Bot,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { APP_NAME, APP_TAGLINE } from '@/lib/constants/app-brand';

const FEATURES = [
  {
    icon: Satellite,
    title: 'Monitoreo Copernicus',
    description:
      'NDVI, NDMI, humedad radar S1 y temperatura S3 por zona, con mapas y tendencias históricas.',
    href: '/monitor',
    ready: true,
  },
  {
    icon: Bell,
    title: 'Alertas inteligentes',
    description:
      'Reglas por cultivo y etapa fenológica: estrés hídrico, caída de NDVI y riesgo térmico.',
    href: '/alerts',
    ready: true,
  },
  {
    icon: Bot,
    title: 'Asistente agrícola',
    description:
      'Resúmenes satelitales en lenguaje natural, zonas de estrés y guía demo para el equipo.',
    href: '/insights',
    ready: true,
  },
  {
    icon: Camera,
    title: 'Observaciones de campo',
    description:
      'Captura fotos con GPS, diagnóstico asistido y historial unificado online y offline.',
    href: '/field/capture',
    ready: true,
  },
  {
    icon: FlaskConical,
    title: 'Laboratorio multisensor',
    description:
      'Fusión óptica + radar + LST para soja, maíz, trigo y otros cultivos del portafolio.',
    href: '/science',
    ready: true,
  },
  {
    icon: Users,
    title: 'Gestión de finca',
    description:
      'Importación de parcelas, roles de equipo, asignación de zonas e invitaciones.',
    href: '/gestion',
    ready: true,
  },
] as const;

const COMING_SOON = [
  'App móvil nativa (iOS / Android) con modo sin conexión ampliado',
  'Pronóstico de rendimiento y ROI por lote con modelos ML',
  'Integración ERP y facturación de insumos',
  'Reportes PDF automáticos para cooperativas y financiadores',
  'API pública para socios y marketplaces agrotech',
] as const;

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/80 bg-card/50 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="font-semibold tracking-tight text-foreground">
            {APP_NAME}
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Iniciar sesión</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">Crear cuenta</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <Badge variant="secondary" className="mb-4 font-normal">
            Copernicus LAC · Hackathon Aura
          </Badge>
          <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Monitoreo agrícola profesional, de la órbita al lote
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{APP_TAGLINE}</p>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Una plataforma para productores, analistas y equipos de campo: satélite, alertas,
            ciencia de cultivos y registro fotográfico en un solo panel.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href="/login">
                Entrar al panel
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/monitor">Ver demo de monitoreo</Link>
            </Button>
          </div>
        </section>

        <section className="border-t border-border/60 bg-muted/20 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-xl font-semibold sm:text-2xl">Qué podés hacer hoy</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Módulos disponibles en producción para pilotos y demostraciones.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <Card key={f.title} className="border-border/80 bg-card">
                  <CardHeader className="pb-2">
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <f.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base font-semibold">{f.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm leading-relaxed text-muted-foreground">{f.description}</p>
                    <Button variant="link" className="h-auto p-0 text-sm" asChild>
                      <Link href={f.href}>
                        Abrir módulo
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="planes" className="border-t border-border/60 bg-muted/10 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-xl font-semibold sm:text-2xl">Planes</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Dos modelos: pequeña agricultora por hectáreas o cooperativa por zonas de manejo.
              Precios estimados en UI; cobro real próximamente.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  id: 'free',
                  name: 'Gratis',
                  ha: 'Hasta 5 ha',
                  price: '$0/mes',
                  zones: '1 zona / parcela',
                  audience: 'Arranque sin costo',
                },
                {
                  id: 'growth',
                  name: 'Crecimiento',
                  ha: 'Hasta 20 ha',
                  price: '$1/ha/mes',
                  zones: '1 zona / parcela',
                  audience: 'Productoras en expansión',
                },
                {
                  id: 'scale',
                  name: 'Escala',
                  ha: 'Hasta 50 ha',
                  price: '$0.50/ha/mes',
                  zones: 'Hasta 2 zonas',
                  audience: 'Fincas familiares',
                },
                {
                  id: 'cooperative',
                  name: 'Cooperativa',
                  ha: '51–500 ha',
                  price: 'Piloto BID',
                  zones: '4+ zonas / lote',
                  audience: 'Cooperativas y medianas',
                },
              ].map((plan) => (
                <Card key={plan.id} className="border-border/80 bg-card flex flex-col">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{plan.name}</CardTitle>
                    <p className="text-2xl font-semibold text-primary">{plan.price}</p>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-2 text-sm text-muted-foreground">
                    <p>{plan.ha}</p>
                    <p>{plan.zones}</p>
                    <p className="text-xs">{plan.audience}</p>
                    <Button className="mt-auto w-full" size="sm" asChild>
                      <Link href={`/register?plan=${plan.id === 'cooperative' ? 'cooperative' : 'free'}`}>
                        Empezar
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-semibold sm:text-2xl">
                <Map className="h-6 w-6 text-primary" />
                Flujo típico de una finca
              </h2>
              <ol className="mt-6 space-y-4 text-sm text-muted-foreground">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-medium text-primary">
                    1
                  </span>
                  Importá parcelas (GeoJSON, KML, Shapefile o CSV) y definí zonas de manejo.
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-medium text-primary">
                    2
                  </span>
                  El worker sincroniza lecturas Copernicus y genera narrativas por zona.
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-medium text-primary">
                    3
                  </span>
                  Revisá el monitor, alertas y el asistente; registrá observaciones en campo.
                </li>
              </ol>
            </div>

            <Card className="border-dashed border-border bg-muted/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  Próximamente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {COMING_SOON.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="text-primary">·</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="border-t border-border/60 bg-card/40 py-12">
          <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
            <p className="text-sm text-muted-foreground">
              ¿Listo para probar? Usá las cuentas demo en login o creá tu organización.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link href="/login">Iniciar sesión</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/privacidad">Política de privacidad</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
