/**
 * Inteligencia de entreno (fase E): leer los datos y aconsejar como un entrenador.
 * Todo lógica pura y testeable. Tono educativo y sin ansiedad (regla de producto).
 */

export interface StallStatus {
  /** ¿Hay suficientes sesiones para juzgar? */
  enoughData: boolean;
  /** Nº de sesiones desde la última marca (PR de 1RM estimado). */
  sessionsSincePR: number;
  /** Estancado: varias sesiones sin batir marca. */
  stalled: boolean;
}

const PR_TOLERANCE = 0.1; // kg; evita que el ruido cuente como nueva marca

/**
 * Detecta estancamiento a partir de la serie de 1RM estimado por sesión (en orden
 * cronológico). Cuenta cuántas sesiones llevas sin batir tu mejor marca.
 */
export function detectStall(e1rmBySession: number[], window = 3): StallStatus {
  if (e1rmBySession.length < window + 1) {
    return { enoughData: false, sessionsSincePR: 0, stalled: false };
  }
  let lastPrIdx = 0;
  let runMax = e1rmBySession[0];
  for (let i = 1; i < e1rmBySession.length; i++) {
    if (e1rmBySession[i] > runMax + PR_TOLERANCE) {
      lastPrIdx = i;
      runMax = e1rmBySession[i];
    }
  }
  const sessionsSincePR = e1rmBySession.length - 1 - lastPrIdx;
  return { enoughData: true, sessionsSincePR, stalled: sessionsSincePR >= window };
}

export interface Advice {
  /** Tipo de aviso, por si la UI quiere icono/color. */
  kind: 'deload' | 'welcome-back';
  text: string;
}

/** Consejo de descarga (deload) si el ejercicio lleva estancado. */
export function deloadAdvice(exerciseName: string, stall: StallStatus): Advice | null {
  if (!stall.enoughData || !stall.stalled) return null;
  return {
    kind: 'deload',
    text: `Llevas ${stall.sessionsSincePR} sesiones sin batir tu marca en ${exerciseName}. Suele ser fatiga acumulada, no falta de ganas: prueba una semana de descarga (baja ~10 % el peso o quita una serie y sube el RIR) y volverás más fuerte. 🔋`,
  };
}

/**
 * Mensaje de "memoria muscular" al volver tras un parón. El músculo se recupera
 * mucho más rápido de lo que costó ganarlo: mensaje motivador, sin culpa.
 */
export function welcomeBackAdvice(daysSinceLastSession: number): Advice | null {
  if (daysSinceLastSession < 10) return null;
  const weeks = Math.round(daysSinceLastSession / 7);
  return {
    kind: 'welcome-back',
    text: `¡Bienvenido de vuelta! Han pasado ~${weeks} ${weeks === 1 ? 'semana' : 'semanas'}. Gracias a la memoria muscular recuperarás tu nivel mucho más rápido de lo que costó ganarlo. Empieza con algo menos de peso y sin prisa.`,
  };
}
