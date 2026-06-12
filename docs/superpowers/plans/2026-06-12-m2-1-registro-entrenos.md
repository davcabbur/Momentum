# M2.1 — Estructura y registro de entrenamientos · Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) o superpowers:executing-plans para implementar tarea a tarea. Los pasos usan checkbox (`- [ ]`).

**Goal:** Poder definir tu rutina (días + ejercicios de una biblioteca) y **registrar una sesión** de entreno con la pantalla **tabla + modo foco** (peso × reps × RIR × tipo de serie), viendo **"lo de la última vez"** y el **objetivo según tu nivel**. Todo persistido en local.

**Architecture:** Sigue el patrón de M1: tablas Drizzle + repos en `src/db/`, lógica pura testeada en `src/training/`, UI en `src/ui/` y rutas en `src/app/`. Se añade la pestaña **Entreno**. El flujo de Entreno (rutina → día → sesión → registro de series) se maneja con estado interno + hojas (modales), sin reestructurar la navegación todavía.

**Tech Stack:** Expo SDK 54, React Native, TypeScript, expo-sqlite + Drizzle, jest. (Sin dependencias nuevas.)

**Diseño de referencia:** `docs/superpowers/specs/2026-06-12-nucleo-seguimiento-design.md` (secciones 4.1, 5.2–5.4) y memoria `training-methodology`.

---

## Estructura de archivos (M2.1)

```
src/
├── db/
│   ├── schema.ts                # + exercise, routine, routine_day, routine_day_exercise,
│   │                            #   workout_session, set_log; + level en user_profile
│   ├── exercise-repo.ts         # catálogo (seed) + listar + crear custom
│   ├── routine-repo.ts          # rutina, días y ejercicios por día
│   └── workout-repo.ts          # sesiones, series y "lo de la última vez"
├── training/
│   └── levels.ts                # esquema series/reps/RIR por nivel (lógica pura)
├── ui/
│   ├── RoutineBuilder.tsx       # crear/editar rutina: nivel, días y ejercicios
│   ├── ExercisePicker.tsx       # elegir ejercicio de la biblioteca o crear custom
│   ├── SessionScreen.tsx        # lista de ejercicios del día → registrar
│   └── SetLogSheet.tsx          # tabla de series + modo foco (peso/reps/RIR/tipo)
└── app/
    └── entreno.tsx              # pestaña Entreno (home: días de la rutina)
```

---

## Fase A — Capa de datos

### Task A1: Esquema de entreno + nivel en el perfil

**Files:**
- Modify: `src/db/schema.ts`

- [ ] **Step 1: Añadir tablas y la columna `level`**

Añadir al final de `src/db/schema.ts` (antes del comentario del IMC), y añadir `level` a `userProfile`:

```ts
// En userProfile, añadir tras activityLevel:
//   level: text('level'), // 'principiante' | 'intermedio' | 'avanzado' (nullable)

export const exercise = sqliteTable('exercise', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  muscleGroup: text('muscle_group').notNull(), // pecho, espalda, pierna, hombro, biceps, triceps, core, otro
  pattern: text('pattern').notNull(), // empuje | tiron | pierna | otro
  isCustom: integer('is_custom', { mode: 'boolean' }).notNull().default(false),
});

export const routine = sqliteTable('routine', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
});

export const routineDay = sqliteTable('routine_day', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  routineId: integer('routine_id').notNull(),
  name: text('name').notNull(),
  orderIdx: integer('order_idx').notNull(),
});

export const routineDayExercise = sqliteTable('routine_day_exercise', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  routineDayId: integer('routine_day_id').notNull(),
  exerciseId: integer('exercise_id').notNull(),
  orderIdx: integer('order_idx').notNull(),
});

export const workoutSession = sqliteTable('workout_session', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull(), // YYYY-MM-DD
  routineDayId: integer('routine_day_id').notNull(),
});

export const setLog = sqliteTable('set_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: integer('session_id').notNull(),
  exerciseId: integer('exercise_id').notNull(),
  setNumber: integer('set_number').notNull(),
  weightKg: real('weight_kg').notNull(),
  reps: integer('reps').notNull(),
  rir: integer('rir'), // nullable
  setType: text('set_type').notNull().default('normal'), // warmup | top | backoff | normal
});
```

> Nota: la columna se llama `order_idx` (no `order`) porque `order` es palabra reservada en SQL. Todas las columnas nuevas que se añaden a tablas existentes (`level`) son **nullable** para que el `ALTER ADD` no falle en BD con filas (lección de M1).

- [ ] **Step 2: Generar la migración**

Run: `npm run db:generate`
Expected: nueva migración `drizzle/0003_*.sql` con CREATE TABLE de las 6 tablas y `ALTER TABLE user_profile ADD level text;`. Verificar que `drizzle/migrations.js` incluye `m0003`.

- [ ] **Step 3: Verificar tipos y commit**

Run: `npx tsc --noEmit` → sin errores.
```powershell
git add -A
git commit -m "feat(db): esquema de entrenamientos (ejercicios, rutina, sesiones, series) + nivel"
```

> Recuerda: tras `db:generate`, al probar en el móvil arrancar con `npx expo start -c`.

### Task A2: Repositorio de ejercicios (catálogo + custom)

**Files:**
- Create: `src/db/exercise-repo.ts`

- [ ] **Step 1: Implementar**

```ts
import { eq } from 'drizzle-orm';

import { db } from './client';
import { exercise } from './schema';

export type Exercise = typeof exercise.$inferSelect;

const STARTER: Omit<Exercise, 'id' | 'isCustom'>[] = [
  { name: 'Press inclinado', muscleGroup: 'pecho', pattern: 'empuje' },
  { name: 'Press banca', muscleGroup: 'pecho', pattern: 'empuje' },
  { name: 'Press plano mancuerna', muscleGroup: 'pecho', pattern: 'empuje' },
  { name: 'Aperturas', muscleGroup: 'pecho', pattern: 'empuje' },
  { name: 'Fondos', muscleGroup: 'pecho', pattern: 'empuje' },
  { name: 'Press militar', muscleGroup: 'hombro', pattern: 'empuje' },
  { name: 'Elevaciones laterales', muscleGroup: 'hombro', pattern: 'empuje' },
  { name: 'Press francés', muscleGroup: 'triceps', pattern: 'empuje' },
  { name: 'Extensión tríceps polea', muscleGroup: 'triceps', pattern: 'empuje' },
  { name: 'Jalón al pecho', muscleGroup: 'espalda', pattern: 'tiron' },
  { name: 'Remo mancuerna', muscleGroup: 'espalda', pattern: 'tiron' },
  { name: 'Remo barra', muscleGroup: 'espalda', pattern: 'tiron' },
  { name: 'Curl bíceps', muscleGroup: 'biceps', pattern: 'tiron' },
  { name: 'Sentadilla', muscleGroup: 'pierna', pattern: 'pierna' },
  { name: 'Hack squat', muscleGroup: 'pierna', pattern: 'pierna' },
  { name: 'Prensa', muscleGroup: 'pierna', pattern: 'pierna' },
  { name: 'Peso muerto rumano', muscleGroup: 'pierna', pattern: 'pierna' },
  { name: 'Curl femoral', muscleGroup: 'pierna', pattern: 'pierna' },
  { name: 'Extensión cuádriceps', muscleGroup: 'pierna', pattern: 'pierna' },
  { name: 'Gemelo de pie', muscleGroup: 'gemelo', pattern: 'pierna' },
];

export async function seedExercisesIfEmpty(): Promise<void> {
  const existing = await db.select().from(exercise).limit(1);
  if (existing.length === 0) {
    await db.insert(exercise).values(STARTER.map((e) => ({ ...e, isCustom: false })));
  }
}

export async function listExercises(): Promise<Exercise[]> {
  return db.select().from(exercise);
}

export async function addExercise(name: string, muscleGroup: string, pattern: string): Promise<void> {
  await db.insert(exercise).values({ name, muscleGroup, pattern, isCustom: true });
}
```

- [ ] **Step 2: Compila y commit**

Run: `npx tsc --noEmit` → OK.
```powershell
git add src/db/exercise-repo.ts
git commit -m "feat(db): repositorio de ejercicios con catálogo inicial"
```

### Task A3: Repositorio de rutina (días y ejercicios)

**Files:**
- Create: `src/db/routine-repo.ts`

- [ ] **Step 1: Implementar**

```ts
import { asc, eq } from 'drizzle-orm';

import { db } from './client';
import { exercise, routine, routineDay, routineDayExercise } from './schema';

export type RoutineDay = typeof routineDay.$inferSelect;
export type Exercise = typeof exercise.$inferSelect;

export async function getActiveRoutine(): Promise<typeof routine.$inferSelect | null> {
  const rows = await db.select().from(routine).limit(1);
  return rows[0] ?? null;
}

export async function createRoutine(name: string): Promise<number> {
  const res = await db.insert(routine).values({ name }).returning({ id: routine.id });
  return res[0].id;
}

export async function listDays(routineId: number): Promise<RoutineDay[]> {
  return db.select().from(routineDay).where(eq(routineDay.routineId, routineId)).orderBy(asc(routineDay.orderIdx));
}

export async function addDay(routineId: number, name: string): Promise<number> {
  const days = await listDays(routineId);
  const res = await db
    .insert(routineDay)
    .values({ routineId, name, orderIdx: days.length })
    .returning({ id: routineDay.id });
  return res[0].id;
}

export async function deleteDay(dayId: number): Promise<void> {
  await db.delete(routineDayExercise).where(eq(routineDayExercise.routineDayId, dayId));
  await db.delete(routineDay).where(eq(routineDay.id, dayId));
}

/** Ejercicios de un día, en orden, con sus datos. */
export async function listDayExercises(dayId: number): Promise<{ rdeId: number; exercise: Exercise }[]> {
  const rows = await db
    .select({ rdeId: routineDayExercise.id, exercise })
    .from(routineDayExercise)
    .innerJoin(exercise, eq(routineDayExercise.exerciseId, exercise.id))
    .where(eq(routineDayExercise.routineDayId, dayId))
    .orderBy(asc(routineDayExercise.orderIdx));
  return rows;
}

export async function addExerciseToDay(dayId: number, exerciseId: number): Promise<void> {
  const current = await db.select().from(routineDayExercise).where(eq(routineDayExercise.routineDayId, dayId));
  await db.insert(routineDayExercise).values({ routineDayId: dayId, exerciseId, orderIdx: current.length });
}

export async function removeExerciseFromDay(rdeId: number): Promise<void> {
  await db.delete(routineDayExercise).where(eq(routineDayExercise.id, rdeId));
}
```

- [ ] **Step 2: Compila y commit**

Run: `npx tsc --noEmit` → OK.
```powershell
git add src/db/routine-repo.ts
git commit -m "feat(db): repositorio de rutina (días y ejercicios por día)"
```

### Task A4: Repositorio de entreno (sesiones, series y "última vez")

**Files:**
- Create: `src/db/workout-repo.ts`

- [ ] **Step 1: Implementar**

```ts
import { and, desc, eq } from 'drizzle-orm';

import { db } from './client';
import { setLog, workoutSession } from './schema';

export type SetLog = typeof setLog.$inferSelect;

/** Devuelve la sesión de ese día+fecha; la crea si no existe. */
export async function getOrCreateSession(date: string, routineDayId: number): Promise<number> {
  const existing = await db
    .select()
    .from(workoutSession)
    .where(and(eq(workoutSession.date, date), eq(workoutSession.routineDayId, routineDayId)));
  if (existing[0]) return existing[0].id;
  const res = await db.insert(workoutSession).values({ date, routineDayId }).returning({ id: workoutSession.id });
  return res[0].id;
}

export async function listSets(sessionId: number, exerciseId: number): Promise<SetLog[]> {
  return db
    .select()
    .from(setLog)
    .where(and(eq(setLog.sessionId, sessionId), eq(setLog.exerciseId, exerciseId)))
    .orderBy(setLog.setNumber);
}

export async function upsertSet(p: {
  sessionId: number;
  exerciseId: number;
  setNumber: number;
  weightKg: number;
  reps: number;
  rir: number | null;
  setType: string;
}): Promise<void> {
  const existing = await db
    .select()
    .from(setLog)
    .where(
      and(eq(setLog.sessionId, p.sessionId), eq(setLog.exerciseId, p.exerciseId), eq(setLog.setNumber, p.setNumber)),
    );
  if (existing[0]) {
    await db
      .update(setLog)
      .set({ weightKg: p.weightKg, reps: p.reps, rir: p.rir, setType: p.setType })
      .where(eq(setLog.id, existing[0].id));
  } else {
    await db.insert(setLog).values(p);
  }
}

export async function deleteSet(setLogId: number): Promise<void> {
  await db.delete(setLog).where(eq(setLog.id, setLogId));
}

/** Series de la sesión anterior (distinta a la actual) más reciente en la que se registró este ejercicio. */
export async function getLastPerformance(
  exerciseId: number,
  excludeSessionId: number,
): Promise<{ date: string; sets: SetLog[] } | null> {
  const rows = await db
    .select({ set: setLog, date: workoutSession.date, sessionId: workoutSession.id })
    .from(setLog)
    .innerJoin(workoutSession, eq(setLog.sessionId, workoutSession.id))
    .where(eq(setLog.exerciseId, exerciseId))
    .orderBy(desc(workoutSession.date), desc(workoutSession.id));
  const prev = rows.find((r) => r.sessionId !== excludeSessionId);
  if (!prev) return null;
  const sets = rows.filter((r) => r.sessionId === prev.sessionId).map((r) => r.set);
  return { date: prev.date, sets };
}
```

- [ ] **Step 2: Compila y commit**

Run: `npx tsc --noEmit` → OK.
```powershell
git add src/db/workout-repo.ts
git commit -m "feat(db): repositorio de sesiones y series + lo de la última vez"
```

---

## Fase B — Lógica pura (TDD)

### Task B1: Esquema de series/reps por nivel

**Files:**
- Create: `src/training/levels.ts`
- Test: `src/training/levels.test.ts`

- [ ] **Step 1: Test que falla**

```ts
import { schemeForLevel, describeScheme } from './levels';

test('principiante: 3 series 8-12 RIR 2-3', () => {
  const s = schemeForLevel('principiante');
  expect(s).toEqual({ sets: 3, repMin: 8, repMax: 12, rirMin: 2, rirMax: 3 });
});

test('avanzado tiene más series y menos RIR que principiante', () => {
  const a = schemeForLevel('avanzado');
  const p = schemeForLevel('principiante');
  expect(a.sets).toBeGreaterThanOrEqual(p.sets);
  expect(a.rirMin).toBeLessThanOrEqual(p.rirMin);
});

test('describeScheme da el texto del objetivo', () => {
  expect(describeScheme(schemeForLevel('principiante'))).toBe('3×8–12 · RIR 2–3');
});
```

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `npm test -- levels`
Expected: FAIL ("Cannot find module './levels'").

- [ ] **Step 3: Implementar**

```ts
export type Level = 'principiante' | 'intermedio' | 'avanzado';

export interface RepScheme {
  sets: number;
  repMin: number;
  repMax: number;
  rirMin: number;
  rirMax: number;
}

const SCHEMES: Record<Level, RepScheme> = {
  principiante: { sets: 3, repMin: 8, repMax: 12, rirMin: 2, rirMax: 3 },
  intermedio: { sets: 4, repMin: 6, repMax: 12, rirMin: 1, rirMax: 3 },
  avanzado: { sets: 4, repMin: 6, repMax: 10, rirMin: 0, rirMax: 2 },
};

export function schemeForLevel(level: Level): RepScheme {
  return SCHEMES[level];
}

export function describeScheme(s: RepScheme): string {
  const rir = s.rirMin === s.rirMax ? `${s.rirMin}` : `${s.rirMin}–${s.rirMax}`;
  return `${s.sets}×${s.repMin}–${s.repMax} · RIR ${rir}`;
}
```

- [ ] **Step 4: Ejecutar y ver que pasa**

Run: `npm test -- levels`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```powershell
git add src/training/levels.ts src/training/levels.test.ts
git commit -m "feat(training): esquema de series/reps por nivel"
```

---

## Fase C — Navegación y pantallas de Entreno

> El flujo de Entreno se maneja con **estado interno** en `entreno.tsx` (vistas: lista de días / constructor de rutina / sesión) + hojas modales. Reutiliza el estilo de las hojas de M1 (`AddWeightSheet`) y la paleta `Brand`. Las pantallas se afinan en el móvil después.

### Task C1: Añadir la pestaña "Entreno"

**Files:**
- Modify: `src/components/app-tabs.tsx`
- Create: `src/app/entreno.tsx` (placeholder inicial)

- [ ] **Step 1: Placeholder de la ruta**

`src/app/entreno.tsx`:
```tsx
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { EntrenoScreen } from '@/ui/EntrenoScreen';

export default function EntrenoRoute() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Brand.surface }} edges={['top']}>
      <EntrenoScreen />
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Añadir el trigger de pestaña**

En `src/components/app-tabs.tsx`, añadir tras la `Tabs.Screen` de `index`:
```tsx
      <Tabs.Screen name="entreno" options={{ title: 'Entreno' }} />
```

- [ ] **Step 3: EntrenoScreen mínima (para que compile/arranque)**

`src/ui/EntrenoScreen.tsx` (se completa en C2–C5; versión inicial):
```tsx
import { Text, View } from 'react-native';

import { Brand } from '@/constants/theme';

export function EntrenoScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: Brand.surface, padding: 14 }}>
      <Text style={{ color: Brand.text, fontSize: 20, fontWeight: '800' }}>Entreno</Text>
    </View>
  );
}
```

- [ ] **Step 4: Verificar en el móvil y commit**

Run: `npx expo start -c` → ver dos pestañas (Hoy, Entreno).
```powershell
git add -A
git commit -m "feat(ui): pestaña Entreno"
```

### Task C2: EntrenoScreen — home con días o vacío

**Files:**
- Modify: `src/ui/EntrenoScreen.tsx`

- [ ] **Step 1: Cargar rutina y días; estados de vista**

`EntrenoScreen` carga la rutina activa y sus días. Si no hay rutina → botón "Crear mi rutina" que abre el constructor (Task C3). Si hay rutina → lista de días, cada uno toca → sesión (Task C4). Mantén un estado `view: 'home' | 'builder' | { session: dayId }`. Usa `seedExercisesIfEmpty()` al montar (para tener catálogo). Carga con `useCallback`/`useEffect` y recarga al volver de subvistas.

```tsx
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { seedExercisesIfEmpty } from '@/db/exercise-repo';
import { getActiveRoutine, listDays, type RoutineDay } from '@/db/routine-repo';
import { RoutineBuilder } from '@/ui/RoutineBuilder';
import { SessionScreen } from '@/ui/SessionScreen';

type View = 'home' | 'builder' | { dayId: number; dayName: string };

export function EntrenoScreen() {
  const [routineId, setRoutineId] = useState<number | null>(null);
  const [days, setDays] = useState<RoutineDay[]>([]);
  const [view, setView] = useState<View>('home');
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    await seedExercisesIfEmpty();
    const r = await getActiveRoutine();
    setRoutineId(r?.id ?? null);
    setDays(r ? await listDays(r.id) : []);
    setLoaded(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!loaded) return <View style={styles.screen} />;

  if (view === 'builder') {
    return <RoutineBuilder onDone={() => { setView('home'); load(); }} />;
  }
  if (typeof view === 'object') {
    return <SessionScreen dayId={view.dayId} dayName={view.dayName} onBack={() => { setView('home'); load(); }} />;
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.h1}>Entreno</Text>
      {routineId == null ? (
        <Pressable style={styles.cta} onPress={() => setView('builder')}>
          <Text style={styles.ctaTxt}>＋ Crear mi rutina</Text>
        </Pressable>
      ) : (
        <>
          {days.map((d) => (
            <Pressable key={d.id} style={styles.dayCard} onPress={() => setView({ dayId: d.id, dayName: d.name })}>
              <Text style={styles.dayName}>{d.name}</Text>
              <Text style={styles.dayGo}>Entrenar ›</Text>
            </Pressable>
          ))}
          <Pressable style={styles.edit} onPress={() => setView('builder')}>
            <Text style={styles.editTxt}>Editar rutina</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.surface },
  content: { padding: 14, gap: 12 },
  h1: { color: Brand.text, fontSize: 20, fontWeight: '800' },
  cta: { backgroundColor: Brand.accentStrong, borderRadius: 14, padding: 18, alignItems: 'center' },
  ctaTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
  dayCard: { backgroundColor: Brand.card, borderColor: Brand.cardBorder, borderWidth: 1, borderRadius: 14, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayName: { color: Brand.text, fontSize: 16, fontWeight: '700' },
  dayGo: { color: Brand.accent, fontWeight: '700' },
  edit: { padding: 12, alignItems: 'center' },
  editTxt: { color: Brand.textMuted },
});
```

- [ ] **Step 2: Compila (RoutineBuilder/SessionScreen se crean en C3/C4 — crear stubs si hace falta para compilar) y commit**

```powershell
git add src/ui/EntrenoScreen.tsx
git commit -m "feat(ui): home de Entreno con días o crear rutina"
```

### Task C3: RoutineBuilder — crear rutina (nivel, días, ejercicios)

**Files:**
- Create: `src/ui/RoutineBuilder.tsx`, `src/ui/ExercisePicker.tsx`

- [ ] **Step 1: ExercisePicker (elegir de la biblioteca o crear custom)**

Hoja modal que lista `listExercises()` (agrupable por grupo muscular), permite buscar/seleccionar uno y, abajo, un formulario "＋ Nuevo ejercicio" (nombre + grupo + patrón) que llama `addExercise(...)`. `onPick(exerciseId)` al seleccionar.

- [ ] **Step 2: RoutineBuilder**

Pantalla que:
- Si no hay rutina, crea una con `createRoutine('Mi rutina')` y guarda el nivel elegido en el perfil (`setProfile` con `level`, reutilizando getProfile para no borrar el resto).
- Selector de **nivel** (Principiante/Intermedio/Avanzado) → guarda en perfil.
- Lista de **días**: botón "＋ Añadir día" (pide nombre, p. ej. "Empuje" / "Día A") → `addDay`. Cada día muestra sus ejercicios (`listDayExercises`) con botón "＋ Ejercicio" que abre `ExercisePicker` → `addExerciseToDay`. Poder borrar día (`deleteDay`) y quitar ejercicio (`removeExerciseFromDay`).
- Botón "Hecho" → `onDone()`.

Usar `Brand`, hojas modales como en M1, y recargar listas tras cada cambio. (Código UI concreto siguiendo el patrón de `EntrenoScreen`/`AddWeightSheet`; se pule en el móvil.)

- [ ] **Step 3: Compila y commit**

```powershell
git add src/ui/RoutineBuilder.tsx src/ui/ExercisePicker.tsx
git commit -m "feat(ui): constructor de rutina (nivel, días, ejercicios)"
```

### Task C4: SessionScreen — ejercicios del día

**Files:**
- Create: `src/ui/SessionScreen.tsx`

- [ ] **Step 1: Implementar**

`SessionScreen({ dayId, dayName, onBack })`:
- Al montar: `getOrCreateSession(hoy, dayId)` → `sessionId`. Carga `listDayExercises(dayId)`.
- Lista cada ejercicio con un resumen de series ya registradas hoy (`listSets(sessionId, exerciseId)` → "3 series ✓" / "—"). Tocar un ejercicio abre `SetLogSheet` (Task C5).
- Cabecera con `dayName` y botón "‹ Volver" (`onBack`).
- Recarga el resumen al cerrar la hoja.

```tsx
// Estructura (resumen): estado sessionId + exercises + openExerciseId
// const sessionId = await getOrCreateSession(new Date().toISOString().slice(0,10), dayId)
// map listDayExercises → Pressable que set openExerciseId
// <SetLogSheet visible={openExerciseId!=null} sessionId exerciseId exerciseName onClose={() => { setOpen(null); reload(); }} />
```

- [ ] **Step 2: Compila y commit**

```powershell
git add src/ui/SessionScreen.tsx
git commit -m "feat(ui): pantalla de sesión (ejercicios del día)"
```

### Task C5: SetLogSheet — tabla de series + modo foco (centro de la app)

**Files:**
- Create: `src/ui/SetLogSheet.tsx`

- [ ] **Step 1: Implementar la fusión tabla + foco**

Props: `{ visible, sessionId, exerciseId, exerciseName, onClose }`. Necesita el **nivel** del perfil (`getProfile().level`, por defecto 'intermedio' si null) para el objetivo (`describeScheme(schemeForLevel(level))`).

Comportamiento (diseño aprobado 4.1):
- Al abrir: `listSets(sessionId, exerciseId)` (series de hoy) y `getLastPerformance(exerciseId, sessionId)` ("lo de la última vez").
- Cabecera: nombre del ejercicio + objetivo por nivel (p. ej. "🎯 3×8–12 · RIR 2–3") + línea "Última vez: 82,5 × 8·8·7 · RIR 2" (de `getLastPerformance`).
- **Tabla** de series (Serie | Kg | Reps | ✓). Botón "＋ Añadir serie".
- Al tocar una serie, sube una **hoja de foco** con +/− para peso y reps, selector de RIR (0,1,2,3,4+) y selector de tipo (normal/top/back-off/calentamiento), y "✓ Serie hecha" → `upsertSet(...)` y refresca la tabla. Prerelleno: si esa serie existe, sus valores; si no, los de la misma serie de la última vez (o el peso de la serie anterior de hoy).
- Poder borrar una serie (`deleteSet`).

Reutiliza el patrón visual de `AddWeightSheet`/`SetGoalSheet` (Modal + Brand). Código completo siguiendo esos componentes; se afina en el móvil.

- [ ] **Step 2: Verificar el flujo completo en el móvil**

Run: `npx expo start -c`. En el teléfono: crear rutina con un día y un par de ejercicios → entrar al día → registrar series de un ejercicio → cerrar y reabrir la app y comprobar que persisten; un segundo día/sesión muestra "lo de la última vez".

- [ ] **Step 3: Commit**

```powershell
git add src/ui/SetLogSheet.tsx
git commit -m "feat(ui): registro de series (tabla + modo foco) con última vez y objetivo por nivel"
```

---

## Fase D — Cierre

### Task D1: Verificación final

- [ ] **Step 1:** `npm test` (lógica en verde) y `npx tsc --noEmit` (sin errores).
- [ ] **Step 2:** Bundle de comprobación: `npx expo export --platform android` (sin errores) y luego borrar `dist/`.
- [ ] **Step 3:** Commit final si queda algo suelto.

> Al terminar **todo M2** (M2.1 + M2.2), borrar este plan y el de M2.2 (regla de no acumular). El spec del Núcleo se borra cuando A esté completo del todo.

---

## Self-review (cobertura del spec, secciones 5.2–5.4 y 4.1)
- **Biblioteca de ejercicios (catálogo + custom)** → A2. **Rutina (split + ejercicios por día)** → A3, C3. **Registro tabla+foco con peso/reps/RIR/tipo** → A4, C5. **"Lo de la última vez"** → A4 (`getLastPerformance`), C5. **Objetivo por nivel** → B1, C5. **Nivel en perfil** → A1, C3. **Persistencia local** → A1–A4. **Pestaña Entreno** → C1.
- **Fuera de M2.1 (va a M2.2):** doble progresión (sugerir subir peso), 1RM estimado, PRs, volumen por grupo, gráficas de progreso, glosario.
- Sin placeholders en datos (A) ni lógica (B). La UI (C) da estructura y código del patrón; se afina en el móvil, como en M1.
- Columna `order_idx` (no `order`, reservada). Columnas nuevas en tablas existentes (`level`) nullable para no romper la migración (lección de M1).
```
