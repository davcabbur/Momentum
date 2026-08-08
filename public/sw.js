/**
 * Service worker de Momentum.
 *
 * Lo que tiene que conseguir, por orden de importancia:
 *   1. Que la app SIEMPRE abra. Nunca una pantalla en blanco.
 *   2. Que un despliegue nuevo se vea sin tener que hacer nada raro.
 *   3. Que abra sin cobertura, que es lo normal en el gimnasio.
 *
 * El orden importa, y la primera versión de esto lo tenía mal. Metro pone el hash del
 * contenido en el nombre de cada fichero, así que al desplegar aparecen nombres nuevos y
 * los viejos DESAPARECEN del servidor. Si quedaba guardada una cáscara antigua, pedía su
 * bundle de siempre, el servidor contestaba 404 — y aquel código devolvía ese 404 a la
 * página en vez de usar la copia que tenía guardada al lado. Resultado: pantalla en
 * blanco justo después de cada despliegue, con el fichero bueno en la caché sin usar.
 *
 * De ahí las dos reglas de abajo: a los ficheros con hash se va primero a la caché (su
 * contenido no puede haber cambiado, el nombre lo garantiza), y una respuesta que no sea
 * correcta —404 incluido— cuenta como fallo y también se recurre a la caché.
 *
 * Detalle que no se puede perder de vista: las respuestas se guardan con sus cabeceras,
 * incluidas Cross-Origin-Opener-Policy y Cross-Origin-Embedder-Policy que pone el Worker.
 * Eso es lo que mantiene la página "cross-origin isolated" al servirla desde caché — sin
 * ellas no hay SharedArrayBuffer y expo-sqlite no puede abrir la base de datos.
 */
const CACHE = 'momentum-v2';

/** Ficheros con el hash del contenido en el nombre: mismo nombre ⇒ mismo contenido. */
const isHashed = (pathname) => pathname.startsWith('/_expo/') || pathname.startsWith('/assets/');

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
      await pruneOldAssets();
    })(),
  );
});

/**
 * Borra de la caché los ficheros con hash que la versión actual ya no usa.
 *
 * Sin esto, cada despliegue dejaría dentro el bundle entero de la versión anterior para
 * siempre. Se toma como referencia el index.html del servidor: lo que no aparezca ahí ni
 * lo traiga él por debajo, sobra. Si no hay red, no se toca nada — es limpieza, no puede
 * ser el motivo de perder la copia que hace que la app abra sin cobertura.
 */
async function pruneOldAssets() {
  try {
    const res = await fetch('/', { cache: 'reload' });
    if (!res.ok) return;
    const html = await res.text();
    const cache = await caches.open(CACHE);
    const requests = await cache.keys();
    await Promise.all(
      requests.map(async (req) => {
        const { pathname } = new URL(req.url);
        if (!isHashed(pathname)) return;
        // El worker de SQLite y el .wasm los pide el propio bundle, no el HTML.
        if (/worker-|\.wasm$|\.ttf$/.test(pathname)) return;
        if (!html.includes(pathname)) await cache.delete(req);
      }),
    );
  } catch {
    // Sin red no se limpia. Mejor caché de sobra que app que no abre.
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Solo lo nuestro. Nada de Supabase ni de Open Food Facts: esos datos tienen que venir
  // frescos, y una respuesta vieja ahí solo puede confundir.
  if (url.origin !== self.location.origin) return;

  // El service worker nunca se cachea: si se queda pegado uno viejo, deja de llegar
  // cualquier cambio posterior.
  if (url.pathname === '/sw.js') return;

  event.respondWith(isHashed(url.pathname) ? cacheFirst(request) : networkFirst(request));
});

/** Guarda una copia si la respuesta es completa y releíble. */
function store(request, response) {
  if (response.ok && response.type === 'basic') {
    const copy = response.clone();
    caches.open(CACHE).then((c) => c.put(request, copy));
  }
  return response;
}

/**
 * Ficheros con hash: primero la caché. El nombre garantiza el contenido, así que no hay
 * nada que revalidar, abre al instante y da igual que el servidor ya los haya borrado.
 */
async function cacheFirst(request) {
  const hit = await caches.match(request);
  if (hit) return hit;
  try {
    return store(request, await fetch(request));
  } catch {
    return Response.error();
  }
}

/**
 * Todo lo demás (la cáscara, el manifest, los iconos): primero la red, para que un
 * despliegue nuevo se vea sin hacer nada. La caché es la red de seguridad — y cuenta como
 * fallo tanto que la red no conteste como que conteste mal (404, 500…).
 */
async function networkFirst(request) {
  try {
    const res = await fetch(request);
    if (res.ok) return store(request, res);
    const hit = await caches.match(request);
    if (hit) return hit;
    return res;
  } catch {
    const hit = await caches.match(request);
    if (hit) return hit;
    // Rutas de la SPA (/entreno, /progreso…): no hay un fichero por ruta, la cáscara es
    // siempre la misma.
    if (request.mode === 'navigate') {
      const shell = await caches.match('/');
      if (shell) return shell;
    }
    return Response.error();
  }
}
