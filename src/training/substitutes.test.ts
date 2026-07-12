import { substitutesFor } from './substitutes';
import type { NamedExercise } from './recommend';

// Catálogo mínimo con metadatos reales de exercise-meta.ts (pecho + un intruso de espalda).
const CATALOG: NamedExercise[] = [
  { name: 'Press inclinado', muscleGroup: 'pecho' },          // superior · dumbbell · compound
  { name: 'Press inclinado con barra', muscleGroup: 'pecho' }, // superior · barbell · compound
  { name: 'Press banca', muscleGroup: 'pecho' },               // medio · barbell · compound
  { name: 'Press plano mancuerna', muscleGroup: 'pecho' },     // medio · dumbbell · compound
  { name: 'Aperturas', muscleGroup: 'pecho' },                 // estiramiento · dumbbell
  { name: 'Cruces en polea', muscleGroup: 'pecho' },           // estiramiento · cable
  { name: 'Contractora de pecho', muscleGroup: 'pecho' },      // estiramiento · machine
  { name: 'Fondos', muscleGroup: 'pecho' },                    // inferior · bodyweight · compound
  { name: 'Press de pecho en máquina', muscleGroup: 'pecho' }, // medio · machine · compound
  { name: 'Remo barra', muscleGroup: 'espalda' },
];

describe('substitutesFor', () => {
  it('ordena: misma región y material → misma región → mismo músculo', () => {
    const subs = substitutesFor('Press banca', CATALOG, 'gym');
    // Press banca es medio+barbell. Único medio+barbell más: ninguno (los otros medios son dumbbell/machine).
    // Primero los de misma región (medio), luego el resto del músculo.
    const names = subs.map((s) => s.name);
    expect(names.slice(0, 2).sort()).toEqual(['Press de pecho en máquina', 'Press plano mancuerna'].sort());
    expect(names).not.toContain('Remo barra');
  });

  it('nunca devuelve el propio ejercicio', () => {
    const subs = substitutesFor('Press banca', CATALOG, 'gym');
    expect(subs.map((s) => s.name)).not.toContain('Press banca');
  });

  it('respeta el material disponible', () => {
    const subs = substitutesFor('Press banca', CATALOG, 'bodyweight');
    expect(subs.map((s) => s.name)).toEqual(['Fondos']);
  });

  it('limita a 6 sugerencias', () => {
    // CATALOG tiene 8 candidatos de pecho válidos para 'Press banca' en gym
    // (los 9 de pecho menos él mismo); el tope de 6 sí se alcanza.
    const subs = substitutesFor('Press banca', CATALOG, 'gym');
    expect(subs.length).toBe(6);
  });

  it('la misma región va antes que el resto del músculo', () => {
    const subs = substitutesFor('Aperturas', CATALOG, 'gym'); // estiramiento · dumbbell
    // En el catálogo de prueba no hay otro dumbbell+estiramiento, así que el primer
    // bloque es "misma zona, distinto material" (Cruces en polea / Contractora).
    expect(subs[0].reason).toBe('misma zona, distinto material');
    expect(['Cruces en polea', 'Contractora de pecho']).toContain(subs[0].name);
  });

  it('ejercicio sin metadatos cae a "mismo músculo"', () => {
    const cat = [...CATALOG, { name: 'Inventado', muscleGroup: 'pecho' }];
    const subs = substitutesFor('Inventado', cat, 'gym');
    expect(subs.length).toBeGreaterThan(0);
    expect(subs.every((s) => s.reason === 'mismo músculo')).toBe(true);
  });
});
