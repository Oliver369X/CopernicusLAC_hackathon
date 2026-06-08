'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageContainer, PageHeader } from '@/components/layout/page-header';
import { StaggerList } from '@/components/ui/motion';
import { listScienceCrops } from '@/lib/science/crops/registry';
import {
  FlaskConical,
  Wheat,
  Sprout,
  Leaf,
  Coffee,
  TreeDeciduous,
  BookOpen,
  Microscope,
  ArrowRight,
  GitCompareArrows,
  Building2,
  Satellite,
} from 'lucide-react';
import { getDemoTourLinks } from '@/lib/integrations/geodata/demo-scenarios';
import { ScienceLabTour, ScienceLabTourTrigger } from '@/components/onboarding/science-lab-tour';
import { usePlainExperience } from '@/hooks/use-plain-experience';
import type { ScienceCropId } from '@/lib/science/types';
import type { LucideIcon } from 'lucide-react';

const icons: Record<ScienceCropId, LucideIcon> = {
  soybean: Leaf,
  wheat: Wheat,
  corn: Sprout,
  coffee: Coffee,
  cacao: TreeDeciduous,
};

const cropColors: Record<ScienceCropId, string> = {
  soybean: 'from-primary/12 to-transparent border-primary/25 hover:border-primary/45',
  wheat: 'from-secondary/12 to-transparent border-secondary/25 hover:border-secondary/45',
  corn: 'from-accent/12 to-transparent border-accent/25 hover:border-accent/45',
  coffee: 'from-primary/8 via-secondary/8 to-transparent border-primary/20 hover:border-primary/40',
  cacao: 'from-secondary/10 to-transparent border-secondary/25 hover:border-secondary/45',
};

const SMALLHOLDER_CROPS: ScienceCropId[] = ['soybean', 'corn', 'wheat'];

export function ScienceHubClient() {
  const { plain } = usePlainExperience();
  const simpleMode = plain;
  const allCrops = listScienceCrops();
  const crops = simpleMode
    ? allCrops.filter((c) => SMALLHOLDER_CROPS.includes(c.crop))
    : allCrops;

  return (
    <PageContainer size="wide">
      <ScienceLabTour simpleMode={simpleMode} />
      <PageHeader
        title={simpleMode ? 'Cómo va mi cultivo' : undefined}
        description={
          simpleMode
            ? 'Elegí tu cultivo y seguí cómo evoluciona tu parcela — sin tecnicismos.'
            : 'Firma temporal multisensor (Sentinel-2 + Sentinel-1 + LST). Soja, trigo, maíz, café y cacao con fusión por reglas y ML baseline en paralelo.'
        }
        badge={
          simpleMode ? undefined : (
          <Badge variant="secondary" className="gap-1">
            <FlaskConical className="h-3 w-3" />
            Copernicus
          </Badge>
          )
        }
        actions={<ScienceLabTourTrigger simpleMode={simpleMode} />}
      />

      {simpleMode && (
        <Card className="glass-card border-emerald-500/25 bg-emerald-500/5 mb-4">
          <CardContent className="py-3 text-sm text-muted-foreground">
            <strong className="text-foreground">Seguridad alimentaria:</strong> monitorear tu parcela
            desde el satélite permite detectar estrés del cultivo antes de perder cosecha — clave para
            familias y cooperativas en San Julián.
          </CardContent>
        </Card>
      )}

      {simpleMode && (
        <Card className="glass-card border-amber-500/25 bg-gradient-to-br from-amber-500/5 to-transparent mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Satellite className="h-4 w-4 text-amber-600" />
              Empezá acá — Lab de tu parcela
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {SMALLHOLDER_CROPS.map((crop) => {
              const tour = getDemoTourLinks(crop);
              const label = crop === 'soybean' ? 'Soja' : crop === 'corn' ? 'Maíz' : 'Trigo';
              return (
                <Link key={crop} href={tour.smallholder}>
                  <Badge variant="outline" className="cursor-pointer hover:bg-amber-500/10 px-3 py-1.5">
                    {label} · Experimentos
                  </Badge>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      )}

      <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {crops.map((c) => {
          const Icon = icons[c.crop];
          const href = simpleMode
            ? getDemoTourLinks(c.crop).smallholder
            : `/science/${c.crop}`;
          return (
            <li key={c.crop}>
              <Link href={href} className="group block h-full">
                <Card
                  className={`h-full glass-card bg-gradient-to-br transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 ${cropColors[c.crop]}`}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-lg">
                      <span className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        {c.displayName}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p className="text-sm italic text-foreground/80">{c.scientificName}</p>
                    <p className="leading-relaxed">
                      <span className="font-medium text-foreground/90">Óptico:</span>{' '}
                      {c.primaryOptical.slice(0, 3).map((i) => i.label).join(', ')}…
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </li>
          );
        })}
      </StaggerList>

      {!simpleMode && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
          <Card className="glass-card md:col-span-2 lg:col-span-3 border-violet-500/25 bg-gradient-to-br from-violet-500/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4 text-violet-600" />
                Demo San Julián · pequeño vs grande productor
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                En el Lab (<strong>Experimentos</strong>), el paso 0 carga inteligencia histórica de
                Data-Historica. Compará cooperativa Aura Agro (~650 ha, zonas SJ) vs Finca María
                (19 ha, parcelas PF) con el botón <strong>Comparar escala</strong>.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {SMALLHOLDER_CROPS.map((crop) => {
                  const tour = getDemoTourLinks(crop);
                  const label = crop === 'soybean' ? 'Soja' : crop === 'corn' ? 'Maíz' : 'Trigo';
                  return (
                    <div key={crop} className="rounded-lg border p-3 space-y-2">
                      <p className="font-medium">{label}</p>
                      <div className="flex flex-wrap gap-2">
                        <Link href={tour.cooperative}>
                          <Badge variant="outline" className="cursor-pointer hover:bg-sky-500/10">
                            Cooperativa
                          </Badge>
                        </Link>
                        <Link href={tour.smallholder}>
                          <Badge variant="outline" className="cursor-pointer hover:bg-amber-500/10">
                            Finca María
                          </Badge>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <CooperativeExtras />
        </div>
      )}

      {simpleMode && (
        <Card className="glass-card mt-4 border-violet-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GitCompareArrows className="h-4 w-4 text-violet-600" />
              ¿Cómo se compara tu chacra?
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>
              En <strong>Experimentos → Comparar escala</strong> podés ver tu parcela PF al lado de
              la cooperativa del municipio (misma región SC-BO).
            </p>
            <Link
              href={getDemoTourLinks('soybean').smallholder}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary"
            >
              Abrir soja en Lab
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardContent>
        </Card>
      )}

      <Card className="glass-card mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4 text-primary" />
            Documentación
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <Link
            href="/science/bibliography"
            className="inline-flex items-center gap-1.5 font-medium text-primary hover:text-primary/80"
          >
            Ver referencias
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardContent>
      </Card>
    </PageContainer>
  );
}

function CooperativeExtras() {
  return (
    <>
      <Card className="glass-card group hover:border-primary/30 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GitCompareArrows className="h-4 w-4 text-primary" />
            Comparar cultivos
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            Abre el mismo campo en dos labs para contrastar índices y scores.
          </p>
          <Link
            href="/science/compare"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary"
          >
            Abrir comparador
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardContent>
      </Card>

      <Card className="glass-card group hover:border-primary/30 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Microscope className="h-4 w-4 text-primary" />
            Estudios y validación
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <Link
            href="/science/studies"
            className="inline-flex items-center gap-1.5 font-medium text-primary"
          >
            Ir a estudios
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardContent>
      </Card>
    </>
  );
}
