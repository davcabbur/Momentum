# Momentum

App móvil de gimnasio: **un entrenador que entiende y educa**, no un registro tonto de datos.
Te dice qué hacer, por qué, y enmarca tu progreso sin generar ansiedad.

> Estado: en desarrollo activo, de momento para uso personal del autor. Multiplataforma (Android primero).

## Filosofía de producto

- **Nunca usa el IMC.** No distingue músculo de grasa.
- **Nada genera ansiedad.** Fechas y barras orientan, no presionan; tono educativo y tranquilizador.
- **Manda la tendencia de peso suavizada, no el pesaje del día.** Las subidas puntuales se enmarcan como agua/glucógeno, no grasa.
- **Lenguaje de entrenador** (RIR, top set, back-off, deload, 1RM…) siempre con explicación a un toque (glosario).
- **Lo fundamental, gratis y sin anuncios.**
- **Funciona sin conexión**: todo es local. Solo el escáner y la búsqueda de alimentos usan internet.

## Funcionalidades

### 🏋️ Entreno
- Rutinas a partir de plantillas según tus días/semana (PPL, Torso/Pierna, PPL + Torso/Pierna, Full Body, Músculo por día…), con los mejores ejercicios por día.
- Días de pierna complementarios (cuádriceps / femoral-glúteo) y volumen semanal equilibrado por músculo.
- Editor de rutina (añadir/quitar ejercicios, reordenar) con avisos de **volumen basura** y de solapamiento.
- Registro de series con **doble progresión**, tipo de serie automático (top set / back-off), RIR por nivel, **1RM estimado**, técnica del ejercicio y **mapa muscular**.
- **Cronómetro de descanso** que sigue contando con el móvil bloqueado y **avisa con una notificación** al terminar.

### 📈 Progreso
- Pestañas **Fuerza** y **Peso corporal**.
- Fuerza: 1RM actual, PR y volumen por ejercicio, con la diferencia respecto a la sesión anterior (colapsable).
- Peso: gráfica de tendencia e historial de pesajes.
- Historial de sesiones.

### ⚖️ Peso corporal
- **Tendencia suavizada** (media exponencial), objetivo y **fecha estimada dinámica**.
- Anillo de progreso (inicio / actual / objetivo) y ritmo medio diario y semanal.

### 🥗 Nutrición / Kcal
- **Mantenimiento** (TDEE, Mifflin-St Jeor) y **objetivo del día** ajustado dinámicamente según tu tendencia y etapa.
- **Gasto real estimado** a partir de lo que comes frente a cómo cambia tu peso.
- Proteína y macros, registro de comidas y **escáner de código de barras** + búsqueda (Open Food Facts, con caché local).

### 🧠 Inteligencia
- Detección de estancamiento y propuesta de **deload**, mensaje de bienvenida tras un parón y aviso de **diet break**.

### Otros
- Navegación por pestañas: **Inicio · Entreno · Progreso · Nutrición** (+ Ajustes).
- **Desliza para actualizar** en todas las pantallas.
- Recordatorio diario local y **glosario** educativo.

## Stack

- **React Native + Expo** (SDK 54), **TypeScript** estricto, **expo-router** (tabs).
- **Datos locales**: SQLite con **Drizzle ORM** (preparado para sincronización en la nube a futuro).
- Gráficas con **react-native-svg**; mapa muscular con **react-native-body-highlighter**.
- Notificaciones locales (**expo-notifications**), cámara/escáner (**expo-camera**).
- Tests con **Jest** (jest-expo).

## Arquitectura

Módulos con interfaces claras, lógica de negocio en funciones puras separadas de la UI:

- `src/db/` — esquema, acceso a SQLite y repositorios.
- `src/training/` — rutinas, recomendación de series/reps, doble progresión, 1RM, volumen.
- `src/bodyweight/` — tendencia suavizada, objetivo y fecha estimada.
- `src/nutrition/` — TDEE, kcal vivas, macros, Open Food Facts.
- `src/education/` — glosario de términos.
- `src/ui/` y `src/app/` — pantallas y componentes.

## Desarrollo

```bash
npm install
npx expo start            # desarrollo (Expo Go o development build)
npx expo start --android  # arrancar directo en Android
npm test                  # tests (Jest)
npx tsc --noEmit          # verificar TypeScript
```

- **TDD para la lógica pura** (recomendación de series/reps, doble progresión, 1RM, suavizado de tendencia, kcal…): tests antes que implementación.

## Generar una APK (pruebas)

Builds en la nube con **EAS**:

```bash
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview   # genera un APK instalable
```

El perfil `preview` produce un APK con enlace/QR de distribución interna para compartir con quien la pruebe. El perfil `production` genera un AAB para Google Play.

## Roadmap

- **B** Nutrición avanzada: más macros y mejoras del escáner.
- **C** Kcal vivas: refinar el ajuste dinámico por tendencia y etapa.
- **D** Rutinas: recomendación inteligente de ejercicios.
- **E** Inteligencia de fases: fatiga, estancamiento, deload, refeed/diet break.
