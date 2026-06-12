export interface WeightInsightInput {
  /** Pendiente de la tendencia en kg/semana (negativo = bajando). */
  slopePerWeek: number;
  currentTrendKg: number;
  /** Objetivo de peso, o null si no hay. */
  goalKg: number | null;
}

export interface WeightInsight {
  title: string;
  body: string;
}

type TrendDir = 'down' | 'up' | 'flat';
type GoalDir = 'lose' | 'gain' | 'reached' | 'none';

const FLAT_THRESHOLD = 0.07; // kg/semana: por debajo de esto, "estable"

function trendDir(slopePerWeek: number): TrendDir {
  if (slopePerWeek <= -FLAT_THRESHOLD) return 'down';
  if (slopePerWeek >= FLAT_THRESHOLD) return 'up';
  return 'flat';
}

function goalDir(currentTrendKg: number, goalKg: number | null): GoalDir {
  if (goalKg == null) return 'none';
  if (goalKg < currentTrendKg - 0.3) return 'lose';
  if (goalKg > currentTrendKg + 0.3) return 'gain';
  return 'reached';
}

/**
 * Mensaje educativo adaptado a la dirección de la tendencia y al objetivo.
 * Tono siempre tranquilizador (regla de producto): nunca culpabiliza un dato puntual.
 */
export function weightInsight(input: WeightInsightInput): WeightInsight {
  const dir = trendDir(input.slopePerWeek);
  const goal = goalDir(input.currentTrendKg, input.goalKg);
  const pctPerWeek = input.currentTrendKg > 0 ? (input.slopePerWeek / input.currentTrendKg) * 100 : 0;

  if (goal === 'reached') {
    return {
      title: '¡Objetivo alcanzado! 🎉',
      body: 'Has llegado a tu objetivo de peso. Si quieres, define uno nuevo o pasa a mantenimiento para consolidar.',
    };
  }

  if (goal === 'lose') {
    if (dir === 'down') {
      if (pctPerWeek <= -1.0) {
        return {
          title: 'Cuidado, bajas muy rápido ⚠️',
          body: 'Perder más de ~1 % de tu peso por semana puede costarte músculo. Sube un poco las kcal y mantén la proteína alta: no hay prisa.',
        };
      }
      return {
        title: 'Vas perdiendo grasa 🔥',
        body: 'Tu tendencia baja hacia el objetivo a buen ritmo. Mantén la proteína alta y entrena fuerza para que lo que pierdas sea grasa, no músculo.',
      };
    }
    if (dir === 'up') {
      return {
        title: 'Has subido, pero tranquilo 💧',
        body: 'Buscas bajar y esta semana la tendencia sube. Suele ser agua, sal o la comida de ayer; no es grasa de un día. Si se mantiene varias semanas, ajustamos.',
      };
    }
    return {
      title: 'Estancamiento normal 🔁',
      body: 'Llevas unos días sin bajar. Es habitual: el cuerpo retiene agua y luego suelta de golpe. Mantén el rumbo, ya se moverá.',
    };
  }

  if (goal === 'gain') {
    if (dir === 'up') {
      if (pctPerWeek >= 1.0) {
        return {
          title: 'Subes rápido 🐂',
          body: 'Para ganar músculo minimizando grasa basta con ~0,25–0,5 % por semana. Puede que te sobren algunas kcal; no pasa nada por frenar un poco.',
        };
      }
      return {
        title: 'Ganando peso 💪',
        body: 'Subes de forma controlada hacia tu objetivo. Progresa en cargas en el gimnasio para que ese peso extra sea músculo.',
      };
    }
    if (dir === 'down') {
      return {
        title: 'Para ganar, come algo más 🍽️',
        body: 'Tu objetivo es subir, pero la tendencia baja. Necesitas un pequeño superávit de calorías. Cuando tengamos la nutrición, lo afinamos.',
      };
    }
    return {
      title: 'Sin cambios 🔁',
      body: 'Buscas ganar y el peso está plano. Probablemente te falte un poco de comida para empujar la subida.',
    };
  }

  // Sin objetivo definido: educación general según la tendencia.
  if (dir === 'down') {
    return {
      title: 'Tendencia a la baja 📉',
      body: 'Vas perdiendo peso de forma sostenida. Prioriza proteína y entrena fuerza para conservar músculo mientras bajas.',
    };
  }
  if (dir === 'up') {
    return {
      title: 'Tendencia al alza 📈',
      body: 'Estás ganando peso de forma sostenida. Si no es lo que buscas, define un objetivo y lo orientamos.',
    };
  }
  return {
    title: 'Peso estable ⚖️',
    body: 'Tu tendencia está plana: ni subes ni bajas. Define un objetivo si quieres una dirección clara.',
  };
}
