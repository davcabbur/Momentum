# Actividad diaria (pasos / NEAT) — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir seguimiento de actividad diaria (pasos) como meta de movimiento + educación, leídos de Health Connect (Android) con respaldo manual, con tarjeta en Inicio (anillo + racha) y tendencia en Progreso.

**Architecture:** Lógica pura testeada (`src/activity/steps.ts`) separada de la UI; persistencia local en tabla `activity_day` (entra en la sync de la nube); puente nativo aislado en `src/lib/health-connect.ts` con guarda de plataforma y respaldo manual; UI con tarjeta en Inicio y pestaña de tendencia en Progreso, reutilizando `ProgressRing` y `LineChart`.

**Tech Stack:** React Native + Expo SDK 54, TypeScript estricto, Drizzle (expo-sqlite), `react-native-health-connect`, `expo-build-properties`, `react-native-svg` (vía componentes existentes).

## Global Constraints

- Colores SIEMPRE vía tema (`useTheme()` + `useThemedStyles(makeStyles)` con `makeStyles = (c: Theme) => ...`); ningún hex literal. Token nuevo si hace falta.
- Responder/copy en español.
- TDD para lógica pura (tests antes que implementación).
- Indentación 2 espacios; componentes PascalCase; ficheros de componente `.tsx`.
- Los pasos **NO** se suman a las kcal (el TDEE ya incluye la actividad).
- Meta por defecto **8.000** pasos, editable. Racha **sin mensajes de culpa**.
- Commitear al final de cada tarea. Verificar con `npx tsc --noEmit`, `npx jest`, `npx expo export --platform android` (borrar `dist` después).
- Tras implementar todo el plan, **borrar** este archivo y el spec `docs/superpowers/specs/2026-06-29-actividad-pasos-design.md` (regla del proyecto).

---

### Task 1: Lógica pura de pasos (`src/activity/steps.ts`)

**Files:**
- Create: `src/activity/steps.ts`
- Test: `src/activity/steps.test.ts`

**Interfaces:**
- Consumes: `addDays(isoDate, days)` de `@/bodyweight/goal`.
- Produces:
  - `interface DaySteps { date: string; steps: number }`
  - `goalProgress(steps: number, goal: number): number` (0..100)
  - `weeklyAverage(days: DaySteps[]): number`
  - `computeStreak(days: DaySteps[], goal: number, todayIso: string): number`
  - `trendSeries(days: DaySteps[], fromIso: string, toIso: string): DaySteps[]`

- [ ] **Step 1: Write the failing tests**

```ts
// src/activity/steps.test.ts
import { goalProgress, weeklyAverage, computeStreak, trendSeries } from './steps';

describe('goalProgress', () => {
  it('0 si la meta es 0', () => expect(goalProgress(5000, 0)).toBe(0));
  it('clamp a 100', () => expect(goalProgress(12000, 8000)).toBe(100));
  it('proporcional', () => expect(goalProgress(4000, 8000)).toBe(50));
});

describe('weeklyAverage', () => {
  it('0 sin datos', () => expect(weeklyAverage([])).toBe(0));
  it('media de los últimos 7', () => {
    const days = Array.from({ length: 9 }, (_, i) => ({ date: `2026-06-${10 + i}`, steps: 1000 * (i + 1) }));
    // últimos 7 = días con steps 3000..9000 → media 6000
    expect(weeklyAverage(days)).toBe(6000);
  });
});

describe('computeStreak', () => {
  const goal = 8000;
  it('vacío → 0', () => expect(computeStreak([], goal, '2026-06-29')).toBe(0));
  it('hoy cumplido + 2 días previos', () => {
    const days = [
      { date: '2026-06-27', steps: 9000 },
      { date: '2026-06-28', steps: 8000 },
      { date: '2026-06-29', steps: 8500 },
    ];
    expect(computeStreak(days, goal, '2026-06-29')).toBe(3);
  });
  it('hoy aún no cumplido → cuenta desde ayer', () => {
    const days = [
      { date: '2026-06-28', steps: 8200 },
      { date: '2026-06-29', steps: 1200 },
    ];
    expect(computeStreak(days, goal, '2026-06-29')).toBe(1);
  });
  it('hueco corta la racha', () => {
    const days = [
      { date: '2026-06-27', steps: 9000 },
      // falta el 28
      { date: '2026-06-29', steps: 9000 },
    ];
    expect(computeStreak(days, goal, '2026-06-29')).toBe(1);
  });
});

describe('trendSeries', () => {
  it('rellena huecos con 0', () => {
    const out = trendSeries([{ date: '2026-06-28', steps: 5000 }], '2026-06-27', '2026-06-29');
    expect(out).toEqual([
      { date: '2026-06-27', steps: 0 },
      { date: '2026-06-28', steps: 5000 },
      { date: '2026-06-29', steps: 0 },
    ]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest steps`
Expected: FAIL ("Cannot find module './steps'").

- [ ] **Step 3: Implement `src/activity/steps.ts`**

```ts
import { addDays } from '@/bodyweight/goal';

export interface DaySteps {
  date: string; // YYYY-MM-DD
  steps: number;
}

/** Progreso 0..100 hacia la meta del día. */
export function goalProgress(steps: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.max(0, Math.min(100, (steps / goal) * 100));
}

/** Media de pasos de los últimos 7 días con dato (entero). */
export function weeklyAverage(days: DaySteps[]): number {
  const last7 = days.slice(-7);
  if (last7.length === 0) return 0;
  return Math.round(last7.reduce((a, d) => a + d.steps, 0) / last7.length);
}

/**
 * Días consecutivos cumpliendo la meta. Hoy cuenta solo si ya se alcanzó;
 * si no, la racha se cuenta hacia atrás desde ayer. Un día por debajo (o sin dato) la corta.
 */
export function computeStreak(days: DaySteps[], goal: number, todayIso: string): number {
  const map = new Map(days.map((d) => [d.date, d.steps]));
  let cursor = (map.get(todayIso) ?? 0) >= goal ? todayIso : addDays(todayIso, -1);
  let streak = 0;
  while ((map.get(cursor) ?? 0) >= goal) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Serie continua de fromIso..toIso (inclusive) rellenando huecos con 0. */
export function trendSeries(days: DaySteps[], fromIso: string, toIso: string): DaySteps[] {
  const map = new Map(days.map((d) => [d.date, d.steps]));
  const out: DaySteps[] = [];
  let cur = fromIso;
  while (cur <= toIso) {
    out.push({ date: cur, steps: map.get(cur) ?? 0 });
    cur = addDays(cur, 1);
  }
  return out;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest steps`
Expected: PASS (todas).

- [ ] **Step 5: Commit**

```bash
git add src/activity/steps.ts src/activity/steps.test.ts
git commit -m "feat(actividad): logica pura de pasos (progreso, media, racha, serie)"
```

---

### Task 2: Esquema, migración y repositorio (`activity_day`)

**Files:**
- Modify: `src/db/schema.ts` (añadir tabla `activityDay`)
- Create: `src/db/activity-repo.ts`
- Modify: `src/db/backup.ts:4-17` (añadir `'activity_day'` a `TABLES`)
- Create (generado): `drizzle/00XX_*.sql` (vía drizzle-kit)

**Interfaces:**
- Consumes: `getSetting`/`setSetting` de `@/db/settings-repo`; `db` de `@/db/client`; `DaySteps` de `@/activity/steps`.
- Produces (en `activity-repo.ts`):
  - `upsertActivityDay(date: string, steps: number, source: 'health_connect' | 'manual'): Promise<void>`
  - `listActivityDays(fromDate: string): Promise<DaySteps[]>` (orden ascendente por fecha)
  - `getStepsGoal(): Promise<number>` (default 8000)
  - `setStepsGoal(goal: number): Promise<void>`

- [ ] **Step 1: Añadir la tabla al esquema**

En `src/db/schema.ts`, tras `appSetting`/`foodProduct`, añade:

```ts
/** Pasos por día (NEAT). Origen: Health Connect o manual. */
export const activityDay = sqliteTable('activity_day', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull(), // YYYY-MM-DD (único a nivel de app)
  steps: integer('steps').notNull(),
  source: text('source').notNull(), // 'health_connect' | 'manual'
});
```

- [ ] **Step 2: Generar la migración**

Run: `npx drizzle-kit generate`
Expected: crea `drizzle/00XX_*.sql` con `CREATE TABLE \`activity_day\` (...)`. Tabla nueva → sin riesgo de NOT NULL sobre filas existentes.

- [ ] **Step 3: Crear el repositorio**

```ts
// src/db/activity-repo.ts
import { asc, eq, gte } from 'drizzle-orm';

import type { DaySteps } from '@/activity/steps';
import { db } from './client';
import { activityDay } from './schema';
import { getSetting, setSetting } from './settings-repo';

const STEPS_GOAL_KEY = 'steps_goal';
const DEFAULT_GOAL = 8000;

export async function upsertActivityDay(date: string, steps: number, source: 'health_connect' | 'manual'): Promise<void> {
  const existing = await db.select({ id: activityDay.id }).from(activityDay).where(eq(activityDay.date, date));
  if (existing[0]) {
    await db.update(activityDay).set({ steps, source }).where(eq(activityDay.id, existing[0].id));
  } else {
    await db.insert(activityDay).values({ date, steps, source });
  }
}

export async function listActivityDays(fromDate: string): Promise<DaySteps[]> {
  const rows = await db
    .select({ date: activityDay.date, steps: activityDay.steps })
    .from(activityDay)
    .where(gte(activityDay.date, fromDate))
    .orderBy(asc(activityDay.date));
  return rows;
}

export async function getStepsGoal(): Promise<number> {
  const v = await getSetting(STEPS_GOAL_KEY);
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_GOAL;
}

export async function setStepsGoal(goal: number): Promise<void> {
  await setSetting(STEPS_GOAL_KEY, String(Math.round(goal)));
}
```

- [ ] **Step 4: Incluir la tabla en la copia/sync**

En `src/db/backup.ts`, dentro de `const TABLES = [...]`, añade `'activity_day'` al final de la lista (junto a `'food_product'`).

- [ ] **Step 5: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 6: Commit**

```bash
git add src/db/schema.ts src/db/activity-repo.ts src/db/backup.ts drizzle/
git commit -m "feat(actividad): tabla activity_day + repo + en la sync"
```

---

### Task 3: Glosario — entrada NEAT

**Files:**
- Modify: `src/education/glossary.ts` (añadir un objeto al array `GLOSSARY`)

**Interfaces:**
- Consumes: tipo `GlossaryTerm { key; title; body }` ya existente.
- Produces: término con `key: 'neat'`.

- [ ] **Step 1: Añadir el término**

En `src/education/glossary.ts`, añade al array `GLOSSARY` (antes del cierre `];`):

```ts
  {
    key: 'neat',
    title: 'NEAT (actividad diaria)',
    body: 'Todo lo que te mueves fuera del entreno: andar, escaleras, recados. Es la palanca más controlable del gasto diario y la que más suma para perder grasa. Zona 2 y HIIT valen los dos: elige el que mantengas. No hace falta machacarse a cardio. Tu actividad ya está incluida en tu mantenimiento, por eso los pasos no se suman aparte a tus kcal.',
  },
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/education/glossary.ts
git commit -m "feat(actividad): glosario NEAT"
```

---

### Task 4: Puente nativo Health Connect (`src/lib/health-connect.ts`)

**Files:**
- Create: `src/lib/health-connect.ts`
- Modify: `app.json` (plugins: `react-native-health-connect` y `expo-build-properties`)
- Modify: `package.json` (dependencias, vía `npx expo install`)

**Interfaces:**
- Produces:
  - `isHealthAvailable(): Promise<boolean>`
  - `hasStepsPermission(): Promise<boolean>` (no pide permiso, solo consulta)
  - `ensureStepsPermission(): Promise<boolean>` (pide permiso)
  - `readDailySteps(fromIso: string, toIso: string): Promise<DaySteps[]>`

- [ ] **Step 1: Instalar la dependencia nativa**

Run: `npx expo install react-native-health-connect expo-build-properties`
Expected: se añaden a `package.json`.

- [ ] **Step 2: Configurar `app.json`**

En `app.json`, dentro de `expo.plugins`, añade (junto a los demás plugins):

```json
"react-native-health-connect",
[
  "expo-build-properties",
  { "android": { "minSdkVersion": 26 } }
]
```

> Nota: Health Connect requiere `minSdkVersion >= 26`. El plugin de `react-native-health-connect` añade al manifiesto el permiso `android.permission.health.READ_STEPS` y la actividad de justificación de permisos.

- [ ] **Step 3: Implementar el puente**

```ts
// src/lib/health-connect.ts
import { Platform } from 'react-native';

import type { DaySteps } from '@/activity/steps';

const STEPS = 'Steps' as const;

/** ¿Hay Health Connect disponible? (solo Android e inicializable.) */
export async function isHealthAvailable(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    const { initialize } = await import('react-native-health-connect');
    return await initialize();
  } catch {
    return false;
  }
}

/** ¿Ya tenemos permiso de lectura de pasos? No abre diálogo. */
export async function hasStepsPermission(): Promise<boolean> {
  if (!(await isHealthAvailable())) return false;
  try {
    const { getGrantedPermissions } = await import('react-native-health-connect');
    const granted = await getGrantedPermissions();
    return granted.some((p) => p.recordType === STEPS && p.accessType === 'read');
  } catch {
    return false;
  }
}

/** Pide permiso de lectura de pasos (abre el diálogo de Health Connect). */
export async function ensureStepsPermission(): Promise<boolean> {
  if (!(await isHealthAvailable())) return false;
  try {
    const { requestPermission } = await import('react-native-health-connect');
    const granted = await requestPermission([{ accessType: 'read', recordType: STEPS }]);
    return granted.some((p) => p.recordType === STEPS && p.accessType === 'read');
  } catch {
    return false;
  }
}

/** Lee los pasos por día en el rango (inclusive), agregando registros por fecha local. */
export async function readDailySteps(fromIso: string, toIso: string): Promise<DaySteps[]> {
  if (!(await hasStepsPermission())) return [];
  const { readRecords } = await import('react-native-health-connect');
  const startTime = new Date(fromIso + 'T00:00:00').toISOString();
  const endTime = new Date(toIso + 'T23:59:59').toISOString();
  const res = await readRecords(STEPS, { timeRangeFilter: { operator: 'between', startTime, endTime } });
  const records = (res as { records: { startTime: string; count: number }[] }).records ?? [];
  const byDay = new Map<string, number>();
  for (const r of records) {
    const day = r.startTime.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + (r.count ?? 0));
  }
  return [...byDay.entries()].map(([date, steps]) => ({ date, steps })).sort((a, b) => a.date.localeCompare(b.date));
}
```

> Verificación en dispositivo (no hay test unitario para código nativo): la firma exacta de `react-native-health-connect` puede variar entre versiones. Al hacer la build de desarrollo, comprobar que `records[].count` y `records[].startTime` existen; si la versión instalada usa otros nombres, ajustarlos aquí (es el único punto que toca la API nativa).

- [ ] **Step 4: Verificar tipos y bundle**

Run: `npx tsc --noEmit`
Expected: sin errores.
Run: `npx expo export --platform android` y luego borra `dist`.
Expected: BUNDLE OK.

- [ ] **Step 5: Commit**

```bash
git add src/lib/health-connect.ts app.json package.json package-lock.json
git commit -m "feat(actividad): puente Health Connect (pasos) + config nativa"
```

---

### Task 5: Hoja de pasos manual / meta (`src/ui/StepsSheet.tsx`)

**Files:**
- Create: `src/ui/StepsSheet.tsx`

**Interfaces:**
- Consumes: `setStepsGoal`, `upsertActivityDay` de `@/db/activity-repo`; tema.
- Produces: `StepsSheet({ visible, date, initialGoal, initialSteps, onClose }: { visible: boolean; date: string; initialGoal: number; initialSteps: number; onClose: () => void })`.

- [ ] **Step 1: Implementar el sheet**

Sigue el patrón de bottom-sheet de `src/ui/SetGoalSheet.tsx` (Modal transparente, `backdrop` con `backgroundColor: '#0008'`, `useSafeAreaInsets`, `paddingBottom: insets.bottom + 18`). Contenido: campo "Pasos de hoy" (numérico) y campo "Meta diaria" (numérico), botón "Guardar". Al guardar: si pasos > 0 → `upsertActivityDay(date, pasos, 'manual')`; siempre `setStepsGoal(meta)`; luego `onClose()`.

```tsx
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { setStepsGoal, upsertActivityDay } from '@/db/activity-repo';
import { useTheme, useThemedStyles, type Theme } from '@/ui/theme';

export function StepsSheet({
  visible,
  date,
  initialGoal,
  initialSteps,
  onClose,
}: {
  visible: boolean;
  date: string;
  initialGoal: number;
  initialSteps: number;
  onClose: () => void;
}) {
  const { c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [steps, setSteps] = useState(String(initialSteps || ''));
  const [goal, setGoal] = useState(String(initialGoal));

  useEffect(() => {
    if (visible) {
      setSteps(initialSteps ? String(initialSteps) : '');
      setGoal(String(initialGoal));
    }
  }, [visible, initialSteps, initialGoal]);

  async function save() {
    const s = Math.round(Number(steps.replace(',', '.')));
    const g = Math.round(Number(goal.replace(',', '.')));
    if (Number.isFinite(s) && s > 0) await upsertActivityDay(date, s, 'manual');
    if (Number.isFinite(g) && g > 0) await setStepsGoal(g);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 18 }]} onPress={() => {}}>
          <Text style={styles.title}>Pasos de hoy</Text>
          <Text style={styles.label}>Pasos de hoy</Text>
          <TextInput value={steps} onChangeText={setSteps} keyboardType="number-pad" placeholder="p. ej. 7500" placeholderTextColor={c.textMuted} style={styles.input} />
          <Text style={styles.label}>Meta diaria</Text>
          <TextInput value={goal} onChangeText={setGoal} keyboardType="number-pad" style={styles.input} />
          <Pressable style={styles.save} onPress={save}>
            <Text style={styles.saveTxt}>Guardar</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0008' },
    sheet: { backgroundColor: c.card, padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, gap: 8 },
    title: { color: c.text, fontSize: 16, fontWeight: '700' },
    label: { color: c.textMuted, fontSize: 13, fontWeight: '600', marginTop: 6 },
    input: { color: c.text, fontSize: 22, fontWeight: '800', textAlign: 'center', backgroundColor: c.surface, borderRadius: 12, paddingVertical: 10 },
    save: { backgroundColor: c.accentStrong, borderRadius: 12, padding: 14, marginTop: 8 },
    saveTxt: { textAlign: 'center', fontWeight: '800', color: c.onAccent },
  });
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/ui/StepsSheet.tsx
git commit -m "feat(actividad): hoja de pasos manual y meta"
```

---

### Task 6: Tarjeta de actividad en Inicio (`src/ui/ActivityCard.tsx`)

**Files:**
- Create: `src/ui/ActivityCard.tsx`
- Modify: `src/ui/WeightScreen.tsx` (importar y renderizar `<ActivityCard reloadNonce={nonce} />`)

**Interfaces:**
- Consumes: `goalProgress`, `computeStreak` de `@/activity/steps`; `getStepsGoal`, `listActivityDays`, `upsertActivityDay` de `@/db/activity-repo`; `isHealthAvailable`, `hasStepsPermission`, `ensureStepsPermission`, `readDailySteps` de `@/lib/health-connect`; `ProgressRing` de `@/ui/ProgressRing`; `StepsSheet` de `@/ui/StepsSheet`; `addDays` de `@/bodyweight/goal`; `GLOSSARY` de `@/education/glossary` (para mostrar la explicación NEAT).
- Produces: `ActivityCard({ reloadNonce }: { reloadNonce?: number })`.

- [ ] **Step 1: Implementar la tarjeta**

Patrón idéntico a `WeightSummaryCard` (card del tema, `useFocusEffect` con `[load, reloadNonce]`). Lógica de `load()`:

```tsx
import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { addDays } from '@/bodyweight/goal';
import { getStepsGoal, listActivityDays, upsertActivityDay } from '@/db/activity-repo';
import { GLOSSARY } from '@/education/glossary';
import { computeStreak, goalProgress } from '@/activity/steps';
import { ensureStepsPermission, hasStepsPermission, isHealthAvailable, readDailySteps } from '@/lib/health-connect';
import { ProgressRing } from '@/ui/ProgressRing';
import { StepsSheet } from '@/ui/StepsSheet';
import { useTheme, useThemedStyles, type Theme } from '@/ui/theme';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ActivityCard({ reloadNonce }: { reloadNonce?: number }) {
  const { c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [goal, setGoal] = useState(8000);
  const [todaySteps, setTodaySteps] = useState(0);
  const [streak, setStreak] = useState(0);
  const [available, setAvailable] = useState(false);
  const [connected, setConnected] = useState(false);
  const [sheet, setSheet] = useState(false);

  const load = useCallback(async () => {
    const todayStr = today();
    const g = await getStepsGoal();
    setGoal(g);
    const avail = await isHealthAvailable();
    setAvailable(avail);
    const granted = avail && (await hasStepsPermission());
    setConnected(granted);
    if (granted) {
      const data = await readDailySteps(addDays(todayStr, -29), todayStr);
      for (const d of data) await upsertActivityDay(d.date, d.steps, 'health_connect');
    }
    const days = await listActivityDays(addDays(todayStr, -29));
    setTodaySteps(days.find((d) => d.date === todayStr)?.steps ?? 0);
    setStreak(computeStreak(days, g, todayStr));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, reloadNonce]),
  );

  async function connect() {
    const ok = await ensureStepsPermission();
    if (!ok) Alert.alert('Health Connect', 'No se pudo conectar. Puedes meter tus pasos a mano.');
    load();
  }

  function explain() {
    const t = GLOSSARY.find((x) => x.key === 'neat');
    if (t) Alert.alert(t.title, t.body);
  }

  const pct = goalProgress(todaySteps, goal);

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>Actividad de hoy</Text>
        {streak > 0 && <Text style={styles.streak}>🔥 {streak}</Text>}
        <Pressable hitSlop={8} onPress={explain}>
          <Ionicons name="help-circle-outline" size={18} color={c.textMuted} />
        </Pressable>
      </View>

      <View style={styles.ringRow}>
        <ProgressRing pct={pct}>
          <Text style={styles.steps}>{todaySteps}</Text>
          <Text style={styles.stepsLbl}>pasos</Text>
        </ProgressRing>
        <View style={styles.info}>
          <Text style={styles.goalTxt}>Meta {goal} pasos</Text>
          <Text style={styles.sourceTxt}>{connected ? 'Sincronizado con Health Connect' : available ? 'Sin conectar' : 'Entrada manual'}</Text>
        </View>
      </View>

      {available && !connected && (
        <Pressable style={styles.primary} onPress={connect}>
          <Text style={styles.primaryTxt}>Conectar Health Connect</Text>
        </Pressable>
      )}
      <Pressable style={styles.secondary} onPress={() => setSheet(true)}>
        <Text style={styles.secondaryTxt}>{connected ? 'Editar meta' : 'Añadir pasos / meta'}</Text>
      </Pressable>

      <StepsSheet
        visible={sheet}
        date={today()}
        initialGoal={goal}
        initialSteps={todaySteps}
        onClose={() => {
          setSheet(false);
          load();
        }}
      />
    </View>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    card: { backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 16, padding: 16, gap: 10 },
    head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    title: { color: c.text, fontSize: 16, fontWeight: '800', flex: 1 },
    streak: { color: c.flame, fontSize: 15, fontWeight: '800' },
    ringRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    steps: { color: c.text, fontSize: 22, fontWeight: '800' },
    stepsLbl: { color: c.textMuted, fontSize: 12, marginTop: -2 },
    info: { flex: 1, gap: 4 },
    goalTxt: { color: c.text, fontSize: 14, fontWeight: '700' },
    sourceTxt: { color: c.textMuted, fontSize: 12 },
    primary: { backgroundColor: c.accentStrong, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    primaryTxt: { color: c.onAccent, fontWeight: '800' },
    secondary: { borderColor: c.cardBorder, borderWidth: 1, borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
    secondaryTxt: { color: c.accent, fontWeight: '700' },
  });
```

> `c.flame` ya existe en el tema (naranja). `ProgressRing` acepta `pct` y children centrados (ver `WeightSummaryCard`).

- [ ] **Step 2: Renderizar en Inicio**

En `src/ui/WeightScreen.tsx`: importa `import { ActivityCard } from '@/ui/ActivityCard';` y añádelo en el JSX tras `<WeightSummaryCard reloadNonce={nonce} />`:

```tsx
      <ActivityCard reloadNonce={nonce} />
```

- [ ] **Step 3: Verificar tipos y bundle**

Run: `npx tsc --noEmit`
Expected: sin errores.
Run: `npx expo export --platform android` y borra `dist`.
Expected: BUNDLE OK.

- [ ] **Step 4: Commit**

```bash
git add src/ui/ActivityCard.tsx src/ui/WeightScreen.tsx
git commit -m "feat(actividad): tarjeta de pasos en Inicio (anillo + racha + conectar/manual)"
```

---

### Task 7: Tendencia de actividad en Progreso

**Files:**
- Create: `src/ui/ActivityTrend.tsx`
- Modify: `src/ui/ProgresoScreen.tsx` (añadir pestaña `'actividad'`)

**Interfaces:**
- Consumes: `listActivityDays`, `getStepsGoal` de `@/db/activity-repo`; `trendSeries`, `weeklyAverage` de `@/activity/steps`; `LineChart` de `@/ui/LineChart`; `addDays` de `@/bodyweight/goal`.
- Produces: `ActivityTrend({ reloadNonce }: { reloadNonce?: number })`.

- [ ] **Step 1: Implementar la tendencia**

```tsx
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { addDays } from '@/bodyweight/goal';
import { getStepsGoal, listActivityDays } from '@/db/activity-repo';
import { trendSeries, weeklyAverage } from '@/activity/steps';
import { LineChart } from '@/ui/LineChart';
import { useTheme, useThemedStyles, type Theme } from '@/ui/theme';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ActivityTrend({ reloadNonce }: { reloadNonce?: number }) {
  const { c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [series, setSeries] = useState<{ date: string; steps: number }[]>([]);
  const [avg, setAvg] = useState(0);
  const [goal, setGoal] = useState(8000);

  const load = useCallback(async () => {
    const todayStr = today();
    const from = addDays(todayStr, -29);
    const days = await listActivityDays(from);
    setSeries(trendSeries(days, from, todayStr));
    setAvg(weeklyAverage(days));
    setGoal(await getStepsGoal());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, reloadNonce]),
  );

  const hasData = series.some((d) => d.steps > 0);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Pasos · últimos 30 días</Text>
      {hasData ? (
        <>
          <LineChart values={series.map((d) => d.steps)} />
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statVal}>{avg}</Text>
              <Text style={styles.statLbl}>media (7 días)</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statVal}>{goal}</Text>
              <Text style={styles.statLbl}>meta diaria</Text>
            </View>
          </View>
        </>
      ) : (
        <Text style={styles.note}>Aún no hay pasos registrados. Conecta Health Connect o añádelos a mano en Inicio.</Text>
      )}
    </View>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    card: { backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 12, padding: 14, gap: 10 },
    title: { color: c.text, fontSize: 15, fontWeight: '800' },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
    stat: { alignItems: 'center' },
    statVal: { color: c.accent, fontSize: 17, fontWeight: '800' },
    statLbl: { color: c.textMuted, fontSize: 11, marginTop: 2 },
    note: { color: c.textMuted, fontSize: 13, fontStyle: 'italic' },
  });
```

- [ ] **Step 2: Añadir la pestaña en Progreso**

En `src/ui/ProgresoScreen.tsx`:
1. Cambia el tipo `type Tab = 'fuerza' | 'peso';` por `type Tab = 'fuerza' | 'peso' | 'actividad';`.
2. Importa `import { ActivityTrend } from './ActivityTrend';`.
3. En el bloque de pestañas (`<View style={styles.tabs}>`), añade tras la pestaña de peso:

```tsx
        <Pressable style={[styles.tab, tab === 'actividad' && styles.tabOn]} onPress={() => setTab('actividad')}>
          <Ionicons name="walk-outline" size={16} color={tab === 'actividad' ? c.text : c.textMuted} />
          <Text style={[styles.tabTxt, tab === 'actividad' && styles.tabTxtOn]}>Actividad</Text>
        </Pressable>
```

4. En el render condicional, cambia el `) : (` final del peso para encadenar la actividad. Sustituye el bloque:

```tsx
      ) : (
        <>
          <WeightDetail reloadNonce={nonce} />
          <WeightHistory reloadNonce={nonce} />
        </>
      )}
```

por:

```tsx
      ) : tab === 'peso' ? (
        <>
          <WeightDetail reloadNonce={nonce} />
          <WeightHistory reloadNonce={nonce} />
        </>
      ) : (
        <ActivityTrend reloadNonce={nonce} />
      )}
```

- [ ] **Step 3: Verificar tipos y bundle**

Run: `npx tsc --noEmit`
Expected: sin errores.
Run: `npx expo export --platform android` y borra `dist`.
Expected: BUNDLE OK.

- [ ] **Step 4: Commit**

```bash
git add src/ui/ActivityTrend.tsx src/ui/ProgresoScreen.tsx
git commit -m "feat(actividad): pestana de tendencia de pasos en Progreso"
```

---

### Task 8: Privacidad y notas de lanzamiento

**Files:**
- Modify: `docs/privacy.html` (mencionar lectura de pasos de Health Connect)

**Interfaces:** —

- [ ] **Step 1: Ampliar la política de privacidad**

En `docs/privacy.html`, dentro de la sección "Servicios de terceros" (la lista `<ul>`), añade un `<li>`:

```html
      <li><strong>Health Connect (Android)</strong> — si lo conectas, leemos tu recuento de <strong>pasos</strong>
        para mostrarte tu actividad diaria. Se lee solo en tu dispositivo; no se envían tus pasos a terceros.</li>
```

Y en la sección "Qué datos tratamos", dentro del `<li>` de "Datos que tú introduces", añade al final del texto: " y, si lo autorizas, tus pasos diarios desde Health Connect".

- [ ] **Step 2: Verificar y commit**

```bash
git add docs/privacy.html
git commit -m "docs(privacidad): lectura de pasos de Health Connect"
```

- [ ] **Step 3 (manual, fuera de código): Play Console**

Recordatorio para el usuario (no es código): en la build de producción habrá que declarar el uso de **Health Connect** y actualizar **Data Safety** (lectura de pasos / datos de salud y fitness). Esto se hace en la consola de Google Play.

---

## Verificación final (end-to-end, en dispositivo)

Health Connect no funciona en Expo Go: hace falta build de desarrollo o EAS.

1. `npx jest` — todos los tests, incluidos los de `src/activity/steps.ts`, en verde.
2. `npx tsc --noEmit` limpio y `npx expo export --platform android` OK.
3. Build de desarrollo (`eas build --profile development` o `npx expo run:android`) en un dispositivo con Health Connect:
   - Conceder permiso → la tarjeta de Inicio muestra los pasos del día y la racha; Progreso → Actividad muestra la tendencia.
   - Denegar permiso → el respaldo manual permite meter pasos y editar la meta.
   - Verificar que la racha se calcula bien a lo largo de varios días (o sembrando filas en `activity_day`).
4. Tras validar, **borrar** este plan y el spec del Núcleo de actividad (regla del proyecto).
