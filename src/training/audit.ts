import { shoulderOverlapAdvice, type Advice } from './intelligence';
import { muscleVolumeStatus, weeklyMuscleVolume, type VolumeItem } from './volume';

export type AuditExercise = VolumeItem & { pattern: string };
export interface AuditDay {
  name: string;
  exercises: AuditExercise[];
}

const BIG_MUSCLES = ['pecho', 'espalda', 'pierna'];

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

/**
 * Auditoría educativa de una rutina (generada o editada): volumen semanal por
 * músculo, músculos grandes olvidados y solapamiento de hombro. Solo devuelve
 * info/warn; nunca bloquea nada.
 */
export function auditRoutine(days: AuditDay[]): Advice[] {
  const out: Advice[] = [];
  const items = days.flatMap((d) => d.exercises);
  const vol = weeklyMuscleVolume(items);

  for (const [muscle, sets] of Object.entries(vol).sort((a, b) => b[1] - a[1])) {
    const st = muscleVolumeStatus(muscle, sets);
    if (st.level === 'warn') out.push({ kind: 'volumen-alto', text: `${cap(muscle)}: ${st.text}` });
    else if (st.level === 'info') out.push({ kind: 'volumen-bajo', text: `${cap(muscle)}: ${st.text}` });
  }

  for (const m of BIG_MUSCLES) {
    if (!vol[m]) {
      out.push({
        kind: 'musculo-olvidado',
        text: `Esta semana no hay trabajo de ${m}. Si es a propósito (molestias, prioridades), perfecto; si no, con un par de ejercicios lo mantienes.`,
      });
    }
  }

  const sh = shoulderOverlapAdvice(days.map((d) => ({ name: d.name, exercises: d.exercises })));
  if (sh) out.push(sh);
  return out;
}
