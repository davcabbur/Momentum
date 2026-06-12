# Momentum — Núcleo de seguimiento (cimientos)

**Fecha:** 2026-06-12
**Estado:** Diseño aprobado · pendiente de plan de implementación
**Subproyecto:** A — Núcleo de seguimiento (el primero de varios)

---

## 1. Visión de Momentum

Momentum es una app de gimnasio que **no es un registro tonto de datos: es un entrenador que entiende y educa.** Nace de la experiencia real de su autor (años entrenando, muchas apps probadas y ninguna del todo buena). Pilares de la visión global:

1. **Rutinas adaptadas a la persona**, no plantillas genéricas.
2. **Kcal vivas**: se recalculan según el peso real registrado, no un número fijo. Con educación encima ("subir un día ≠ engordar": agua, glucógeno, músculo).
3. **Registro de levantamientos cómodo y muy visual** — lo contrario a las apps arcaicas.
4. **Lo fundamental, gratis y sin anuncios** (contador de macros + escáner de código de barras serán de base en su fase).
5. **Inteligencia de fases**: detectar estancamiento/fatiga, demasiado tiempo en déficit → recomendar refeed o cambio de etapa para sacar al cuerpo del "modo alarma".
6. **Lenguaje de entrenador, traducido**: usa RIR, RPE, top set, back-off, deload… pero cada término se explica en lenguaje llano.

**Primer usuario:** el propio autor (la app se diseña usándolo como caso de referencia). Si funciona, se valorará sacarla al mercado o compartirla.

### Decisión de producto firme
- **El IMC NO se usa ni se muestra en ningún sitio.** No distingue músculo de grasa; contradice la filosofía de la app.
- **Nada debe generar ansiedad.** Las guías (fechas, barras de progreso) orientan, no presionan. El cuerpo no es lineal y la app lo refleja en su lenguaje.

---

## 2. Por qué empezamos por el Núcleo de seguimiento

La app se construye por subsistemas independientes que encajan:

| Pieza | Qué hace | Depende de |
|---|---|---|
| **A. Núcleo de seguimiento** | Registrar entrenamientos y peso corporal, muy visual | — (base) |
| B. Nutrición | Contador de macros + escáner de código de barras | A |
| C. Cálculo calórico vivo | Kcal/macros objetivo que se ajustan al peso real | A, B |
| D. Rutinas personalizadas | Recomendación inteligente de ejercicios, progresión avanzada | A |
| E. Inteligencia de fases | Coaching: fatiga, estancamiento, deload, refeed | A, B, C |

La inteligencia (C, D, E) necesita **historial acumulado** — no puede ser lo primero. El Núcleo genera ese historial y ya entrega una app de entreno superior desde el día 1. **Cada pieza se diseña, construye y prueba por separado**, y la arquitectura se monta en módulos para enchufar las siguientes sin reescribir.

---

## 3. Stack y decisiones técnicas

- **Plataforma:** Android primero (desarrollo en Windows, sin fricción). Multiplataforma para abrir iOS en el futuro sin reescribir.
- **Framework:** **React Native + Expo** (TypeScript). Pruebas en el móvil con Expo Go / development build; compilación en la nube con EAS.
- **Datos:** **Local primero** — base de datos **SQLite** en el dispositivo, vía **Drizzle ORM** (tipado, migraciones ordenadas, listo para añadir sincronización en la nube más adelante sin tirar el modelo). Funciona sin internet; los datos son del usuario.
- **Navegación:** **expo-router** con barra de pestañas inferior.
- **Gráficas:** librería sobre `react-native-svg` (p. ej. react-native-gifted-charts o victory-native — a decidir en el plan).
- **Arquitectura en módulos** con interfaces claras:
  - `data/` — esquema, acceso a BD y repositorios.
  - `training/` — lógica de rutina, recomendación de series/reps, progresión, 1RM.
  - `bodyweight/` — tendencia suavizada, objetivo y fecha estimada.
  - `education/` — glosario de términos.
  - `ui/` — pantallas y componentes.

### Escollos conocidos (anotados para fases futuras)
- iOS necesitaría Mac o EAS (cloud) + cuenta Apple 99 $/año para distribuir; no aplica ahora (Android).
- El escáner de código de barras y la integración con salud (Health Connect / HealthKit) requieren *development build*, no Expo Go puro → fase B.
- El proyecto vive hoy en `OneDrive`; conviene mover la carpeta fuera de OneDrive antes de instalar dependencias para evitar conflictos de sincronización.

---

## 4. Navegación y pantallas (visual aprobado)

Estructura elegida: **pantalla "Hoy" inteligente** (Opción A) con pestañas inferiores: **Hoy · Entreno · Progreso · Más**.

- **Hoy:** recibe con "Hoy toca: [Empuje]", accesos rápidos a entrenar y registrar peso, y un resumen del progreso reciente.
- **Entreno:** tu rutina (PPL) y sus días; al entrar en un día, registras la sesión.
- **Progreso:** gráficas por ejercicio (top set, 1RM estimado), récords (PRs) y la gráfica de peso corporal.
- **Más:** perfil, nivel, gestión de rutina/ejercicios, ajustes, glosario.
- **Peso:** accesible desde "Hoy" y desde "Más".

### 4.1 Pantalla de registro de serie (centro de la app) — *fusión tabla + foco*
- Se ve **la tabla con todas las series** del ejercicio (vista de conjunto), con **lo que se hizo la última vez** (p. ej. "82,5 kg × 8·8·7 · RIR 2") y el **objetivo recomendado según el nivel** (p. ej. "Intermedio: 3×8–10 · RIR 2–3").
- Al **tocar una serie**, sube desde abajo una **hoja de "modo foco"** con botones grandes **+/−** para ajustar peso y reps con el pulgar, selector de **RIR**, y botón **"✓ Serie hecha"** que rellena la tabla y baja la hoja.
- Las series se pueden marcar por tipo: calentamiento, *top set*, *back-off*.

### 4.2 Pantalla de peso corporal — *tendencia, objetivo, fecha dinámica*
- **Registro** con botón **＋** discreto en la cabecera (sin botón inferior).
- Gráfica: **pesajes diarios** (puntos, con su ruido) + **línea de tendencia suavizada** (lo que importa) + línea del **objetivo**.
- Número grande = **tendencia** (no el pesaje del día) + variación (p. ej. "▼ 0,5 kg / 2 sem").
- **Objetivo de peso** con **fecha estimada dinámica** que se recalcula sola según los pesos registrados (si una semana sube por una comida fuera, la fecha se ajusta).
- **Dos barras guía:** *Progreso* (% recorrido hacia el objetivo) y *Tiempo transcurrido* (% del tiempo estimado). Comparar ambas indica si se va por delante/detrás de lo previsto. **Solo orientativas, sin presión.**
- **Tarjeta educativa**: interpreta el dato del día ("hoy +0,7 kg pero la tendencia baja → agua/glucógeno, no grasa; mira la línea, no el número del día").
- **Sin IMC.**

---

## 5. Funcionalidad detallada del Núcleo

### 5.1 Perfil y nivel
Al iniciar: nivel (**Principiante / Intermedio / Avanzado**) + datos básicos (altura, sexo, fecha de nacimiento, peso actual). Estos datos no calculan IMC; sirven para contexto y para fases futuras (TDEE en fase C).

### 5.2 Recomendación de series/reps por nivel + progresión
Cada nivel define un esquema de partida por ejercicio:
- **Principiante:** 3 series · 8–12 reps · RIR 2–3
- **Intermedio:** 3–4 series · 6–12 reps · RIR 1–3
- **Avanzado:** 4–5 series · rangos según ejercicio · RIR 0–2

**Progresión (doble progresión, basada solo en el historial):** cuando el usuario alcanza el tope del rango de repeticiones con el RIR objetivo (o mejor) en todas las series de un ejercicio, la app sugiere **subir el peso** la próxima sesión y volver al extremo bajo del rango. Nada de fatiga/fases todavía (eso es fase E).

### 5.3 Biblioteca de ejercicios
- **Catálogo inicial** de ejercicios comunes, cada uno con **grupo muscular** y **patrón** (empuje / tirón / pierna / otros).
- El usuario puede **crear ejercicios propios**.

### 5.4 Rutina del usuario
- El usuario **define su split** (p. ej. PPL) y **qué ejercicios** van en cada día. Él los elige (la recomendación inteligente de ejercicios es fase D).
- La app determina **"qué toca hoy"** y lleva directo a registrar esa sesión.

### 5.5 Progreso
- Por ejercicio: evolución del **top set** y del **1RM estimado** (fórmula de Epley u similar, a fijar en el plan), **récords (PRs)** y **volumen**.
- Peso corporal: tendencia, objetivo y barras guía (ver 4.2).

### 5.6 Peso corporal y objetivo
- Registro de pesajes (idealmente a diario).
- **Tendencia suavizada** (media móvil ponderada; algoritmo concreto a fijar en el plan) para ignorar el ruido diario.
- **Objetivo de peso** + **fecha estimada dinámica** calculada a partir del ritmo de cambio de la tendencia; se recalcula con cada registro.
- Dos barras guía (progreso / tiempo) con lenguaje de ánimo.

### 5.7 Educación integrada (glosario)
Explicación a un toque, en lenguaje llano, de: RIR, RPE, top set, back-off, deload, 1RM estimado, tendencia de peso, doble progresión. Ampliable.

---

## 6. Modelo de datos (SQLite / Drizzle)

Entidades principales (campos orientativos; se afinan en el plan):

- **UserProfile**: id, nivel, sexo, fechaNacimiento, alturaCm, unidades (kg/cm).
- **Exercise**: id, nombre, grupoMuscular, patrón (empuje/tirón/pierna/otro), esEjercicioCustom.
- **Routine**: id, nombre (p. ej. "PPL").
- **RoutineDay**: id, routineId, nombre (Empuje/Tirón/Pierna), orden.
- **RoutineDayExercise**: id, routineDayId, exerciseId, orden, esquemaSeriesReps (override opcional del nivel).
- **WorkoutSession**: id, fecha, routineDayId, notas.
- **SetLog**: id, workoutSessionId, exerciseId, numeroSerie, pesoKg, reps, rir, tipoSerie (calentamiento/top/backoff/normal).
- **BodyWeightEntry**: id, fecha, pesoKg.
- **WeightGoal**: id, pesoObjetivoKg, pesoInicioKg, fechaInicio.
- **GlossaryTerm** (puede vivir como datos estáticos en código): clave, título, explicación.

Valores derivados (calculados, no almacenados salvo caché): tendencia de peso, 1RM estimado, PRs, fecha estimada al objetivo, % progreso, % tiempo.

**Sin tabla ni campo de IMC.**

---

## 7. Alcance

### ✅ Dentro de los cimientos
- Perfil + nivel.
- Biblioteca de ejercicios (catálogo inicial + custom).
- Definición de rutina (split + ejercicios por día).
- Registro de sesión: tabla de series + modo foco; peso/reps/RIR/tipo; "lo de la última vez" visible; objetivo por nivel.
- Progresión por doble progresión.
- Progreso: gráficas por ejercicio, 1RM estimado, PRs, volumen.
- Peso corporal: registro, tendencia suavizada, objetivo, fecha dinámica, dos barras guía, tarjeta educativa.
- Glosario educativo.
- Persistencia local (SQLite/Drizzle).

### ⏳ Fuera (roadmap)
- **B** Nutrición: contador de macros + escáner de código de barras (Open Food Facts como base gratuita).
- **C** Kcal vivas: TDEE (Mifflin-St Jeor) + ajuste dinámico según tendencia de peso por etapa (definición/normo/volumen); reparto de macros con prioridad a proteína.
- **D** Rutinas: recomendación inteligente de ejercicios según días de entreno, etc.
- **E** Inteligencia de fases: fatiga acumulada, estancamiento, deload, refeed/diet break, autorregulación.
- Sincronización en la nube y multi-usuario (cuando se plantee salir al mercado).
- iOS / TestFlight / App Store.

---

## 8. Enfoque de pruebas

- **Lógica pura testeable** (TDD): recomendación de series/reps y progresión, cálculo de 1RM, suavizado de tendencia de peso, estimación de fecha al objetivo y cálculo de las dos barras. Son funciones deterministas → tests unitarios.
- **Capa de datos**: tests de repositorios contra SQLite en memoria.
- **UI**: validación manual en dispositivo (Expo) en esta fase; componentes críticos con tests si aportan.

---

## 9. Cuestiones abiertas (para el plan o fases futuras)
- Fórmula exacta de 1RM estimado y de suavizado de tendencia (proponer en el plan).
- Confirmar con el autor que la **metodología de kcal** (sección roadmap C) coincide con su método antes de construir la fase C.
- Mover el proyecto fuera de OneDrive antes de instalar dependencias.
- Unidades: arrancamos en kg/cm (configurable a futuro).
