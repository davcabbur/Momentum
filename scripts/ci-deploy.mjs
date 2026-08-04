#!/usr/bin/env node
/**
 * Momentum — despliegue de la PWA a Cloudflare Workers, sin ordenador.
 *
 * No pregunta nada: todo sale de variables de entorno, así que sirve para desplegar
 * desde el móvil (Actions → Deploy → Run workflow, o cualquier push a main).
 *
 * Requeridas:
 *   CLOUDFLARE_API_TOKEN   token con permiso Workers Scripts:Edit
 *   CLOUDFLARE_ACCOUNT_ID  id de la cuenta de Cloudflare
 *
 * No hay base de datos ni secretos del Worker: la cuenta y la sincronización son de
 * Supabase (la anon key es pública y va en el bundle) y los datos viven en el
 * dispositivo. Eso hace el deploy idempotente por construcción: volver a publicar no
 * toca ningún estado, así que no cierra la sesión del iPhone ni pierde datos.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const WRANGLER_CONFIG = join(ROOT, 'wrangler.jsonc');

const log = (text) => console.log(text);
const ok = (text) => console.log(`  ✓ ${text}`);
const info = (text) => console.log(`  · ${text}`);
function fail(text) {
  console.error(`\n✗ ${text}`);
  process.exit(1);
}

/** Ejecuta un comando volcando su salida al log y devolviéndola. */
function run(command, args) {
  const r = spawnSync(command, args, { cwd: ROOT, encoding: 'utf8', shell: true });
  const out = `${r.stdout ?? ''}${r.stderr ?? ''}`;
  process.stdout.write(out);
  return { ok: r.status === 0, out };
}

// --- 0. Comprobaciones -------------------------------------------------------

log('\nMomentum — despliegue de la PWA');
info(ROOT);

const { CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID } = process.env;

if (!CLOUDFLARE_API_TOKEN) fail('Falta el secreto CLOUDFLARE_API_TOKEN (ver DEPLOY.md).');
if (!CLOUDFLARE_ACCOUNT_ID) fail('Falta el secreto CLOUDFLARE_ACCOUNT_ID (ver DEPLOY.md).');
if (!existsSync(WRANGLER_CONFIG)) fail(`No encuentro wrangler.jsonc en ${ROOT}`);

// --- 1. Export web -----------------------------------------------------------

log('\n[1/2] Compilando la web');
{
  const built = run('npx', ['expo', 'export', '-p', 'web', '--output-dir', 'dist', '--clear']);
  if (!built.ok) fail('El export de Expo ha fallado. Revisa la salida de arriba.');

  const index = join(ROOT, 'dist', 'index.html');
  if (!existsSync(index)) fail('El export ha terminado pero no hay dist/index.html.');

  // La cáscara tiene que salir de public/index.html, con sus etiquetas de PWA. Si Expo
  // usara su plantilla por defecto, el iPhone añadiría la app a la pantalla de inicio
  // como un marcador de Safari (con barra de direcciones), y eso no se ve hasta
  // tenerlo instalado. Mejor romper el deploy aquí.
  const html = readFileSync(index, 'utf8');
  for (const needle of ['manifest.webmanifest', 'apple-mobile-web-app-capable', '/sw.js']) {
    if (!html.includes(needle)) {
      fail(`dist/index.html no contiene "${needle}": no se ha usado public/index.html como plantilla.`);
    }
  }
  // Y el bundle tiene que estar enganchado; si no, se publica una página en blanco.
  if (!/<script[^>]+src="[^"]*_expo\/static\/js\/web\//.test(html)) {
    fail('dist/index.html no engancha el bundle de _expo/static/js/web/.');
  }
  // Expo rellena los marcadores %…% de la plantilla con String.replace sin flag global,
  // así que solo sustituye la primera aparición de cada uno: si alguno se menciona antes
  // (por ejemplo en un comentario), el de verdad se queda crudo y sale a la vista.
  const leftover = html.match(/%[A-Z_]+%/g);
  if (leftover) fail(`dist/index.html tiene marcadores sin rellenar: ${[...new Set(leftover)].join(', ')}`);
  ok('dist listo, con las etiquetas de PWA');
}

// --- 2. Deploy ---------------------------------------------------------------

log('\n[2/2] Publicando el Worker');
let url = null;
{
  const deployed = run('npx', ['wrangler', 'deploy']);
  if (!deployed.ok) {
    // El fallo más probable la primera vez: la cuenta todavía no tiene subdominio
    // *.workers.dev, y eso se elige una sola vez y a mano.
    if (/workers\.dev subdomain/i.test(deployed.out)) {
      fail(
        'Tu cuenta de Cloudflare no tiene subdominio workers.dev todavía.\n' +
          '  Regístralo una vez (elige el nombre que quieras) en:\n' +
          `  https://dash.cloudflare.com/${CLOUDFLARE_ACCOUNT_ID}/workers/onboarding\n` +
          '  Después vuelve a lanzar este workflow: Actions → Deploy → Run workflow.',
      );
    }
    fail('El deploy ha fallado. Revisa la salida de arriba.');
  }
  url = deployed.out.match(/https:\/\/[a-z0-9-]+\.[a-z0-9-]+\.workers\.dev/i)?.[0] ?? null;
  ok('Worker desplegado');
}

log('');
ok('Momentum está en marcha');
if (url) {
  log(`\n  ${url}\n`);
  log('  En el iPhone: abre esa URL en Safari → Compartir → Añadir a pantalla de inicio.');
} else {
  log('  Busca la URL que acaba en .workers.dev en la salida de arriba.');
}
log('');

// En GitHub Actions, deja la URL a la vista en el resumen del run (es lo único que se
// ve cómodamente desde el móvil).
if (process.env.GITHUB_STEP_SUMMARY && url) {
  const summary = [
    '## Momentum desplegado ✅',
    '',
    `**${url}**`,
    '',
    'En el iPhone: abre la URL en **Safari** → Compartir → **Añadir a pantalla de inicio**.',
    '',
    'La primera vez, entra con correo y contraseña o con Google. Los datos se quedan en',
    'el propio iPhone y se sincronizan con Supabase, igual que en Android.',
    '',
  ].join('\n');
  try {
    writeFileSync(process.env.GITHUB_STEP_SUMMARY, summary, { flag: 'a' });
  } catch {
    // El resumen es un extra; si falla no rompe el deploy.
  }
}
