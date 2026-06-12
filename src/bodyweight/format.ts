const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/** Peso con una decimal y coma decimal (es-ES). Ej: "78,4 kg". */
export function formatKg(kg: number): string {
  return `${kg.toFixed(1).replace('.', ',')} kg`;
}

/** Variación con flecha y signo. Ej: "▼ 0,5 kg". */
export function formatDelta(deltaKg: number): string {
  const arrow = deltaKg < 0 ? '▼' : deltaKg > 0 ? '▲' : '—';
  return `${arrow} ${Math.abs(deltaKg).toFixed(1).replace('.', ',')} kg`;
}

/** Fecha concreta en DD/MM/YYYY (es-ES). */
export function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}

/** 'DD/MM/AAAA' → 'YYYY-MM-DD', o null si no es una fecha válida. */
export function parseDmy(input: string): string | null {
  const m = input.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const d = Number(m[1]);
  const mo = Number(m[2]);
  const y = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** "principios/mediados/finales de <mes>" según el día. Tono orientativo, sin fecha exacta. */
export function friendlyMonth(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00Z');
  const day = d.getUTCDate();
  const mes = MESES[d.getUTCMonth()];
  const franja = day <= 10 ? 'principios' : day <= 20 ? 'mediados' : 'finales';
  return `${franja} de ${mes}`;
}
