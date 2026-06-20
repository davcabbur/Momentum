# Handoff: Momentum — Identidad visual (paleta + icono de app)

## Overview
Momentum es una app móvil de gimnasio que actúa como **entrenador que enseña y motiva** (no un simple registro de datos). Tono: cercano, fiable, educativo y tranquilo; el progreso orienta, nunca presiona. Idea central: **impulso / progreso ascendente**.

Este paquete contiene la identidad visual aprobada: la **paleta completa** (tema claro y oscuro) y el **icono de la app** elegido (Variación A — doble chevron ascendente), incluyendo sus capas para icono adaptativo de Android.

## About the Design Files
Los archivos de este bundle son **referencias de diseño creadas en HTML** — prototipos que muestran el aspecto y el comportamiento previstos, **no código de producción para copiar tal cual**. La tarea es **recrear estos diseños en el entorno del codebase destino** (React Native, Flutter, SwiftUI, Jetpack Compose, etc.) usando sus patrones y librerías ya establecidos. Si aún no existe entorno, elige el framework más adecuado para el proyecto e implementa allí.

- `Momentum Brand Identity.dc.html` — board de marca completo (paleta claro/oscuro, las 3 variaciones de icono, tabla resumen y razonamiento). Referencia visual maestra.
- `icon/` — el icono elegido (Variación A) en PNG y SVG 1024×1024, más capas adaptativas de Android.

## Fidelity
**Alta fidelidad (hifi).** Colores, tipografía y geometría del icono son finales. Reprodúcelos con exactitud usando las librerías/patrones del codebase.

---

## Design Tokens — Paleta

El acento es un **violeta-índigo**: motiva con calma (energía y enfoque sin la urgencia del rojo/naranja) y es el único color que se mantiene legible y vibrante sobre fondos claros y oscuros, por lo que es **el color de marca en ambos temas**. Verde/azul/ámbar/rojo se reservan **solo para significado** (progreso, info, aviso, error), nunca para la marca.

| Rol | Token sugerido | Claro | Oscuro |
|---|---|---|---|
| Acento principal | `accent` | `#6353EF` | `#8E80FF` |
| Acento fuerte (botón/enlace) | `accentStrong` | `#4B39D6` | `#6353EF` |
| Tinte de acento (chips/iconos) | `accentTint` | `#ECEAFE` | `#221F3D` |
| Fondo de pantalla | `bg` | `#F6F7F9` | `#0E0F13` |
| Fondo de tarjeta | `surface` | `#FFFFFF` | `#181A20` |
| Borde de tarjeta | `border` | `#E6E8EF` | `#2A2D37` |
| Texto principal | `text` | `#14161C` | `#F3F5F9` |
| Texto secundario | `textMuted` | `#5B616E` | `#969CAB` |
| Éxito / progreso | `success` | `#1E9E57` | `#36D17E` |
| Informativo | `info` | `#2563EB` | `#5B9BFF` |
| Aviso | `warning` | `#C2710C` | `#F2B34F` |
| Error | `error` | `#DC2626` | `#F87171` |
| Texto sobre acento | `onAccent` | `#FFFFFF` | `#FFFFFF` |

### Notas de uso
- **Botones primarios:** fondo `accentStrong`, texto `onAccent` (#FFFFFF) en ambos temas.
- **Enlaces / texto de acento:** usar `accent` (en oscuro #8E80FF para conservar contraste).
- **Chips e iconos suaves:** fondo `accentTint`, símbolo/etiqueta en `accent`/`accentStrong`.
- **Estados semánticos:** texto/icono en el color semántico; para fondos de aviso usar el color al ~12% de opacidad sobre `surface`.
- En **oscuro** el acento se aclara a `#8E80FF` (no usar #6353EF como texto sobre superficies oscuras: baja contraste).

### Contraste (WCAG)
- Texto principal vs fondo ≥ 12:1 en ambos temas (AAA).
- Texto secundario ≥ 4.5:1 (AA texto normal).
- Botón de acento (texto blanco sobre `accentStrong`) ≥ 4.5:1 en ambos temas.
- Color semántico como texto: usar las variantes de la tabla (las del tema oscuro están aclaradas para pasar AA sobre `#181A20`).

### Ejemplo de tokens (adáptalo al sistema del codebase)
```json
{
  "light": {
    "accent": "#6353EF", "accentStrong": "#4B39D6", "accentTint": "#ECEAFE",
    "bg": "#F6F7F9", "surface": "#FFFFFF", "border": "#E6E8EF",
    "text": "#14161C", "textMuted": "#5B616E", "onAccent": "#FFFFFF",
    "success": "#1E9E57", "info": "#2563EB", "warning": "#C2710C", "error": "#DC2626"
  },
  "dark": {
    "accent": "#8E80FF", "accentStrong": "#6353EF", "accentTint": "#221F3D",
    "bg": "#0E0F13", "surface": "#181A20", "border": "#2A2D37",
    "text": "#F3F5F9", "textMuted": "#969CAB", "onAccent": "#FFFFFF",
    "success": "#36D17E", "info": "#5B9BFF", "warning": "#F2B34F", "error": "#F87171"
  }
}
```

---

## Design Tokens — Tipografía
- **Display / títulos:** `Space Grotesk` (geométrica, moderna). Pesos 500–700, `letter-spacing: -0.01em` a `-0.02em` en tamaños grandes.
- **Texto / UI:** `Manrope`. Pesos 400–800.
- Ambas en Google Fonts. Si el codebase ya tiene una fuente de sistema equivalente (p. ej. SF Pro / Roboto), respeta su jerarquía pero conserva la sensación geométrica en los títulos.

---

## Asset — Icono de la app (Variación A: doble chevron ascendente)

**Concepto:** dos galones ascendentes = avance y ritmo; el galón inferior, más tenue (45% opacidad), sugiere movimiento/estela. Inicial visual de "impulso".

**Fondo recomendado:** tinta en degradado `#1A1C26 → #0C0D12` (diagonal, esquina sup-izq → inf-der). Símbolo en degradado de acento `#8E80FF → #5B49E8` (misma diagonal).

### Especificación geométrica (lienzo 1024×1024, a sangre completa)
- Trazo: `stroke-width: 104`, `linecap: round`, `linejoin: round`, sin relleno.
- Chevron superior (100% opacidad): polyline `300,520 → 512,360 → 724,520`.
- Chevron inferior (45% opacidad): polyline `300,700 → 512,540 → 724,700`.
- El símbolo ocupa el centro (~51% de ancho, ~43% de alto): seguro frente a las máscaras circular y squircle de Android (zona segura del 66% central).
- Esquinas del tile (versión estática iOS / preview): radio ≈ 20% del lado.

### Archivos del icono
- `icon/momentum-icon-A-1024.png` — icono completo 1024×1024 (fondo + símbolo), listo para iOS / Play Store / preview.
- `icon/momentum-icon-A-1024.svg` — vectorial editable equivalente.
- `icon/adaptive/ic_launcher_background-1024.png` (+ `.svg`) — **capa de fondo** Android adaptive (degradado de tinta, a sangre).
- `icon/adaptive/ic_launcher_foreground-1024.png` (+ `.svg`) — **capa frontal** Android adaptive (chevrons, fondo transparente, dentro de la zona segura).

### Implementación Android (adaptive icon)
1. Genera densidades desde los 1024 (mdpi→xxxhdpi) o usa Image Asset Studio de Android Studio con las dos capas.
2. `res/mipmap-anydpi-v26/ic_launcher.xml`:
   ```xml
   <adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
     <background android:drawable="@drawable/ic_launcher_background"/>
     <foreground android:drawable="@drawable/ic_launcher_foreground"/>
   </adaptive-icon>
   ```
3. Verifica a 48×48 dp: el doble chevron debe seguir nítido (lo está; nada recargado).

### iOS
Usa `icon/momentum-icon-A-1024.png` como App Icon 1024 (sin transparencia, esquinas las aplica el sistema).

---

## Cómo aplicarlo "a todo"
1. Carga los tokens (claro/oscuro) en el sistema de temas del codebase y conéctalos al modo del sistema operativo.
2. Sustituye los colores hardcodeados por los tokens semánticos (`accent`, `surface`, `text`, etc.).
3. Aplica la tipografía (Space Grotesk títulos / Manrope texto).
4. Reemplaza el icono de la app con los archivos de `icon/` (adaptive en Android, 1024 en iOS).
5. Revisa estados (botones, chips, alertas) contra la sección "Notas de uso" para no usar colores semánticos como marca.

### Densidades Android ya generadas
`icon/android/` trae la estructura `res/` lista para copiar:
- `mipmap-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}/ic_launcher_foreground.png` y `ic_launcher_background.png` (capas adaptativas, grid 108dp: 108/162/216/324/432 px).
- `mipmap-{…}/ic_launcher.png` (icono cuadrado legado, grid 48dp: 48/72/96/144/192 px).
- `mipmap-anydpi-v26/ic_launcher.xml` y `ic_launcher_round.xml` (referencian las dos capas).

Copia `icon/android/mipmap-*` dentro de `app/src/main/res/` y listo.

## Files
- `Momentum Brand Identity.dc.html` — board de marca (referencia visual maestra).
- `screenshots/0X-board.png` — capturas del board (paleta, iconos, tabla).
- `icon/momentum-icon-A-1024.png` / `.svg` — icono elegido.
- `icon/adaptive/ic_launcher_foreground-1024.*` y `ic_launcher_background-1024.*` — capas Android a 1024.
- `icon/android/mipmap-*` — densidades rasterizadas + XML adaptive, estructura `res/`.
