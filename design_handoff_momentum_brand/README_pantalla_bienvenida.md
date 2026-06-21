# Handoff: Pantalla de Bienvenida (Splash → Login) — Momentum

## Overview
Pantalla de arranque de la app: un **splash animado** con el logo (icono A), el nombre y una frase, que tras la animación **da paso automáticamente a la pantalla de login**. Tema oscuro, usando los tokens de marca Momentum (ver `README.md`).

## About the Design Files
`Momentum Bienvenida.dc.html` es una **referencia de diseño en HTML** (prototipo del aspecto y la animación), **no código de producción**. Recréala en el entorno destino (React Native, Flutter, SwiftUI, Jetpack Compose…) con los patrones y librerías ya existentes. Si no hay entorno, elige el framework adecuado e impleméntala allí.

- `Momentum Bienvenida.dc.html` — prototipo completo (splash + transición + login + botón de replay).
- `screenshots/welcome-splash.png` — estado splash.
- `screenshots/welcome-login.png` — estado login.

> Nota: el marco de teléfono y el botón "↺ Reproducir intro" son **solo del prototipo** — no forman parte de la app.

## Fidelity
**Alta fidelidad.** Colores, tipografía, tiempos de animación y layout son finales.

---

## Estructura de la pantalla

Una sola pantalla con **dos fases** controladas por estado (`phase: 'splash' | 'login'`):

1. **Splash** (overlay a pantalla completa, `z-index` por encima del login).
2. **Login** (debajo; visible tras el fade-out del splash).

### Fondos
- Splash: degradado vertical `#12131A → #0E0F13 → #0A0B0F`.
- Login: `#0E0F13` (token `bg` oscuro).

---

## Animación del splash (timeline)

Origen de tiempos = montaje de la pantalla (t=0).

| t (ms) | Elemento | Animación |
|---|---|---|
| 0 → 700 | Tile del logo (108×108, radio 26, degradado `#1A1C26→#0C0D12`) | sube + fade (`translateY(18→0)`, opacidad 0→1), easing `cubic-bezier(.2,.8,.2,1)` |
| 250 → 1100 | Chevron superior | trazo dibujándose (stroke-dashoffset 760→0), `cubic-bezier(.4,0,.2,1)` |
| 500 → 1350 | Chevron inferior (opacidad final 0.45) | mismo trazo, con retardo |
| 900 → 1500 | Wordmark "Momentum" (Space Grotesk 700, 38px, `#F3F5F9`) | fade-up |
| 1100 → 1700 | Frase "Cada paso, hacia arriba." (Manrope 500, 15px, `#969CAB`) | fade-up |
| continuo | Halo radial violeta detrás del logo (`rgba(99,83,239,.42)`) | pulso suave (scale 1↔1.12, 3.4s loop) |
| 300 → 2400 | Barra de progreso inferior (108×3, `#8E80FF→#6353EF`) | `scaleX(0→1)` |
| 2600 → 3150 | Todo el splash | fade-out + `scale(1→1.04)`, 500ms |
| 3150 | — | swap a fase **login** (login entra con fade-up de 500ms) |

**Detalle del trazo (icono A):** dos polilíneas, `stroke-width:104`, `linecap/linejoin: round`, sobre viewBox 1024:
- Superior: `300,520 → 512,360 → 724,520` (opacidad 1).
- Inferior: `300,700 → 512,540 → 724,700` (opacidad 0.45).
- Trazo en degradado `#8E80FF → #5B49E8`.

> Implementación nativa: usa el SVG/vector del foreground del icono y anima el "draw" con stroke-dashoffset (Lottie o animación de path). Si el motor no soporta dash-draw fácilmente, sustituye por un fade+rise del símbolo completo — mantén los mismos tiempos.

### Texto del splash
- Nombre: **Momentum**
- Frase / tagline: **"Cada paso, hacia arriba."**

---

## Transición
- A los **2600 ms** empieza el fade-out del splash (opacidad→0, `scale→1.04`, 500ms).
- A los **3150 ms** se desmonta el splash y se muestra el login (fade-up 500ms).
- Total intro ≈ **3.2 s**. Permite **saltar** la intro con tap (recomendado) y respeta `prefers-reduced-motion`: si está activo, omite el dibujo de trazos y muestra el login tras un fade simple (~600ms).

---

## Pantalla de Login (especificación)

Padding lateral 28px. Tokens del tema oscuro (`README.md`).

- **Header:** logo 46×46 (radio 13, mismo tile) + "Momentum" (Space Grotesk 600, 20px, `#F3F5F9`).
- **Título:** "Bienvenido de vuelta" (Space Grotesk 600, 30px, `#F3F5F9`).
- **Subtítulo:** "Retoma tu progreso donde lo dejaste. Tu entrenador te espera." (15px, `#969CAB`).
- **Campos** (Correo, Contraseña): alto 52, fondo `#181A20`, borde `#2A2D37` (focus → `#6353EF`), radio 14, texto `#F3F5F9`, placeholder `#5B616E`. Label 13px/600 `#969CAB`.
- **Enlace** "¿Olvidaste tu contraseña?": 13px/600 `#8E80FF`.
- **Botón primario "Entrar":** alto 54, fondo `#6353EF` (hover/press → `#4B39D6`), texto `#FFFFFF` 16px/700, radio 14, sombra `0 14px 30px -12px rgba(99,83,239,.7)`.
- **Divisor** "o continúa con" + dos botones secundarios (Google, Apple): alto 50, fondo `#181A20`, borde `#2A2D37`, texto `#F3F5F9` 14px/600.
- **Footer:** "¿Aún no tienes cuenta? **Crear cuenta**" (enlace `#8E80FF`).

> En **tema claro** intercambia por los tokens claros del `README.md` (bg `#F6F7F9`, surface `#FFFFFF`, border `#E6E8EF`, text `#14161C`, textMuted `#5B616E`, acento `#6353EF`/`#4B39D6`). El splash puede mantenerse oscuro en ambos temas (splash de marca) o seguir el tema del sistema.

---

## Pseudo-lógica de fases
```
onMount():
  if reducedMotion: setTimeout(() => phase = 'login', 600)
  else:
    setTimeout(() => fading = true, 2600)
    setTimeout(() => phase = 'login', 3150)
onTap(splash): phase = 'login'   // saltar intro
```

## Files
- `Momentum Bienvenida.dc.html` — prototipo de referencia (abrir en navegador).
- `screenshots/welcome-splash.png`, `screenshots/welcome-login.png`.
- Tokens, tipografía e icono: ver `README.md` en este mismo paquete.
