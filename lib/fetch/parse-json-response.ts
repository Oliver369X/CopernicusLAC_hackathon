export interface ParsedJsonResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

/**
 * Parses a fetch Response body safely (empty body, HTML errors, invalid JSON).
 */
export async function parseJsonResponse<T>(
  res: Response,
  fallback?: T
): Promise<ParsedJsonResponse<T>> {
  const status = res.status;
  let text = '';

  try {
    text = await res.text();
  } catch {
    return {
      data: fallback ?? null,
      error: 'No se pudo leer la respuesta del servidor',
      status,
    };
  }

  const trimmed = text.trim();
  if (!trimmed) {
    const message =
      status >= 500
        ? 'Error interno del servidor (respuesta vacía)'
        : status >= 400
          ? `Solicitud rechazada (HTTP ${status})`
          : 'Respuesta vacía del servidor';
    return { data: fallback ?? null, error: message, status };
  }

  try {
    const data = JSON.parse(trimmed) as T;
    if (!res.ok) {
      const errObj = data as { error?: string };
      return {
        data: fallback ?? null,
        error: errObj?.error ?? `HTTP ${status}`,
        status,
      };
    }
    return { data, error: null, status };
  } catch {
    return {
      data: fallback ?? null,
      error: 'Respuesta no válida del servidor',
      status,
    };
  }
}
