import { PageContainer, PageHeader } from '@/components/layout/page-header';

export default function PrivacidadPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Política de privacidad"
        description="Doctor Soya — datos agrícolas y personales (piloto BID LAC)."
      />
      <article className="prose prose-invert max-w-none text-sm space-y-4 text-muted-foreground">
        <p>
          Recopilamos email, teléfono opcional (WhatsApp), geometrías de parcelas y lecturas
          satelitales Copernicus para generar alertas y narrativas agronómicas.
        </p>
        <p>
          Los datos se almacenan en servidores contratados por Aura Experience, aislados por
          organización (finca). No vendemos datos a terceros. Podés solicitar exportación o
          eliminación escribiendo a soporte@doctorsoya.app.
        </p>
        <p>
          Al registrarte aceptás el tratamiento descrito para operar el piloto. Las imágenes de
          campo subidas desde la app móvil se asocian a tu cuenta y zona asignada.
        </p>
        <p className="text-xs">Última actualización: junio 2026 · Versión piloto BID.</p>
      </article>
    </PageContainer>
  );
}
