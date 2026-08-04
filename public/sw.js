/**
 * Service worker de Momentum.
 *
 * Estrategia: red primero, caché como red de seguridad. Así un despliegue nuevo se
 * ve enseguida (no hay que forzar recarga) y la app sigue abriéndose sin cobertura,
 * que es lo normal en el gimnasio.
 *
 * Solo se cachea lo nuestro y del mismo origen. Nada de Supabase ni de Open Food
 * Facts: los datos vienen de la BD local, y una respuesta de red vieja ahí solo
 * puede confundir.
 *
 * Detalle importante: las respuestas se guardan con sus cabeceras, incluidas
 * Cross-Origin-Opener-Policy y Cross-Origin-Embedder-Policy que pone el Worker.
 * Eso es lo que mantiene la página "cross-origin isolated" al servirla desde caché
 * — sin ellas SharedArrayBuffer desaparece y expo-sqlite no arranca.
 */
const CACHE = 'momentum-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((res) => {
        // `basic` descarta opaque/error: solo se guarda lo que se puede releer entero.
        if (res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
        }
        return res;
      })
      .catch(async () => {
        const hit = await caches.match(request);
        if (hit) return hit;
        // Rutas de la SPA (/entreno, /progreso…): no hay un fichero por ruta, la
        // cáscara es siempre la misma.
        if (request.mode === 'navigate') {
          const shell = await caches.match('/');
          if (shell) return shell;
        }
        return Response.error();
      }),
  );
});
