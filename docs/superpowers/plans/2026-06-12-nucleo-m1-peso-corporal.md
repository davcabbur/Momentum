# Núcleo M1 — Base de la app + seguimiento de peso corporal · Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tener la app Momentum corriendo en el móvil (Android, vía Expo Go) con el seguimiento de peso corporal completo: registrar pesajes, ver tendencia suavizada, objetivo con fecha estimada dinámica y dos barras guía (progreso/tiempo), todo persistido en local. Sin IMC, sin lenguaje que genere ansiedad.

**Architecture:** App Expo (React Native + TypeScript) con expo-router (pestañas). Persistencia local en SQLite vía Drizzle ORM. La lógica de peso (suavizado, pendiente, estimación de fecha, porcentajes) son **funciones puras** en `src/bodyweight/`, testeadas con Jest. La UI consume esa lógica y los repositorios de datos. Cada módulo tiene una responsabilidad clara.

**Tech Stack:** Expo SDK (último), React Native, TypeScript, expo-router, expo-sqlite, drizzle-orm + drizzle-kit, react-native-svg, jest-expo.

**Reglas de producto que afectan a este plan:** nunca mostrar IMC; tono tranquilizador; **manda la tendencia, no el pesaje del día**. Ver `CLAUDE.md`.

---

## Estructura de archivos (este milestone)

```
Momentum/
├── app/                         # expo-router (pantallas)
│   ├── (tabs)/
│   │   ├── _layout.tsx          # barra de pestañas: Hoy · Entreno · Progreso · Más
│   │   ├── index.tsx            # "Hoy" (placeholder con acceso a peso por ahora)
│   │   └── peso.tsx             # pantalla de peso corporal
│   └── _layout.tsx              # raíz: provee DB y migraciones
├── src/
│   ├── db/
│   │   ├── schema.ts            # tablas Drizzle (bodyweight_entry, weight_goal)
│   │   ├── client.ts            # apertura de SQLite + instancia Drizzle
│   │   └── bodyweight-repo.ts   # acceso a datos de peso/objetivo
│   ├── bodyweight/
│   │   ├── trend.ts             # EWMA y pendiente (lógica pura)
│   │   ├── goal.ts              # estimación de fecha y porcentajes (lógica pura)
│   │   └── format.ts            # formateo es-ES (kg con coma, fechas) — lógica pura
│   └── ui/
│       ├── theme.ts             # colores/espaciados compartidos
│       ├── WeightChart.tsx      # gráfica svg: puntos diarios + tendencia + objetivo
│       └── AddWeightSheet.tsx   # hoja para registrar peso
├── drizzle/                     # migraciones generadas por drizzle-kit
├── drizzle.config.ts
├── jest.config.js
└── __tests__/ (o *.test.ts junto al módulo)
```

**Decisión:** los tests de lógica pura viven junto al módulo (`trend.test.ts`, `goal.test.ts`) para que "lo que cambia junto, viva junto".

---

## Fase A — Scaffolding y app corriendo en el móvil

### Task A1: Crear el proyecto Expo dentro del repo

**Files:**
- Create: estructura Expo en la raíz del repo (manteniendo `.git`, `docs/`, `CLAUDE.md`, `.gitignore`, `README.md`).

- [ ] **Step 1: Generar la app en una carpeta temporal hermana**

PowerShell:
```powershell
cd "C:\Users\davec\OneDrive\Documentos"
npx create-expo-app@latest Momentum-tmp
```
Esto crea la plantilla por defecto (TypeScript + expo-router con pestañas).

- [ ] **Step 2: Mover el contenido generado al repo (sin pisar git/docs)**

PowerShell (copia todo menos `.git`):
```powershell
$src = "C:\Users\davec\OneDrive\Documentos\Momentum-tmp"
$dst = "C:\Users\davec\OneDrive\Documentos\Momentum"
Get-ChildItem -Path $src -Force | Where-Object { $_.Name -ne '.git' } | ForEach-Object {
  Copy-Item $_.FullName -Destination $dst -Recurse -Force
}
Remove-Item $src -Recurse -Force
```
Si `create-expo-app` generó su propio `.gitignore` o `README.md`, conservar el del proyecto (revisar el diff antes de aceptar; fusionar las reglas de Expo en nuestro `.gitignore` si faltan, p. ej. `/node_modules`, `.expo/`, `*.log`, `/dist`).

- [ ] **Step 3: Verificar que arranca en el móvil**

PowerShell:
```powershell
cd "C:\Users\davec\OneDrive\Documentos\Momentum"
npx expo start
```
Abrir **Expo Go** en el móvil Android y escanear el QR. Esperado: se ve la pantalla de ejemplo de Expo en el teléfono.
> Si Node 25 da error, instalar Node LTS 22 y reintentar.

- [ ] **Step 4: Limpiar la plantilla de ejemplo**

Borrar las pantallas/recursos de ejemplo que no usaremos (p. ej. el contenido de demo en `app/(tabs)/`), dejando un `(tabs)/_layout.tsx` y un `index.tsx` mínimos. Mantener compilando.

- [ ] **Step 5: Commit**

```powershell
git add -A
git commit -m "feat: scaffolding inicial de la app Expo (TS + expo-router)"
```

### Task A2: Configurar Jest para lógica pura

**Files:**
- Create: `jest.config.js`
- Modify: `package.json` (script `test`)

- [ ] **Step 1: Instalar dependencias de test**

```powershell
npx expo install jest-expo
npm install --save-dev jest @types/jest
```

- [ ] **Step 2: Crear `jest.config.js`**

```js
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
};
```

- [ ] **Step 3: Añadir script de test en `package.json`**

En `"scripts"` añadir:
```json
"test": "jest"
```

- [ ] **Step 4: Test de humo**

Create `src/bodyweight/smoke.test.ts`:
```ts
test('jest funciona', () => {
  expect(1 + 1).toBe(2);
});
```
Run: `npm test`
Expected: 1 passed.

- [ ] **Step 5: Commit**

```powershell
git add -A
git commit -m "test: configurar Jest (jest-expo)"
```

---

## Fase B — Lógica pura de peso (TDD)

> Funciones puras, sin dependencias de RN ni de la BD. Las fechas se pasan como argumento (`YYYY-MM-DD`), nunca se lee el reloj dentro de la lógica.

### Task B1: Suavizado de tendencia (EWMA)

**Files:**
- Create: `src/bodyweight/trend.ts`
- Test: `src/bodyweight/trend.test.ts`

- [ ] **Step 1: Escribir el test que falla**

```ts
import { computeTrend } from './trend';

test('el primer punto de tendencia es igual al primer pesaje', () => {
  const out = computeTrend([{ date: '2026-01-01', weightKg: 80 }]);
  expect(out[0].trendKg).toBeCloseTo(80, 5);
});

test('la tendencia suaviza el ruido diario (EWMA alpha=0.1)', () => {
  const out = computeTrend(
    [
      { date: '2026-01-01', weightKg: 80 },
      { date: '2026-01-02', weightKg: 82 }, // ruido al alza
    ],
    0.1,
  );
  // 80 + 0.1*(82-80) = 80.2
  expect(out[1].trendKg).toBeCloseTo(80.2, 5);
});

test('ordena por fecha aunque entren desordenados', () => {
  const out = computeTrend([
    { date: '2026-01-02', weightKg: 82 },
    { date: '2026-01-01', weightKg: 80 },
  ]);
  expect(out[0].date).toBe('2026-01-01');
  expect(out[1].date).toBe('2026-01-02');
});
```

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `npm test -- trend`
Expected: FAIL ("Cannot find module './trend'").

- [ ] **Step 3: Implementación mínima**

```ts
export interface WeightPoint {
  date: string; // YYYY-MM-DD
  weightKg: number;
}

export interface TrendPoint extends WeightPoint {
  trendKg: number;
}

/** Media móvil exponencial: ignora el ruido diario, resalta la dirección real. */
export function computeTrend(entries: WeightPoint[], alpha = 0.1): TrendPoint[] {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  let trend: number | null = null;
  return sorted.map((e) => {
    trend = trend === null ? e.weightKg : trend + alpha * (e.weightKg - trend);
    return { ...e, trendKg: trend };
  });
}
```

- [ ] **Step 4: Ejecutar y ver que pasa**

Run: `npm test -- trend`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```powershell
git add src/bodyweight/trend.ts src/bodyweight/trend.test.ts
git commit -m "feat: suavizado de tendencia de peso (EWMA)"
```

### Task B2: Pendiente de la tendencia (kg/semana)

**Files:**
- Modify: `src/bodyweight/trend.ts`
- Test: `src/bodyweight/trend.test.ts`

- [ ] **Step 1: Añadir el test que falla**

```ts
import { computeTrend, trendSlopePerWeek } from './trend';

test('pendiente negativa cuando la tendencia baja ~0,25 kg/semana', () => {
  // 15 días perdiendo 0,25 kg/semana ≈ 0,0357 kg/día
  const entries = Array.from({ length: 15 }, (_, i) => ({
    date: `2026-01-${String(i + 1).padStart(2, '0')}`,
    weightKg: 80 - i * (0.25 / 7),
  }));
  const trend = computeTrend(entries, 1); // alpha=1 → tendencia = pesaje, para test determinista
  const slope = trendSlopePerWeek(trend, 14);
  expect(slope).toBeCloseTo(-0.25, 1);
});

test('pendiente 0 con un solo punto', () => {
  const trend = computeTrend([{ date: '2026-01-01', weightKg: 80 }]);
  expect(trendSlopePerWeek(trend, 14)).toBe(0);
});
```

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `npm test -- trend`
Expected: FAIL ("trendSlopePerWeek is not a function").

- [ ] **Step 3: Implementación**

Añadir a `trend.ts`:
```ts
const MS_PER_DAY = 86_400_000;

function dayNumber(isoDate: string): number {
  return Math.round(new Date(isoDate + 'T00:00:00Z').getTime() / MS_PER_DAY);
}

/** Pendiente de la tendencia en kg/semana, por mínimos cuadrados sobre los últimos `windowDays`. */
export function trendSlopePerWeek(trend: TrendPoint[], windowDays = 14): number {
  if (trend.length < 2) return 0;
  const lastDay = dayNumber(trend[trend.length - 1].date);
  const window = trend.filter((p) => lastDay - dayNumber(p.date) <= windowDays);
  if (window.length < 2) return 0;

  const xs = window.map((p) => dayNumber(p.date));
  const ys = window.map((p) => p.trendKg);
  const n = xs.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  const slopePerDay = den === 0 ? 0 : num / den;
  return slopePerDay * 7;
}
```

- [ ] **Step 4: Ejecutar y ver que pasa**

Run: `npm test -- trend`
Expected: 5 passed.

- [ ] **Step 5: Commit**

```powershell
git add src/bodyweight/trend.ts src/bodyweight/trend.test.ts
git commit -m "feat: pendiente semanal de la tendencia de peso"
```

### Task B3: Estimación de fecha al objetivo y barras guía

**Files:**
- Create: `src/bodyweight/goal.ts`
- Test: `src/bodyweight/goal.test.ts`

- [ ] **Step 1: Escribir el test que falla**

```ts
import { estimateDaysToGoal, addDays, goalProgressPct, timeElapsedPct } from './goal';

test('estima días al objetivo cuando se progresa en la dirección correcta', () => {
  // faltan 1 kg, perdiendo 0,25 kg/semana → 28 días
  const days = estimateDaysToGoal({ currentTrendKg: 75, goalKg: 74, slopePerWeek: -0.25 });
  expect(days).toBe(28);
});

test('devuelve null si no se progresa hacia el objetivo', () => {
  // quiere bajar pero la tendencia sube
  expect(estimateDaysToGoal({ currentTrendKg: 75, goalKg: 74, slopePerWeek: 0.2 })).toBeNull();
  // pendiente plana
  expect(estimateDaysToGoal({ currentTrendKg: 75, goalKg: 74, slopePerWeek: 0 })).toBeNull();
});

test('addDays suma días en formato ISO', () => {
  expect(addDays('2026-01-01', 31)).toBe('2026-02-01');
});

test('progreso = recorrido / distancia total, acotado 0..100', () => {
  expect(goalProgressPct({ startKg: 80, currentTrendKg: 78, goalKg: 74 })).toBeCloseTo(33.33, 1);
  expect(goalProgressPct({ startKg: 80, currentTrendKg: 81, goalKg: 74 })).toBe(0); // ha ido al revés
  expect(goalProgressPct({ startKg: 80, currentTrendKg: 73, goalKg: 74 })).toBe(100); // pasado
});

test('tiempo transcurrido = días pasados / días totales estimados, acotado 0..100', () => {
  expect(timeElapsedPct({ startDate: '2026-01-01', asOf: '2026-01-08', estimatedTotalDays: 28 })).toBeCloseTo(25, 1);
});
```

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `npm test -- goal`
Expected: FAIL ("Cannot find module './goal'").

- [ ] **Step 3: Implementación**

```ts
const MS_PER_DAY = 86_400_000;

export function addDays(isoDate: string, days: number): string {
  const t = new Date(isoDate + 'T00:00:00Z').getTime() + days * MS_PER_DAY;
  return new Date(t).toISOString().slice(0, 10);
}

export function daysBetween(fromIso: string, toIso: string): number {
  const a = new Date(fromIso + 'T00:00:00Z').getTime();
  const b = new Date(toIso + 'T00:00:00Z').getTime();
  return Math.round((b - a) / MS_PER_DAY);
}

/** Días estimados hasta el objetivo según la pendiente actual. null si no se avanza hacia él. */
export function estimateDaysToGoal(p: {
  currentTrendKg: number;
  goalKg: number;
  slopePerWeek: number;
}): number | null {
  const remaining = p.goalKg - p.currentTrendKg; // signo: hacia dónde hay que ir
  if (remaining === 0) return 0;
  const slopePerDay = p.slopePerWeek / 7;
  if (slopePerDay === 0) return null;
  // ¿la pendiente apunta hacia el objetivo?
  if (Math.sign(remaining) !== Math.sign(slopePerDay)) return null;
  return Math.round(remaining / slopePerDay);
}

function clampPct(x: number): number {
  return Math.max(0, Math.min(100, x));
}

export function goalProgressPct(p: { startKg: number; currentTrendKg: number; goalKg: number }): number {
  const total = p.startKg - p.goalKg;
  if (total === 0) return 100;
  return clampPct(((p.startKg - p.currentTrendKg) / total) * 100);
}

export function timeElapsedPct(p: { startDate: string; asOf: string; estimatedTotalDays: number }): number {
  if (p.estimatedTotalDays <= 0) return 0;
  const elapsed = daysBetween(p.startDate, p.asOf);
  return clampPct((elapsed / p.estimatedTotalDays) * 100);
}
```

- [ ] **Step 4: Ejecutar y ver que pasa**

Run: `npm test -- goal`
Expected: todos los tests de goal en verde.

- [ ] **Step 5: Commit**

```powershell
git add src/bodyweight/goal.ts src/bodyweight/goal.test.ts
git commit -m "feat: estimación de fecha al objetivo y barras de progreso/tiempo"
```

### Task B4: Formateo es-ES (coma decimal, fechas en lenguaje natural)

**Files:**
- Create: `src/bodyweight/format.ts`
- Test: `src/bodyweight/format.test.ts`

- [ ] **Step 1: Test que falla**

```ts
import { formatKg, formatDelta, friendlyMonth } from './format';

test('peso con una decimal y coma', () => {
  expect(formatKg(78.42)).toBe('78,4 kg');
});

test('delta con signo y flecha', () => {
  expect(formatDelta(-0.5)).toBe('▼ 0,5 kg');
  expect(formatDelta(0.3)).toBe('▲ 0,3 kg');
  expect(formatDelta(0)).toBe('— 0,0 kg');
});

test('mes natural en español', () => {
  expect(friendlyMonth('2026-10-15')).toBe('mediados de octubre');
  expect(friendlyMonth('2026-10-03')).toBe('principios de octubre');
  expect(friendlyMonth('2026-10-27')).toBe('finales de octubre');
});
```

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `npm test -- format`
Expected: FAIL ("Cannot find module './format'").

- [ ] **Step 3: Implementación**

```ts
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export function formatKg(kg: number): string {
  return `${kg.toFixed(1).replace('.', ',')} kg`;
}

export function formatDelta(deltaKg: number): string {
  const arrow = deltaKg < 0 ? '▼' : deltaKg > 0 ? '▲' : '—';
  return `${arrow} ${Math.abs(deltaKg).toFixed(1).replace('.', ',')} kg`;
}

/** "principios/mediados/finales de <mes>" según el día del mes. */
export function friendlyMonth(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00Z');
  const day = d.getUTCDate();
  const mes = MESES[d.getUTCMonth()];
  const franja = day <= 10 ? 'principios' : day <= 20 ? 'mediados' : 'finales';
  return `${franja} de ${mes}`;
}
```

- [ ] **Step 4: Ejecutar y ver que pasa**

Run: `npm test -- format`
Expected: verdes.

- [ ] **Step 5: Commit**

```powershell
git add src/bodyweight/format.ts src/bodyweight/format.test.ts
git commit -m "feat: formateo es-ES de peso, delta y fechas"
```

---

## Fase C — Capa de datos (SQLite + Drizzle)

### Task C1: Esquema y cliente de base de datos

**Files:**
- Create: `src/db/schema.ts`, `src/db/client.ts`, `drizzle.config.ts`
- Modify: `package.json` (script `db:generate`)

- [ ] **Step 1: Instalar dependencias**

```powershell
npx expo install expo-sqlite
npm install drizzle-orm
npm install --save-dev drizzle-kit
```

- [ ] **Step 2: Definir el esquema**

`src/db/schema.ts`:
```ts
import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

export const bodyweightEntry = sqliteTable('bodyweight_entry', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull(),        // YYYY-MM-DD (único por día a nivel de app)
  weightKg: real('weight_kg').notNull(),
});

export const weightGoal = sqliteTable('weight_goal', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  targetKg: real('target_kg').notNull(),
  startKg: real('start_kg').notNull(),
  startDate: text('start_date').notNull(), // YYYY-MM-DD
});
```
> Nota de producto: no existe ningún campo de IMC, ni se calculará. (Ver `CLAUDE.md`.)

- [ ] **Step 3: Cliente Drizzle sobre expo-sqlite**

`src/db/client.ts`:
```ts
import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

export const sqlite = openDatabaseSync('momentum.db', { enableChangeListener: true });
export const db = drizzle(sqlite, { schema });
```

- [ ] **Step 4: Config de drizzle-kit y script**

`drizzle.config.ts`:
```ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'expo',
} satisfies Config;
```
En `package.json` → `"scripts"`:
```json
"db:generate": "drizzle-kit generate"
```

- [ ] **Step 5: Generar la primera migración**

```powershell
npm run db:generate
```
Expected: aparece `drizzle/0000_*.sql` y `drizzle/migrations.js`.

- [ ] **Step 6: Commit**

```powershell
git add -A
git commit -m "feat: esquema de peso/objetivo y cliente Drizzle (expo-sqlite)"
```

### Task C2: Aplicar migraciones al arrancar la app

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Envolver la app con el hook de migraciones**

En `app/_layout.tsx`, antes de renderizar las pestañas:
```tsx
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { db } from '../src/db/client';
import migrations from '../drizzle/migrations';
import { ActivityIndicator, Text, View } from 'react-native';

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations);

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Error preparando la base de datos: {error.message}</Text>
      </View>
    );
  }
  if (!success) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }
  // ...resto del layout (Stack/Slot de expo-router)
}
```
> Habilitar el plugin de Metro de drizzle si hace falta para importar `.sql` (seguir el aviso de la doc de Drizzle/Expo en `metro.config.js`: `config.resolver.sourceExts.push('sql')`).

- [ ] **Step 2: Verificar en el móvil**

Run: `npx expo start` → abrir en Expo Go.
Expected: la app arranca sin error de BD (spinner breve y luego pestañas).

- [ ] **Step 3: Commit**

```powershell
git add -A
git commit -m "feat: aplicar migraciones Drizzle al inicio"
```

### Task C3: Repositorio de peso

**Files:**
- Create: `src/db/bodyweight-repo.ts`

- [ ] **Step 1: Implementar el repositorio**

```ts
import { eq } from 'drizzle-orm';
import { db } from './client';
import { bodyweightEntry, weightGoal } from './schema';

export async function upsertWeight(date: string, weightKg: number): Promise<void> {
  const existing = await db.select().from(bodyweightEntry).where(eq(bodyweightEntry.date, date));
  if (existing.length > 0) {
    await db.update(bodyweightEntry).set({ weightKg }).where(eq(bodyweightEntry.date, date));
  } else {
    await db.insert(bodyweightEntry).values({ date, weightKg });
  }
}

export async function listWeights(): Promise<{ date: string; weightKg: number }[]> {
  const rows = await db.select().from(bodyweightEntry);
  return rows.map((r) => ({ date: r.date, weightKg: r.weightKg }));
}

export async function getGoal() {
  const rows = await db.select().from(weightGoal).limit(1);
  return rows[0] ?? null;
}

export async function setGoal(targetKg: number, startKg: number, startDate: string): Promise<void> {
  const current = await getGoal();
  if (current) {
    await db.update(weightGoal).set({ targetKg, startKg, startDate }).where(eq(weightGoal.id, current.id));
  } else {
    await db.insert(weightGoal).values({ targetKg, startKg, startDate });
  }
}
```

- [ ] **Step 2: Comprobar que compila**

Run: `npx tsc --noEmit`
Expected: sin errores de tipos.

- [ ] **Step 3: Commit**

```powershell
git add src/db/bodyweight-repo.ts
git commit -m "feat: repositorio de peso corporal y objetivo"
```

---

## Fase D — UI del seguimiento de peso

### Task D1: Tema compartido y barra de pestañas

**Files:**
- Create: `src/ui/theme.ts`
- Modify: `app/(tabs)/_layout.tsx`

- [ ] **Step 1: Tema**

`src/ui/theme.ts`:
```ts
export const theme = {
  bg: '#0f0f13',
  card: '#15151b',
  border: '#26262f',
  text: '#e9e9ef',
  textMuted: '#8a8a96',
  accent: '#a78bfa',
  accent2: '#8b5cf6',
  good: '#34d399',
  info: '#7dd3fc',
  radius: 14,
  space: 14,
};
```

- [ ] **Step 2: Pestañas Hoy · Entreno · Progreso · Más**

En `app/(tabs)/_layout.tsx`, definir las cuatro pestañas con `Tabs.Screen` (iconos a elegir del set de Expo). Por ahora "Entreno", "Progreso" y "Más" pueden ser pantallas placeholder con un texto; "Hoy" enlaza a peso.

- [ ] **Step 3: Verificar navegación en el móvil**

Run: `npx expo start`. Esperado: se ven 4 pestañas y se puede navegar.

- [ ] **Step 4: Commit**

```powershell
git add -A
git commit -m "feat: tema compartido y barra de pestañas"
```

### Task D2: Gráfica de peso (svg)

**Files:**
- Create: `src/ui/WeightChart.tsx`

- [ ] **Step 1: Instalar svg**

```powershell
npx expo install react-native-svg
```

- [ ] **Step 2: Componente de gráfica**

`src/ui/WeightChart.tsx` recibe `points: TrendPoint[]` y `goalKg?: number` y dibuja: puntos diarios (gris), línea de tendencia (morada) y línea de objetivo (verde discontinua). Escalado al min/max del conjunto. Implementación con `Svg`, `Circle`, `Path`, `Line` de `react-native-svg`. (Replicar el diseño aprobado de la maqueta `bodyweight-v2`.)

```tsx
import Svg, { Circle, Path, Line, Text as SvgText } from 'react-native-svg';
import { TrendPoint } from '../bodyweight/trend';
import { theme } from './theme';

export function WeightChart({ points, goalKg, width = 300, height = 130 }: {
  points: TrendPoint[]; goalKg?: number; width?: number; height?: number;
}) {
  if (points.length === 0) return null;
  const weights = points.map((p) => p.weightKg).concat(points.map((p) => p.trendKg));
  if (goalKg != null) weights.push(goalKg);
  const min = Math.min(...weights) - 0.5;
  const max = Math.max(...weights) + 0.5;
  const x = (i: number) => (i / Math.max(1, points.length - 1)) * width;
  const y = (w: number) => height - ((w - min) / (max - min)) * height;
  const trendPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.trendKg)}`).join(' ');
  return (
    <Svg width={width} height={height}>
      {goalKg != null && (
        <Line x1={0} y1={y(goalKg)} x2={width} y2={y(goalKg)} stroke={theme.good} strokeDasharray="4 4" strokeWidth={1} />
      )}
      {points.map((p, i) => (
        <Circle key={i} cx={x(i)} cy={y(p.weightKg)} r={2.6} fill={theme.textMuted} />
      ))}
      <Path d={trendPath} stroke={theme.accent} strokeWidth={3} fill="none" strokeLinecap="round" />
    </Svg>
  );
}
```

- [ ] **Step 3: Compila**

Run: `npx tsc --noEmit` → sin errores.

- [ ] **Step 4: Commit**

```powershell
git add -A
git commit -m "feat: gráfica svg de peso (puntos + tendencia + objetivo)"
```

### Task D3: Hoja para registrar peso

**Files:**
- Create: `src/ui/AddWeightSheet.tsx`

- [ ] **Step 1: Componente de entrada**

Modal/hoja con un input numérico (teclado decimal) prerellenado con el último peso, botones +/− de 0,1 kg, y "Guardar" que llama a `upsertWeight(hoy, valor)`. La fecha "hoy" se obtiene en el componente (`new Date().toISOString().slice(0,10)`), no en la lógica pura. Tras guardar, cerrar y refrescar.

```tsx
import { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable } from 'react-native';
import { upsertWeight } from '../db/bodyweight-repo';
import { theme } from './theme';

export function AddWeightSheet({ visible, initialKg, onClose }: {
  visible: boolean; initialKg: number; onClose: () => void;
}) {
  const [value, setValue] = useState(String(initialKg));
  async function save() {
    const kg = parseFloat(value.replace(',', '.'));
    if (!Number.isNaN(kg)) {
      const today = new Date().toISOString().slice(0, 10);
      await upsertWeight(today, kg);
    }
    onClose();
  }
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#0008' }}>
        <View style={{ backgroundColor: theme.card, padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
          <Text style={{ color: theme.text, fontSize: 16, marginBottom: 12 }}>Peso de hoy (kg)</Text>
          <TextInput
            value={value}
            onChangeText={setValue}
            keyboardType="decimal-pad"
            style={{ color: theme.text, fontSize: 28, backgroundColor: theme.bg, borderRadius: 12, padding: 12 }}
          />
          <Pressable onPress={save} style={{ backgroundColor: theme.good, borderRadius: 12, padding: 14, marginTop: 14 }}>
            <Text style={{ textAlign: 'center', fontWeight: '800' }}>Guardar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
```

- [ ] **Step 2: Compila**

Run: `npx tsc --noEmit` → sin errores.

- [ ] **Step 3: Commit**

```powershell
git add -A
git commit -m "feat: hoja para registrar el peso del día"
```

### Task D4: Pantalla de peso (ensamblado final)

**Files:**
- Create: `app/(tabs)/peso.tsx`

- [ ] **Step 1: Construir la pantalla**

Junta todo: carga pesos y objetivo del repo, calcula `computeTrend` → `trendSlopePerWeek` → `estimateDaysToGoal` → `addDays`/`friendlyMonth` → `goalProgressPct`/`timeElapsedPct`. Muestra: número grande = tendencia actual (`formatKg`) + `formatDelta`, gráfica (`WeightChart`), tarjeta de objetivo (fecha estimada con `friendlyMonth`, dos barras), tarjeta educativa, y botón ＋ en cabecera que abre `AddWeightSheet`. Recargar datos tras cerrar la hoja.

```tsx
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { listWeights, getGoal } from '../../src/db/bodyweight-repo';
import { computeTrend, trendSlopePerWeek } from '../../src/bodyweight/trend';
import { estimateDaysToGoal, addDays, goalProgressPct, timeElapsedPct, daysBetween } from '../../src/bodyweight/goal';
import { formatKg, formatDelta, friendlyMonth } from '../../src/bodyweight/format';
import { WeightChart } from '../../src/ui/WeightChart';
import { AddWeightSheet } from '../../src/ui/AddWeightSheet';
import { theme } from '../../src/ui/theme';

export default function PesoScreen() {
  const [points, setPoints] = useState<ReturnType<typeof computeTrend>>([]);
  const [goal, setGoal] = useState<{ targetKg: number; startKg: number; startDate: string } | null>(null);
  const [sheet, setSheet] = useState(false);

  const load = useCallback(async () => {
    const ws = await listWeights();
    setPoints(computeTrend(ws, 0.1));
    const g = await getGoal();
    setGoal(g ? { targetKg: g.targetKg, startKg: g.startKg, startDate: g.startDate } : null);
  }, []);

  useEffect(() => { load(); }, [load]);

  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  const slope = trendSlopePerWeek(points, 14);
  const today = new Date().toISOString().slice(0, 10);

  let goalView = null;
  if (goal && last) {
    const days = estimateDaysToGoal({ currentTrendKg: last.trendKg, goalKg: goal.targetKg, slopePerWeek: slope });
    const progress = goalProgressPct({ startKg: goal.startKg, currentTrendKg: last.trendKg, goalKg: goal.targetKg });
    const totalDays = days != null ? daysBetween(goal.startDate, today) + days : 0;
    const timePct = days != null ? timeElapsedPct({ startDate: goal.startDate, asOf: today, estimatedTotalDays: totalDays }) : 0;
    goalView = (
      <View style={{ backgroundColor: theme.card, borderRadius: theme.radius, padding: 14, marginTop: 12 }}>
        <Text style={{ color: theme.text, fontWeight: '700' }}>🎯 Objetivo: {formatKg(goal.targetKg)}</Text>
        <Text style={{ color: theme.info, marginVertical: 6 }}>
          {days != null ? `Llegarías hacia ${friendlyMonth(addDays(today, days))} a tu ritmo actual` : 'Sigue registrando para estimar la fecha'}
        </Text>
        <Bar label="Progreso" pct={progress} color={theme.accent} />
        {days != null && <Bar label="Tiempo transcurrido" pct={timePct} color="#5b8fd4" />}
        <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 8 }}>
          Es una guía orientativa, no una fecha límite. El cuerpo no es lineal y eso es normal.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.bg }} contentContainerStyle={{ padding: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: theme.text, fontSize: 20, fontWeight: '800' }}>Peso corporal</Text>
        <Pressable onPress={() => setSheet(true)} style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: theme.accent2, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700' }}>＋</Text>
        </Pressable>
      </View>

      {last ? (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 10 }}>
            <Text style={{ color: theme.text, fontSize: 32, fontWeight: '800' }}>{formatKg(last.trendKg)}</Text>
            <Text style={{ color: theme.textMuted }}>tendencia</Text>
            {prev && <Text style={{ color: theme.good, marginLeft: 'auto' }}>{formatDelta(last.trendKg - prev.trendKg)}</Text>}
          </View>
          <View style={{ backgroundColor: theme.card, borderRadius: theme.radius, padding: 10, marginTop: 10 }}>
            <WeightChart points={points} goalKg={goal?.targetKg} />
          </View>
          {goalView}
          <View style={{ backgroundColor: '#1a2330', borderRadius: theme.radius, padding: 12, marginTop: 12 }}>
            <Text style={{ color: theme.info, fontWeight: '700', marginBottom: 4 }}>💡 Tranquilo</Text>
            <Text style={{ color: '#b9c4d0', fontSize: 12 }}>
              Una subida de un día suele ser agua o glucógeno, no grasa. Mira la línea de tendencia, no el número del día.
            </Text>
          </View>
        </>
      ) : (
        <Text style={{ color: theme.textMuted, marginTop: 20 }}>Aún no hay pesajes. Toca ＋ para registrar el primero.</Text>
      )}

      <AddWeightSheet visible={sheet} initialKg={last?.weightKg ?? 75} onClose={() => { setSheet(false); load(); }} />
    </ScrollView>
  );
}

function Bar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <View style={{ marginTop: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: theme.textMuted, fontSize: 11 }}>{label}</Text>
        <Text style={{ color: theme.text, fontSize: 11, fontWeight: '700' }}>{Math.round(pct)} %</Text>
      </View>
      <View style={{ height: 9, backgroundColor: '#23232c', borderRadius: 99, overflow: 'hidden', marginTop: 4 }}>
        <View style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: 99 }} />
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Verificar el flujo completo en el móvil**

Run: `npx expo start`. En el teléfono: registrar 2-3 pesos (puede editarse "hoy"), ver número de tendencia, gráfica y, si hay objetivo, las barras. (El alta de objetivo puede hacerse temporalmente desde un botón de prueba o sembrando `setGoal` hasta que se diseñe su pantalla en M-siguiente.)
Expected: los datos persisten al cerrar y reabrir la app.

- [ ] **Step 3: Commit**

```powershell
git add -A
git commit -m "feat: pantalla de peso corporal (tendencia, objetivo, barras guía)"
```

---

## Fase E — Cierre del milestone

### Task E1: Actualizar CLAUDE.md y limpiar

- [ ] **Step 1: Rellenar comandos reales en `CLAUDE.md`**

Sustituir la sección "Comandos (cuando exista la app)" por los reales: `npx expo start`, `npm test`, `npm run db:generate`.

- [ ] **Step 2: Verificación final**

Run: `npm test` (toda la lógica en verde) y `npx tsc --noEmit` (sin errores de tipos).

- [ ] **Step 3: Commit**

```powershell
git add -A
git commit -m "docs: comandos reales en CLAUDE.md tras M1"
```

> **Nota sobre borrado de specs/planes:** según la norma del proyecto, cuando **todo el Núcleo (M1 peso + M2 entreno)** esté implementado, borrar el spec `docs/superpowers/specs/2026-06-12-nucleo-seguimiento-design.md` y los planes de `docs/superpowers/plans/`. No borrar este plan hasta que M1 esté terminado y verificado. (Si prefieres borrar cada plan al cerrar su milestone, dilo y lo hacemos así.)

---

## Self-review (cobertura del spec)

- **Peso: registro** → C3, D3. **Tendencia suavizada** → B1, D4. **Objetivo + fecha dinámica** → B3, D4. **Dos barras guía** → B3, D4. **Tarjeta educativa / sin ansiedad** → D4. **Sin IMC** → C1 (sin campo) y revisión en convenciones. **Persistencia local** → C1–C3. **Stack Expo/SQLite/Drizzle/svg/jest** → A, C, D.
- **Fuera de este milestone (M2 u otros):** registro de entrenos, biblioteca de ejercicios, rutina, niveles/progresión, progreso por ejercicio, glosario, pantalla de alta de objetivo con UI propia, perfil. Se planificarán aparte.
- Sin placeholders en la lógica (B) ni en datos (C). La UI (D) incluye código real; se afinará visualmente al verla en el móvil, como acordamos.
