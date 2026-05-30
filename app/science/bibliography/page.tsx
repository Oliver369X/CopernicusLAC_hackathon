import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
    crop: 'Café (futuro)',
  },
  {
    title: 'Abu et al. 2021 — Cacao CI/Ghana',
    url: 'https://pubmed.ncbi.nlm.nih.gov/34602863/',
    crop: 'Cacao (futuro)',
  },
];

export default function ScienceBibliographyPage() {
  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Bibliografía científica</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Copia local en <code>docs/research/multisensor-agriculture/</code>
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Artículos clave</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {PAPERS.map((p) => (
            <div key={p.url} className="border rounded-lg p-3 text-sm">
              <p className="font-medium">{p.title}</p>
              <p className="text-xs text-muted-foreground">{p.crop}</p>
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary text-xs underline break-all"
              >
                {p.url}
              </a>
            </div>
          ))}
        </CardContent>
      </Card>
      <Button variant="outline" asChild>
        <Link href="/science">← Volver al laboratorio</Link>
      </Button>
    </div>
  );
}
