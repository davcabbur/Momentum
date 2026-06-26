# Momentum

App móvil de gimnasio: "un entrenador que entiende y educa", no un registro tonto de datos.
Primer y único usuario por ahora es el autor; posible salida a mercado más adelante.

## Estado actual

- Scaffolding Expo completado (SDK 54, expo-router con tabs, TypeScript estricto). App compila con `npx tsc --noEmit`.
- Subproyecto en curso: **A — Núcleo de seguimiento** (entreno + peso corporal). Diseño aprobado.
- Diseño completo: `docs/superpowers/specs/2026-06-12-nucleo-seguimiento-design.md` (léelo antes de tocar el Núcleo; no lo importes aquí para no inflar el contexto).

## Stack

- **React Native + Expo** (TypeScript). **Android primero**; multiplataforma para abrir iOS sin reescribir.
- **Datos locales**: SQLite con **Drizzle ORM** (preparado para sincronización en la nube a futuro).
- **Navegación**: expo-router, pestañas inferiores: **Hoy · Entreno · Progreso · Más**.
- **Gráficas**: librería sobre `react-native-svg`.
- Pruebas en dispositivo con Expo Go / development build; builds en la nube con EAS.

## Backend e infraestructura (sin secretos)

- **Supabase** (proyecto `xjnhhcynawlfebzqdaet`). Auth (correo+contraseña y Google) y almacenamiento.
  - Cliente en `src/lib/supabase.ts`. La **anon key es pública y segura** (la protege RLS); **la `service_role` NUNCA va en la app**.
  - Sincronización por *snapshot*: la BD local se sube/baja entera como JSON a la tabla `user_snapshot` (una fila por usuario, RLS propia). Ver `src/db/cloud-sync.ts` y `src/db/use-reconcile.ts` (reconcilia solo en `SIGNED_IN`).
  - **Edge Function `delete-account`** (`supabase/functions/delete-account/`): borra al usuario de Auth + su `user_snapshot` con la `service_role` del servidor. Verify JWT activado. Desplegada desde el dashboard; re-desplegar con `supabase functions deploy delete-account` (requiere `supabase link`). Código Deno: excluido del `tsc` de la app vía `tsconfig.json`.
- **Login obligatorio.** Google OAuth en **producción**: cualquier cuenta de Google puede entrar (ya no hay límite de usuarios de prueba). Scopes básicos (email+perfil), sin verificación de Google; puede salir un aviso de "app no verificada", es normal.
- **Política de privacidad**: `docs/privacy.html`, servida por **GitHub Pages** (rama `main`, carpeta `/docs`) en `https://davcabbur.github.io/Momentum/privacy.html`. El repo es **público** (requisito de Pages gratis). La app enlaza esa URL (`PRIVACY_URL` en `AjustesScreen`); cambios se publican solos al hacer push a `main`.
- **Salida a Play Store** en preparación: ver memoria `play-store-launch` para el estado y los pendientes externos (desplegar función, OAuth, closed testing, Data Safety).

## Reglas de producto (innegociables)

- **Nunca usar ni mostrar el IMC** en ningún sitio. No distingue músculo de grasa.
- **Nada debe generar ansiedad.** Fechas y barras de progreso orientan, no presionan; tono educativo y tranquilizador.
- **Peso corporal: manda la tendencia suavizada, no el pesaje del día.** Enmarcar subidas puntuales como agua/glucógeno/músculo, no grasa.
- **Lenguaje de entrenador** (RIR, RPE, top set, back-off, deload, 1RM…) siempre acompañado de explicación a un toque (glosario).
- **Lo fundamental, gratis y sin anuncios.**

## Arquitectura (módulos con interfaces claras)

- `data/` — esquema, acceso a SQLite y repositorios.
- `training/` — rutina, recomendación de series/reps por nivel, doble progresión, 1RM.
- `bodyweight/` — tendencia suavizada, objetivo y fecha estimada dinámica.
- `education/` — glosario de términos.
- `ui/` — pantallas y componentes.

Mantener cada módulo enfocado y testeable por separado, para enchufar las fases B–E sin reescribir.

## Convenciones de código

- TypeScript en modo estricto. Indentación de 2 espacios.
- Componentes React en PascalCase; hooks en `useX`; ficheros de componente `.tsx`.
- Lógica de negocio en funciones puras (separada de la UI) para poder testearla.
- Sin código muerto ni IMC: si aparece algún cálculo de IMC, eliminarlo.
- **Colores siempre vía el tema, nunca hex hardcodeados.** Soporta claro/oscuro: en cada componente usar `const { c } = useTheme()` y `const styles = useThemedStyles(makeStyles)` (con `makeStyles = (c: Theme) => StyleSheet.create({...})`), y referenciar los tokens (`c.surface`, `c.text`, `c.accent`, `c.good`, `c.bad`, etc.). La paleta vive en `src/constants/theme.ts` (temas `light`/`dark`); el provider/hook en `src/ui/theme.tsx`. Si hace falta un color nuevo, añadir un token al tema, no un literal.

## Flujo de trabajo

- **Responder siempre en español.**
- Trabajo por subproyectos: spec aprobado → plan de implementación → construir. No saltarse el spec.
- **TDD para la lógica pura**: recomendación de series/reps, doble progresión, 1RM, suavizado de tendencia, fecha estimada y barras guía. Tests antes que implementación.
- Shell del entorno: **PowerShell en Windows** (usar sintaxis PowerShell, no bash, salvo scripts POSIX).
- El proyecto vive en **OneDrive** (decisión del usuario); riesgo de sync con `node_modules` aceptado por ahora. Revisar/mover si da problemas.
- **Al terminar de implementar un spec o un plan, borrar su archivo** en `docs/superpowers/`. El usuario no quiere archivos de diseño/plan ya implementados acumulándose ("archivos basura"). Lo importante perdura en el código, en este `CLAUDE.md` y en la memoria.
- Commitear o hacer push **solo cuando el usuario lo pida**.

## Comandos

- `npx expo start` — arrancar en desarrollo (escanear QR con Expo Go o build de desarrollo).
- `npx expo start --android` — arrancar directo en Android.
- `npm test` — ejecutar tests (Jest, cuando se configure en A2).
- `npx tsc --noEmit` — verificar TypeScript sin emitir archivos.
- `npx drizzle-kit generate` — generar migraciones de la BD (cuando se añada Drizzle).

## Roadmap (fuera del Núcleo, no construir aún)

- **B** Nutrición: macros + escáner de código de barras (Open Food Facts).
- **C** Kcal vivas: TDEE (Mifflin-St Jeor) + ajuste dinámico por tendencia de peso y etapa.
- **D** Rutinas: recomendación inteligente de ejercicios.
- **E** Inteligencia de fases: fatiga, estancamiento, deload, refeed/diet break.
