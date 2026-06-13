import { exerciseSetWarning, exerciseSetCap, weeklyVolumeRange, muscleVolumeStatus, secondaryMuscles, weeklyMuscleVolume } from './volume';

test('tope de series por ejercicio', () => {
  expect(exerciseSetCap(3)).toBe(5);
  expect(exerciseSetCap(4)).toBe(6);
});

test('no avisa dentro del tope, avisa al pasarse', () => {
  expect(exerciseSetWarning(4, 3).level).toBe('ok');
  expect(exerciseSetWarning(5, 3).level).toBe('ok');
  expect(exerciseSetWarning(6, 3).level).toBe('warn');
});

test('rango semanal según tamaño del músculo', () => {
  expect(weeklyVolumeRange('pecho')).toEqual({ min: 10, max: 20 });
  expect(weeklyVolumeRange('biceps')).toEqual({ min: 8, max: 15 });
});

test('estado del volumen semanal: poco / óptimo / demasiado', () => {
  expect(muscleVolumeStatus('pecho', 14).level).toBe('ok');
  expect(muscleVolumeStatus('pecho', 6).level).toBe('info');
  expect(muscleVolumeStatus('pecho', 24).level).toBe('warn');
  expect(muscleVolumeStatus('biceps', 0).level).toBe('ok'); // sin planificar, sin alarma
});

test('secondaryMuscles de un compuesto', () => {
  expect(secondaryMuscles('Press banca')).toEqual(['hombro', 'triceps']);
  expect(secondaryMuscles('Curl bíceps')).toEqual([]);
});

test('weeklyMuscleVolume suma primario entero y secundarios a medias', () => {
  const v = weeklyMuscleVolume([
    { name: 'Press banca', muscleGroup: 'pecho', targetSets: 4 },
    { name: 'Elevaciones laterales', muscleGroup: 'hombro', targetSets: 3 },
  ]);
  expect(v.pecho).toBe(4);
  expect(v.hombro).toBe(5); // 3 directas + 2 (mitad de las 4 de press)
  expect(v.triceps).toBe(2); // mitad de las 4 de press
});
