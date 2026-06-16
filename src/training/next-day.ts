export interface DayRef {
  id: number;
  name: string;
}

/**
 * Sugiere el siguiente día de entreno: el que va después del último entrenado
 * (en orden, de forma cíclica). Si no has entrenado aún, el primero.
 */
export function nextDay(days: DayRef[], lastDayId: number | null): DayRef | null {
  if (days.length === 0) return null;
  if (lastDayId == null) return days[0];
  const i = days.findIndex((d) => d.id === lastDayId);
  if (i === -1) return days[0];
  return days[(i + 1) % days.length];
}
