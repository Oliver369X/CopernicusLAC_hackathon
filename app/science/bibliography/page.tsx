import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageContainer, PageHeader } from '@/components/layout/page-header';
import { BookOpen, ExternalLink } from 'lucide-react';
import { getCropLabelEs } from '@/lib/design/tokens';

const PAPERS = [
  {
    title: 'Mandal et al. 2020 — DpRVI',
    url: 'https://www.sciencedirect.com/science/article/abs/pii/S0034425720303242',
    crop: 'Trigo / cereales',
  },
  {
    title: 'Flores et al. 2025 — Fenología S1',
    url: 'https://www.tandfonline.com/doi/full/10.1080/15481603.2025.2531593',
    crop: 'Multicultivo',
  },
  {
    title: 'Meroni et al. 2021 — Fenología S1+S2',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7841528/',
    crop: 'Europa',
  },
  {
    title: 'Mouret et al. 2020 — Outliers parcela trigo',
    url: 'https://arxiv.org/abs/2004.08431',
    crop: 'Trigo',
  },
  {
    title: 'Maskell et al. 2021 — Café Vietnam',
    url: 'https://www.sciencedirect.com/science/article/abs/pii/S0034425721004296',
    crop: getCropLabelEs('coffee'),
  },
  {
    title: 'Abu et al. 2021 — Cacao CI/Ghana',
    url: 'https://pubmed.ncbi.nlm.nih.gov/34602863/',
    crop: getCropLabelEs('cacao'),
  },
];

export default function ScienceBibliographyPage() {
  return (
    <PageContainer size="narrow">
      <PageHeader description="Referencias clave para índices multisensor (S1/S2) y protocolos del laboratorio. Copia local en docs/research/multisensor-agriculture/." />

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <BookOpen className="h-5 w-5 shrink-0 text-primary" />
            Artículos clave
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {PAPERS.map((p) => (
            <div
              key={p.url}
              className="rounded-lg border border-border/60 bg-muted/20 p-4 text-sm"
            >
              <p className="font-medium text-foreground">{p.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{p.crop}</p>
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80"
              >
                Abrir enlace
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </a>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button variant="outline" className="h-10" asChild>
        <Link href="/science">← Volver al laboratorio</Link>
      </Button>
    </PageContainer>
  );
}
