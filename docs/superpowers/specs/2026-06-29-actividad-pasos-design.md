# Actividad diaria (pasos / NEAT) — Diseño

## Contexto

Momentum no tiene cardio. Según la metodología del proyecto (memoria `nutrition-recomp-methodology`), la palanca controlable y más rentable no es machacarse a cardio sino el **NEAT** (actividad diaria: pasos, escaleras). Decisiones tomadas en brainstorming:

- El "cardio" se aborda como **actividad diaria = pasos**, no como sesiones de cardio (correr/bici).
- Los pasos son una **meta de movimiento + educación**, **no** se suman a las kcal del día (el TDEE ya incluye la actividad vía el nivel de actividad → evitar doble conteo).
- Pasos **automáticos desde el móvil** (Health Connect en Android) con **respaldo manual** siempre disponible.
- Incluye **racha** de días cumpliendo la meta (el usuario la pidió explícitamente). Tono directo y motivador, pero **sin mensajes de culpa** al romperse.
- Meta por defecto **8.000 pasos**, editable (el "10.000" es marketing; el beneficio de salud satura en torno a 7.500–8.000/día).

Resultado buscado: una tarjeta en **Hoy** con pasos de hoy vs meta + racha, una **tendencia semanal** en Progreso, y educación (glosario NEAT).

## Alcance

**Dentro:**
- Lectura de pasos de Health Connect (Android) + entrada manual de respaldo.
- Persistencia local de pasos por día (entra en la sincronización en la nube).
- Meta diaria editable (default 8.000) y racha de días cumpliendo.
- Tarjeta en Hoy, tendencia en Progreso, entrada de glosario NEAT.

**Fuera (YAGNI):**
- Sesiones de cardio (correr, bici, HIIT) con duración/distancia/kcal.
- Que los pasos afinen el TDEE/kcal.
- iOS (HealthKit): el puente se diseña con guarda de plataforma; en iOS/no disponible → solo manual. HealthKit más adelante.

## Datos

- **Tabla nueva `activity_day`** (`src/db/schema.ts`): `id` PK autoincrement, `date` text `YYYY-MM-DD` (única a nivel de app), `steps` integer, `source` text (`'health_connect' | 'manual'`). Migración Drizzle (tabla nueva, sin riesgo de NOT NULL sobre filas existentes). Añadir `activity_day` a `TABLES` en `src/db/backup.ts` para que entre en export/import y, por tanto, en la sync de la nube.
- **Meta**: `app_setting` clave `steps_goal` (string del número; default 8000 si no existe).
- **Repo** `src/db/activity-repo.ts`: `upsertDay(date, steps, source)` (patrón buscar→update/insert como food/bodyweight), `listDays(fromDate)`, `getStepsGoal()/setStepsGoal(n)`.

## Puente nativo (Health Connect)

`src/lib/health-connect.ts` — aísla la dependencia nativa (`react-native-health-connect` + su config plugin; fijar versión/plugin en el plan). API:

- `isAvailable(): Promise<boolean>` — `Platform.OS === 'android'` y SDK de Health Connect disponible.
- `ensurePermission(): Promise<boolean>` — `initialize()` + `requestPermission([{ accessType: 'read', recordType: 'Steps' }])`.
- `readDailySteps(fromIso, toIso): Promise<{ date: string; steps: number }[]>` — agregado diario (aggregateGroupByPeriod por día).

Guarda: en iOS o si no está disponible, `isAvailable` devuelve false y la UI cae a manual. Requiere build de desarrollo/EAS (no Expo Go).

**Sincronización de datos** (al enfocar Hoy): si `isAvailable` y permiso concedido → leer hoy + últimos ~30 días y `upsertDay(..., 'health_connect')` (solo días con dato de HC; no piso entradas manuales de días sin dato HC). La UI siempre lee de `activity_day` (funciona offline). Si no hay permiso → botón "Conectar"; si no disponible → solo manual.

## Lógica pura (TDD — tests antes que implementación)

`src/activity/steps.ts`:
- `goalProgress(steps, goal): number` — 0..100 (clamp) para el anillo.
- `weeklyAverage(days): number` — media de pasos de los últimos 7 días con dato.
- `computeStreak(days, goal, todayIso): number` — días consecutivos cumpliendo la meta; **hoy cuenta solo si ya se alcanzó**, si no se cuenta hacia atrás desde ayer; un día por debajo (o sin dato) corta la racha.
- `trendSeries(days, fromIso, toIso): { date; steps }[]` — serie rellenando huecos con 0 para la gráfica.

Casos de test de `computeStreak`: vacío → 0; todos cumplen incluido hoy → N; hoy aún no cumplido pero ayer sí → cuenta desde ayer; hueco/día flojo → reinicia.

## UI y tono

- **`src/ui/StepsCard.tsx`** en la pantalla **Hoy/Inicio**: anillo pasos de hoy vs meta, **🔥 + número de racha**, y según estado: botón "Conectar Health Connect" / "Añadir pasos a mano". Tocar la tarjeta abre una breve explicación (educación). Colores vía tema (`useTheme`/`useThemedStyles`); reutilizar el patrón de anillo de `KcalDashboard` (extraer un `Ring` compartido o replicar mínimamente).
- **`src/ui/StepsSheet.tsx`**: editar la meta y meter pasos del día a mano (respaldo).
- **Progreso**: tendencia semanal de pasos (barras) junto a las de peso/fuerza (mini-sección o pestaña "Actividad"; ubicación exacta en el plan).
- **Glosario** (`education/`): entrada **NEAT** — la actividad diaria es la palanca controlable; zona 2 y HIIT ambos válidos, elegir el sostenible, no hace falta pasarse; tu actividad ya está en tu mantenimiento (por eso los pasos no se suman a las kcal).
- Tono directo y motivador; la racha **se reinicia sin dramatismo** (sin mensajes de culpa).

## Implicaciones de lanzamiento

Health Connect es **cambio nativo** → build nueva (no OTA, no Expo Go). Además:
- Permiso `android.permission.health.READ_STEPS` en el manifiesto + manejo de la pantalla de justificación de Health Connect (lo cablea el config plugin; le pasamos la URL de privacidad).
- **Declaración de Health Connect en la Play Console** y actualizar **Data Safety** (lectura de pasos/datos de salud).
- Ampliar `docs/privacy.html`: mencionar que se leen los **pasos** de Health Connect, solo en el dispositivo, para mostrar tu actividad.
- Encaja con la build de producción pendiente, pero añade fricción a la revisión.

## Verificación

- `npx jest` — tests de `src/activity/steps.ts` (incluida `computeStreak`).
- `npx tsc --noEmit` y `npx expo export --platform android`.
- Prueba en dispositivo (build de desarrollo): conceder permiso de Health Connect y comprobar que la tarjeta muestra los pasos del día y la tendencia; denegar permiso y comprobar el respaldo manual; verificar la racha a lo largo de varios días (o sembrando datos).
