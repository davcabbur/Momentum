/**
 * Worker de Cloudflare que sirve la PWA de Momentum.
 *
 * No hay backend: la cuenta y la sincronización siguen siendo de Supabase y la BD
 * vive en el propio dispositivo. Este Worker existe por una sola razón que un host
 * estático cualquiera no cubre: hay que poner cabeceras concretas en cada respuesta.
 *
 * En web, expo-sqlite ejecuta SQLite (wa-sqlite, WASM) dentro de un Web Worker y
 * habla con el hilo principal por SharedArrayBuffer + Atomics.wait. SharedArrayBuffer
 * solo existe si la página está "cross-origin isolated", y para eso el navegador
 * exige estas dos cabeceras en el documento:
 *
 *   Cross-Origin-Opener-Policy:   same-origin
 *   Cross-Origin-Embedder-Policy: require-corp
 *
 * Sin ellas la app no arranca: falla al abrir la base de datos.
 *
 * `require-corp` en vez de `credentialless` porque Safari no soporta credentialless,
 * y el objetivo es el iPhone. Se lo puede permitir porque la app no incrusta ningún
 * recurso de otro origen: todo (JS, fuentes, iconos, el .wasm) sale de aquí. Las
 * llamadas a Supabase y Open Food Facts son fetch con CORS, y a eso COEP no le afecta.
 */

interface Env {
  ASSETS: Fetcher;
}

/** Un año, para lo que lleva hash en el nombre y por tanto nunca cambia de contenido. */
const IMMUTABLE = 'public, max-age=31536000, immutable';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const res = await env.ASSETS.fetch(request);

    const headers = new Headers(res.headers);
    headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    headers.set('Cross-Origin-Embedder-Policy', 'require-corp');

    // Recursos del mismo origen que se incrustan bajo COEP; explícito para que un
    // día que la app se sirva desde un dominio propio no se rompa por sorpresa.
    headers.set('Cross-Origin-Resource-Policy', 'same-origin');

    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    const { pathname } = new URL(request.url);

    if (pathname.startsWith('/_expo/')) {
      // Metro mete el hash del contenido en el nombre del fichero.
      headers.set('Cache-Control', IMMUTABLE);
    } else if (pathname === '/sw.js' || pathname === '/manifest.webmanifest') {
      // El service worker no se puede cachear: si se queda pegado uno viejo, deja de
      // llegar cualquier cambio posterior.
      headers.set('Cache-Control', 'no-cache');
    }

    return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
  },
};
