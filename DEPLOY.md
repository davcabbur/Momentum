# Desplegar Momentum como PWA (Cloudflare Workers)

Momentum se publica como aplicación web instalable, para poder usarla en el iPhone sin
pasar por la App Store. Todo el despliegue lo hace GitHub Actions: **desde el móvil no
hace falta más que fusionar un pull request**.

Esto **no sustituye a la app de Android** (Expo/EAS). Es el mismo código: la versión web
sale del mismo `src/`, así que lo que se arregla en una se arregla en las dos.

---

## Puesta en marcha (una sola vez)

### 1. El secreto del repositorio

En **Settings → Secrets and variables → Actions → New repository secret** (pestaña
**Secrets**; la de *Variables* no vale, y el nombre distingue mayúsculas):

| Secreto | De dónde sale |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Cloudflare → **My Profile → API Tokens → Create Token → Create Custom Token**. Permiso: **Account · Workers Scripts · Edit**. Nada más: no hay base de datos ni KV que tocar. |

Con eso basta. **`CLOUDFLARE_ACCOUNT_ID` es opcional**: wrangler deduce la cuenta del
propio token. Solo hay que crearlo si el token da acceso a más de una cuenta, porque
entonces wrangler no puede elegir — y en ese caso el despliegue falla diciéndolo con esas
palabras. El valor está en Cloudflare → **Workers & Pages**, columna derecha, *Account ID*.

No hay `APP_PASSWORD` ni `SESSION_SECRET`: aquí no hay backend propio. La cuenta sigue
siendo de Supabase y los datos viven en el dispositivo, así que no hay ningún estado en
Cloudflare que un despliegue pueda pisar. Volver a publicar nunca cierra la sesión.

### 2. Registrar el subdominio `workers.dev`

Se elige **una vez y a mano** en el panel de Cloudflare; el nombre es cosa tuya:

    https://dash.cloudflare.com/  →  Workers & Pages  →  (te lo pide al entrar)

Si te lo saltas, el primer despliegue falla con un error que no dice claramente que
falte esto. El script lo detecta y te enlaza la página exacta, pero es más cómodo
hacerlo antes.

### 3. Dar de alta la URL en Supabase

Necesario solo para el botón de **Google**; con correo y contraseña funciona sin tocar
nada. En el panel de Supabase → **Authentication → URL Configuration → Redirect URLs**,
añade la URL de la app:

    https://momentum.<tu-subdominio>.workers.dev

(La URL exacta la deja el propio despliegue en el resumen del run; ver más abajo.)

En Google Cloud no hay que cambiar nada: Google sigue redirigiendo a Supabase, y es
Supabase quien devuelve el control a la app.

### 4. No conectar el repositorio a Cloudflare

En el panel de Cloudflare, **no** conectes este repositorio con *Workers Builds*. Si lo
conectas, Cloudflare intenta desplegar por su cuenta en paralelo a este workflow y los
dos se pisan. El despliegue de verdad es `.github/workflows/deploy.yml`.

---

## El día a día

- Cada **push a `main`** publica la app (workflow **Deploy**).
- También se puede lanzar a mano: **Actions → Deploy → Run workflow**. Esto se hace
  cómodamente desde la app de GitHub en el móvil.
- Antes de publicar, el workflow pasa los tests y comprueba los tipos. Si algo falla, no
  se despliega.
- Cuando termina, el **resumen del run** muestra la URL de la app. Es lo único que hace
  falta mirar desde el móvil.

En los pull requests corre el workflow **CI**, que además compila la web. Eso es a
propósito: los fallos que solo se ven fuera de nativo (un módulo sin versión web, el
`.wasm` de expo-sqlite sin resolver) aparecen en el PR y no en el despliegue.

## Instalarla en el iPhone

1. Abre la URL en **Safari** (tiene que ser Safari; desde Chrome no se puede instalar).
2. **Compartir → Añadir a pantalla de inicio**.
3. Ábrela desde el icono: se abre a pantalla completa, sin barra de direcciones.
4. Entra con tu cuenta. Los datos se sincronizan con Supabase igual que en Android, así
   que en el iPhone aparece tu historial tal cual.

Hace falta **iOS 17 o posterior**. El motivo está más abajo.

---

## Qué hay montado, y por qué así

### Por qué Cloudflare Workers y no un hosting estático cualquiera

Porque hay que controlar las cabeceras HTTP. En web, `expo-sqlite` ejecuta SQLite
(wa-sqlite, compilado a WebAssembly) dentro de un Web Worker, y habla con el hilo
principal a través de `SharedArrayBuffer`. El navegador solo da `SharedArrayBuffer` si la
página está *cross-origin isolated*, y para eso exige dos cabeceras en cada respuesta:

    Cross-Origin-Opener-Policy:   same-origin
    Cross-Origin-Embedder-Policy: require-corp

Sin ellas la app no arranca: no puede abrir la base de datos. Eso es todo lo que hace
`worker/index.ts` — no hay backend. La base de datos sigue siendo local (ahora en OPFS,
el almacenamiento de ficheros del navegador) y la sincronización sigue siendo la de
Supabase, la misma que en Android.

Se usa `require-corp` y no `credentialless` porque Safari no soporta `credentialless`, y
el objetivo es el iPhone. Se puede: la app no incrusta ningún recurso de otro origen
(JavaScript, fuentes, iconos y el `.wasm` salen todos de aquí). Las llamadas a Supabase y
a Open Food Facts son `fetch` con CORS, y a eso COEP no le afecta.

Detalle fácil de pasar por alto: en `wrangler.jsonc` está `assets.run_worker_first: true`.
Sin eso, Cloudflare sirve los ficheros estáticos antes de llegar al Worker y se quedarían
sin esas cabeceras — es decir, sin base de datos.

### iOS 17

`SharedArrayBuffer` funciona en Safari desde 15.2, pero el acceso síncrono a ficheros de
OPFS (`FileSystemSyncAccessHandle`), que es lo que usa wa-sqlite, no se comportó de forma
síncrona de verdad hasta Safari 17. Cualquier iPhone 15 sale ya con iOS 17, así que en la
práctica no es una limitación.

### Qué no hace la versión web

- **Recordatorios y avisos de fin de descanso.** El navegador no puede programar una
  notificación para más tarde: la API que lo permitiría nunca llegó, y el push de una PWA
  en iOS necesita un servidor de push que Momentum no tiene. La cuenta atrás del descanso
  sigue funcionando dentro de la app; lo que no llega es el aviso con la app cerrada. Ver
  `src/lib/notifications.web.ts`.
- **Escáner de código de barras en Safari.** Safari no trae `BarcodeDetector`. La app lo
  detecta y manda a buscar el alimento por su nombre, que funciona igual. En Chrome de
  Android sí escanea.
- **Copia de seguridad**: sí funciona, con el mecanismo del navegador — descarga el
  fichero y lo lee del selector de archivos. En el iPhone acaba en Archivos y se puede
  restaurar desde iCloud Drive. Ver `src/lib/backup-file.web.ts`.

### Arranque de la base de datos en web

En web la base de datos se abre de forma **asíncrona** (`initDb()` en
`src/db/client.web.ts`, que `src/app/_layout.tsx` espera antes de migrar). No es un
capricho: las operaciones síncronas —las únicas que usa el driver de Drizzle— esperan al
worker bloqueando el hilo principal un número máximo de vueltas, y la primera llamada
tendría que esperar además a que se descargue el worker, compile el `.wasm` y monte el
VFS. No cabe, y `openDatabaseSync` revienta con *"Sync operation timeout"*. Abriéndola
antes en asíncrono, el worker ya está caliente y el resto va sobrado.

En nativo no cambia nada: `initDb()` es un no-op.

### Detalles del iPhone que están resueltos en `public/index.html`

- `100dvh` **solo** en `html`/`body`, nunca en `#root`: puesto en `#root`, Safari lo
  recalcula al aparecer y desaparecer la barra de herramientas y la app entera salta en
  cada scroll.
- Campos de texto a **16 px** como mínimo: por debajo de eso Safari hace zoom al enfocar
  y luego no lo deshace.
- Objetivos táctiles de **44 px** mínimo, y `env(safe-area-inset-*)` en el `body` (con
  `viewport-fit=cover` en el viewport, sin el cual esos valores son siempre 0).

### La cáscara HTML sale de `public/index.html`

Con `web.output: "single"`, Expo usa `public/index.html` como plantilla y **`+html.tsx`
no se aplica** (eso es solo para `output: "static"`, que aquí no vale: el prerender corre
en Node, sin `window`, y Supabase falla al importarse).

Ojo con una trampa: Expo rellena los marcadores `%…%` de esa plantilla con
`String.replace` sin flag global, o sea que sustituye **solo la primera aparición** de
cada uno. Mencionarlos en un comentario los gasta ahí y el `<html>` y el `<title>` se
quedan con el texto crudo a la vista. `scripts/ci-deploy.mjs` comprueba que no quede
ningún marcador sin rellenar y rompe el despliegue si lo hay.

---

## Probarlo en local

    npm run build:web        # genera dist/
    npx wrangler dev         # sirve dist/ con las cabeceras de verdad

También sirve `npx expo start --web`, que pone esas mismas cabeceras a través de
`metro.config.js`.

Para replicar el despliegue completo sin desplegar, `node scripts/ci-deploy.mjs` con
`CLOUDFLARE_API_TOKEN` en el entorno.
