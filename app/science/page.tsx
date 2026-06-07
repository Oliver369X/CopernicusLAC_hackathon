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
} from 'lucide-react';
import { getDemoTourLinks } from '@/lib/integrations/geodata/demo-scenarios';
import type { ScienceCropId } from '@/lib/science/types';
import type { LucideIcon } from 'lucide-react';

const icons: Record<ScienceCropId, LucideIcon> = {
  soybean: Leaf,
  wheat: Wheat,
  corn: Sprout,
  coffee: Coffee,
  cacao: TreeDeciduous,
};

/** Acento sutil por cultivo — paleta Copernicus (primary / secondary / accent) */
const cropColors: Record<ScienceCropId, string> = {
  soybean: 'from-primary/12 to-transparent border-primary/25 hover:border-primary/45',
  wheat: 'from-secondary/12 to-transparent border-secondary/25 hover:border-secondary/45',
  corn: 'from-accent/12 to-transparent border-accent/25 hover:border-accent/45',
  coffee: 'from-primary/8 via-secondary/8 to-transparent border-primary/20 hover:border-primary/40',
  cacao: 'from-secondary/10 to-transparent border-secondary/25 hover:border-secondary/45',
};

export default function ScienceHubPage() {
  const crops = listScienceCrops();

  return (
    <PageContainer size="wide">
      <PageHeader
        description="Firma temporal multisensor (Sentinel-2 + Sentinel-1 + LST). Soja, trigo, maíz, café y cacao con fusión por reglas y ML baseline en paralelo."
        badge={
          <Badge variant="secondary" className="gap-1">
            <FlaskConical className="h-3 w-3" />
            Copernicus
          </Badge>
        }
      />

      <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {crops.map((c) => {
          const Icon = icons[c.crop];
          return (
            <li key={c.crop}>
            <Link href={`/science/${c.crop}`} className="group block h-full">
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
                  <p className="leading-relaxed">
                    <span className="font-medium text-foreground/90">Radar:</span> DpRVI, RVI, VH/VV
                    {c.crop === 'coffee' || c.crop === 'cacao' ? ', texturas SAR' : ''}
                  </p>
                </CardContent>
              </Card>
            </Link>
            </li>
          );
        })}
      </StaggerList>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
              (19 ha, parcelas PF) con el botón <strong>Comparar escala</strong>. Activá{' '}
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">GEODATA_ENABLED=true</code>{' '}
              apuntando al servidor prod.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {(['soybean', 'corn', 'wheat'] as const).map((crop) => {
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

        <Card className="glass-card group hover:border-primary/30 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GitCompareArrows className="h-4 w-4 text-primary" />
              Comparar cultivos
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              Abre el mismo campo en dos labs (ej. soja vs maíz) con la misma fecha de satélite
              para contrastar índices y scores.
            </p>
            <div className="flex flex-wrap gap-2">
              {(['soybean', 'wheat', 'corn'] as const).map((crop) => (
                <Link key={crop} href={`/science/${crop}`}>
                  <Badge variant="outline" className="hover:bg-primary/10 hover:border-primary/30 cursor-pointer transition-colors">
                    {crop === 'soybean' ? 'Soja' : crop === 'wheat' ? 'Trigo' : 'Maíz'}
                  </Badge>
                </Link>
              ))}
            </div>
            <Link
              href="/science/compare"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
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
          <CardContent className="text-sm space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              Experimentos, etiquetas de campo y métricas de concordancia reglas vs ML.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/science/studies"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Ir a estudios
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/science/compare"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Comparar cultivos
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4 text-primary" />
            Documentación de investigación
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          <p className="text-muted-foreground">
            Bibliografía y protocolos en{' '}
            <code className="text-xs bg-muted/80 px-2 py-0.5 rounded-md font-mono">
              docs/research/multisensor-agriculture/
            </code>
          </p>
          <Link
            href="/science/bibliography"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Ver referencias en la app
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
