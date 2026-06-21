# Cuentas + datos en la nube — Fase 1 (diseño)

## Contexto y objetivo

Momentum es hoy una app **local-first** (SQLite + Drizzle, sin red salvo Open Food Facts).
Queremos preparar la **salida a mercado** con **cuentas multiusuario**: que la gente se registre
y tenga sus datos en la nube, sin perder el valor central de que **funciona sin conexión y es gratis**.

Decisiones ya tomadas (brainstorming):
- **Backend: Supabase** (Postgres + Auth + RLS, región **UE** por RGPD). Encaja con el modelo relacional actual.
- **Modelo: offline-first + sync.** Los datos siguen en el móvil; la nube guarda/sincroniza.
- **Cuenta opcional.** Sin registro la app funciona igual que ahora; registrarse añade copia/sync.
- **Auth: email/contraseña + Google.** Solo Android por ahora (sin Apple).
- Construcción **por fases**. Este spec cubre **solo la Fase 1**.

### Fases (visión)
- **Fase 1 (este spec):** cuenta + **copia completa** de los datos en la nube (snapshot JSON por usuario), con reconciliación al iniciar sesión.
- **Fase 2:** sync **incremental** offline-first (por filas: `user_id` + `updated_at` + tombstones; subir/bajar solo cambios; resolución de conflictos).
- **Fase 3:** RGPD completo y gestión de cuenta (política de privacidad, consentimiento, borrar cuenta/datos, cambiar email/contraseña).

## Alcance de la Fase 1

**Entra:** registro/login (email + Google), persistencia de sesión, cerrar sesión, recuperar contraseña,
subir/bajar la **copia completa** de la BD a la cuenta, reconciliación en el primer inicio de sesión,
botón "Sincronizar ahora", UI de cuenta en Ajustes.

**No entra (YAGNI / fases siguientes):** sync por filas o en tiempo real, login con Apple,
borrar cuenta, RGPD completo, cambiar email. (La copia entera = "gana la última escritura" a nivel de
todo el dataset; aceptable para 1 usuario en 1–2 dispositivos. La granularidad llega en Fase 2.)

## Arquitectura

### Backend (Supabase)
- Proyecto Supabase en **región UE** (p. ej. Frankfurt).
- **Auth providers:** Email (contraseña) + Google OAuth.
- **Tabla** (snapshot por usuario):
  ```sql
  create table public.user_snapshot (
    user_id uuid primary key references auth.users(id) on delete cascade,
    data jsonb not null,
    updated_at timestamptz not null default now()
  );
  alter table public.user_snapshot enable row level security;
  create policy "owner can read"   on public.user_snapshot for select using (auth.uid() = user_id);
  create policy "owner can insert" on public.user_snapshot for insert with check (auth.uid() = user_id);
  create policy "owner can update" on public.user_snapshot for update using (auth.uid() = user_id);
  ```
- La **anon key** es pública (segura para incrustar en la app); la seguridad la da RLS.

### Cliente (app)
- **Dependencias nuevas:** `@supabase/supabase-js`, `@react-native-async-storage/async-storage`
  (persistir sesión), `react-native-url-polyfill`, `expo-auth-session` + `expo-web-browser`
  (Google OAuth por enlace profundo).
- **Config:** `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` (vía `.env` / env de EAS;
  la anon key puede ir en el repo por ser pública, pero se gestiona como env por limpieza).
- **`src/lib/supabase.ts`** — cliente Supabase configurado con AsyncStorage, `autoRefreshToken: true`,
  `persistSession: true`, `detectSessionInUrl: false`.
- **`src/auth/`**:
  - `AuthProvider` + `useSession()` → `{ session, user, loading }`. Restaura sesión al arrancar y
    escucha `onAuthStateChange`. Envuelve la app en `_layout.tsx` (junto al ThemeProvider).
  - Funciones: `signUpEmail`, `signInEmail`, `signInWithGoogle`, `signOut`, `resetPassword`.
- **`src/db/cloud-sync.ts`** (snapshot, reutiliza `exportData`/`importData` ya existentes):
  - `pushSnapshot()` → `exportData()` y `upsert` en `user_snapshot`.
  - `pullSnapshot()` → lee `data` y `importData(json)`; si no hay fila, devuelve "vacío".
  - `getRemoteMeta()` → `{ exists, updatedAt }`.
- **Lógica pura (con tests):** `reconcileDecision({ localHasData, remoteExists }) → 'push' | 'pull' | 'ask'`
  en `src/db/cloud-sync-logic.ts` (sin red, testeable).

### UI
- **Sección "Cuenta" en Ajustes:**
  - Sin sesión: botón "Iniciar sesión / Registrarse" → abre pantalla de auth.
  - Con sesión: email del usuario + "Sincronizar ahora" + "Cerrar sesión".
- **Pantalla de auth** (`/cuenta`, accesible desde Ajustes): pestañas Registrarse / Iniciar sesión con
  email+contraseña, botón "Continuar con Google", enlace "¿Olvidaste la contraseña?".

## Flujos

- **Registro email:** `signUpEmail(email, pass)`. Si Supabase exige confirmación por correo, mostrar
  "Revisa tu email para confirmar". (Decisión de Fase 1: dejar la confirmación de email **activada** por
  seguridad; documentar el aviso al usuario.)
- **Login email / Google:** crea sesión, se persiste; tras login se ejecuta la **reconciliación**.
- **Google OAuth:** `supabase.auth.signInWithOAuth({ provider:'google', options:{ redirectTo, skipBrowserRedirect:true }})`
  → abrir con `WebBrowser.openAuthSessionAsync(url, redirectTo)` → intercambiar el código por sesión
  (`exchangeCodeForSession`). `redirectTo = makeRedirectUri({ scheme:'momentum' })` (el scheme ya existe en app.json).
- **Reconciliación (primer login / cada login):**
  - `remote no existe` + `local con datos` → **push** (sube los del móvil).
  - `remote existe` + `local vacío` → **pull** (restaura).
  - `remote existe` + `local con datos` → **preguntar** (Alert): "Usar los de la nube (reemplaza este móvil)"
    vs "Subir los de este móvil (reemplaza la nube)".
  - `remote no existe` + `local vacío` → nada.
- **Sincronizar ahora:** `pushSnapshot()` con feedback (éxito / sin conexión).
- **Cerrar sesión:** `pushSnapshot()` (guardar lo último) y luego `signOut()`. Los datos **permanecen** en el móvil.

## Errores y offline
- Toda operación de red protegida (try/catch + timeout). Sin conexión: avisar ("sin conexión; se sincronizará
  cuando vuelvas a tener internet") y **no** romper; los datos siguen en local.
- Errores de auth (credenciales, email ya usado, etc.) se muestran en la pantalla de auth.

## Seguridad y privacidad
- **RLS** garantiza que cada usuario solo accede a su fila. Anon key pública es segura.
- Datos en **región UE**. La política de privacidad, consentimiento y borrado de cuenta son **Fase 3**
  (obligatorio antes de publicar en tiendas). Añadir ya una nota mínima de privacidad en la pantalla de auth.

## Pruebas
- **TDD** de `reconcileDecision` (4 casos). El resto (auth/sync) es de integración con red → se mantiene
  `cloud-sync` fino y se prueba manualmente; los repos export/import ya están cubiertos por su lógica.
- Verificación habitual: `tsc`, `jest`, `expo export`.

## Tareas del usuario (no las puede hacer Claude)
1. Crear proyecto en **Supabase** (región UE) y ejecutar el SQL de la tabla + políticas.
2. Activar **Google** como proveedor en Supabase y crear credenciales OAuth en Google Cloud
   (con el `redirect` de Supabase). Pasos exactos se entregarán en el plan.
3. Pasar a Claude la **URL del proyecto** y la **anon key** (para la config).

## Dependencias nuevas
`@supabase/supabase-js`, `@react-native-async-storage/async-storage`, `react-native-url-polyfill`,
`expo-auth-session`, `expo-web-browser`. (Requiere **build nuevo de EAS** para probar en el móvil.)
