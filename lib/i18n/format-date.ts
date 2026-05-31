/**
 * Formato de fecha estable SSR/cliente (evita hydration mismatch con toLocaleString).
 * Usa componentes UTC para que servidor y navegador coincidan.
 */

function toDate(input: Date | string | number): Date {
  return input instanceof Date ? input : new Date(input);
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** dd/mm/yyyy, HH:mm (24h) en UTC */
export function formatDateTimeEs(input: Date | string | number): string {
  const d = toDate(input);
  if (Number.isNaN(d.getTime())) return '—';

  const day = pad2(d.getUTCDate());
  const month = pad2(d.getUTCMonth() + 1);
  const year = d.getUTCFullYear();
  const hours = pad2(d.getUTCHours());
  const minutes = pad2(d.getUTCMinutes());

  return `${day}/${month}/${year}, ${hours}:${minutes}`;
}

/** Solo fecha dd/mm/yyyy UTC */
export function formatDateEs(input: Date | string | number): string {
  const d = toDate(input);
  if (Number.isNaN(d.getTime())) return '—';

  return `${pad2(d.getUTCDate())}/${pad2(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
}
