/** Descarga el informe PDF vía fetch + blob (evita navegar a JSON de error). */
export async function downloadReportPdf(): Promise<void> {
  const res = await fetch('/api/reports/pdf', { credentials: 'include' });
  const contentType = res.headers.get('Content-Type') ?? '';

  if (!res.ok || !contentType.includes('application/pdf')) {
    let message = 'No se pudo generar el informe PDF';
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      // respuesta no JSON
    }
    throw new Error(message);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'aura-informe.pdf';
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
