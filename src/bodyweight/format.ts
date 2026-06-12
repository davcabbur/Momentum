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

/** "principios/mediados/finales de <mes>" según el día. Tono orientativo, sin fecha exacta. */
export function friendlyMonth(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00Z');
  const day = d.getUTCDate();
  const mes = MESES[d.getUTCMonth()];
  const franja = day <= 10 ? 'principios' : day <= 20 ? 'mediados' : 'finales';
  return `${franja} de ${mes}`;
}
