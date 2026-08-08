const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Permite que Metro resuelva los .sql de las migraciones de Drizzle.
config.resolver.sourceExts.push('sql');

// Web (PWA): expo-sqlite corre wa-sqlite (WASM) dentro de un Web Worker.
config.resolver.assetExts.push('wasm');

// Ese worker se comunica con el hilo principal por SharedArrayBuffer, que solo
// existe si la página está "cross-origin isolated". En producción esas cabeceras
// las pone el Worker de Cloudflare (ver worker/index.ts); esto es para `expo start --web`.
config.server.enhanceMiddleware = (middleware) => (req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  return middleware(req, res, next);
};

module.exports = config;
