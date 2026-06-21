# Cuentas + datos en la nube (Fase 1) — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que el usuario se registre/inicie sesión (email o Google) y que toda su base de datos quede guardada y se restaure desde su cuenta en Supabase, manteniendo la app funcional en local sin cuenta.

**Architecture:** Cliente Supabase (auth + Postgres con RLS) sobre la app local-first existente. La cuenta es opcional. La sincronización de Fase 1 es por **copia completa** (snapshot JSON por usuario), reutilizando `exportData`/`importData` ya existentes. Un `AuthProvider` expone la sesión; al iniciar sesión se reconcilia local vs nube.

**Tech Stack:** React Native + Expo SDK 54, TypeScript, expo-router, `@supabase/supabase-js`, `@react-native-async-storage/async-storage`, `react-native-url-polyfill`, `expo-auth-session`, `expo-web-browser`.

## Global Constraints

- TypeScript estricto, indentación 2 espacios.
- Colores siempre vía `useTheme()` / tokens del tema (`c.*`), nunca hex hardcodeados.
- Responder/textos de UI en español.
- Nunca IMC. Nada que genere ansiedad.
- La app debe seguir funcionando **sin cuenta y sin conexión** (la cuenta es opcional).
- Anon key de Supabase es pública (segura); la seguridad la da RLS.
- Región del proyecto Supabase: **UE**.
- Verificación de cada tarea: `npx tsc --noEmit` y `npx jest` en verde; para lógica pura, TDD (test antes que implementación).
- Commitear con `git commit -F <archivo>` (los mensajes con paréntesis/comillas rompen el here-string de PowerShell). Mensaje termina en `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

---

### Task 0: Configuración de Supabase y Google (la hace el usuario)

No es código; es prerrequisito de las tareas 3+ (red). Documentar y esperar a tener las credenciales.

- [ ] **Paso 1: Crear proyecto Supabase** en https://supabase.com (organización propia), **región UE** (p. ej. Frankfurt).
- [ ] **Paso 2: Crear la tabla y RLS.** En el SQL Editor de Supabase, ejecutar:

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

- [ ] **Paso 3: Google OAuth.** En Google Cloud Console crear credenciales OAuth (tipo "Web application"); en "Authorized redirect URIs" poner el callback de Supabase: `https://<PROJECT-REF>.supabase.co/auth/v1/callback`. Copiar Client ID y Client Secret.
- [ ] **Paso 4: Activar Google en Supabase** (Authentication → Providers → Google) pegando Client ID/Secret. En Authentication → URL Configuration → Redirect URLs, añadir `momentum://*`.
- [ ] **Paso 5: Email.** Authentication → Providers → Email activado. Dejar "Confirm email" **activado**.
- [ ] **Paso 6: Pasar a Claude** la **Project URL** (`https://<ref>.supabase.co`) y la **anon public key** (Settings → API).

---

### Task 1: Dependencias y cliente Supabase

**Files:**
- Modify: `package.json` (dependencias, vía `expo install`)
- Create: `src/lib/supabase.ts`
- Create: `.env` (variables públicas)
- Modify: `.gitignore` (no ignorar `.env`? la anon key es pública; se decide incluirlo)

**Interfaces:**
- Produces: `supabase` (cliente `SupabaseClient`) desde `@/lib/supabase`.

- [ ] **Step 1: Instalar dependencias**

Run:
```
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill expo-auth-session expo-web-browser
```

- [ ] **Step 2: Crear `.env`** (sustituir por los valores reales de Task 0)

```
EXPO_PUBLIC_SUPABASE_URL=https://TUREF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=TU_ANON_KEY
```

Asegurar que `.env` NO está ignorado en `.gitignore` (la anon key es pública y debe ir al build de EAS). Si está, quitar la línea o usar EAS env vars.

- [ ] **Step 3: Crear el cliente** `src/lib/supabase.ts`

```ts
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** ¿Hay credenciales configuradas? Si no, la app funciona en local sin cuenta. */
export const supabaseEnabled = url.length > 0 && anonKey.length > 0;

export const supabase = createClient(url, anonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});
```

- [ ] **Step 4: Verificar** `npx tsc --noEmit` (OK) y `npx expo export --platform android` (empaqueta sin error); borrar `dist`.

- [ ] **Step 5: Commit** (`git add package.json package-lock.json src/lib/supabase.ts .env .gitignore`; mensaje: `feat(cuenta): cliente Supabase y dependencias`).

---

### Task 2: Lógica pura de reconciliación (TDD)

**Files:**
- Create: `src/db/cloud-sync-logic.ts`
- Test: `src/db/cloud-sync-logic.test.ts`

**Interfaces:**
- Produces: `reconcileDecision(input: { localHasData: boolean; remoteExists: boolean }): 'push' | 'pull' | 'ask' | 'none'`

- [ ] **Step 1: Escribir el test** `src/db/cloud-sync-logic.test.ts`

```ts
import { reconcileDecision } from './cloud-sync-logic';

test('nube vacía + local con datos -> push', () => {
  expect(reconcileDecision({ localHasData: true, remoteExists: false })).toBe('push');
});
test('nube con datos + local vacío -> pull', () => {
  expect(reconcileDecision({ localHasData: false, remoteExists: true })).toBe('pull');
});
test('ambos con datos -> ask', () => {
  expect(reconcileDecision({ localHasData: true, remoteExists: true })).toBe('ask');
});
test('ambos vacíos -> none', () => {
  expect(reconcileDecision({ localHasData: false, remoteExists: false })).toBe('none');
});
```

- [ ] **Step 2: Ejecutar y ver que falla** — Run: `npx jest cloud-sync-logic` → FAIL (módulo no existe).

- [ ] **Step 3: Implementar** `src/db/cloud-sync-logic.ts`

```ts
export type ReconcileAction = 'push' | 'pull' | 'ask' | 'none';

/** Decide qué hacer al iniciar sesión, según haya datos en el móvil y/o en la nube. */
export function reconcileDecision(input: { localHasData: boolean; remoteExists: boolean }): ReconcileAction {
  const { localHasData, remoteExists } = input;
  if (remoteExists && localHasData) return 'ask';
  if (remoteExists) return 'pull';
  if (localHasData) return 'push';
  return 'none';
}
```

- [ ] **Step 4: Ejecutar y ver que pasa** — Run: `npx jest cloud-sync-logic` → PASS.

- [ ] **Step 5: Commit** (`git add src/db/cloud-sync-logic.ts src/db/cloud-sync-logic.test.ts`; mensaje: `feat(cuenta): logica de reconciliacion local/nube`).

---

### Task 3: Módulo de sincronización por snapshot

**Files:**
- Create: `src/db/cloud-sync.ts`
- Depends on: `src/db/backup.ts` (`exportData`, `importData`), `src/lib/supabase.ts`

**Interfaces:**
- Consumes: `exportData(): Promise<string>`, `importData(json: string): Promise<{ rows: number }>`, `supabase`.
- Produces:
  - `getRemoteMeta(userId: string): Promise<{ exists: boolean; updatedAt: string | null }>`
  - `pushSnapshot(userId: string): Promise<void>`
  - `pullSnapshot(userId: string): Promise<boolean>` (true si había datos)
  - `localHasData(): Promise<boolean>`

- [ ] **Step 1: Implementar** `src/db/cloud-sync.ts`

```ts
import { supabase } from '@/lib/supabase';
import { listWeights } from './bodyweight-repo';
import { exportData, importData } from './backup';

const TABLE = 'user_snapshot';

/** ¿Hay algo que merezca la pena en local? (criterio simple: hay pesajes registrados). */
export async function localHasData(): Promise<boolean> {
  return (await listWeights()).length > 0;
}

export async function getRemoteMeta(userId: string): Promise<{ exists: boolean; updatedAt: string | null }> {
  const { data, error } = await supabase.from(TABLE).select('updated_at').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return { exists: !!data, updatedAt: data?.updated_at ?? null };
}

export async function pushSnapshot(userId: string): Promise<void> {
  const json = await exportData();
  const { error } = await supabase
    .from(TABLE)
    .upsert({ user_id: userId, data: JSON.parse(json), updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function pullSnapshot(userId: string): Promise<boolean> {
  const { data, error } = await supabase.from(TABLE).select('data').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  if (!data?.data) return false;
  await importData(JSON.stringify(data.data));
  return true;
}
```

- [ ] **Step 2: Verificar** `npx tsc --noEmit` (OK). (Sin test unitario: depende de red; se prueba manualmente en Task 6.)

- [ ] **Step 3: Commit** (`git add src/db/cloud-sync.ts`; mensaje: `feat(cuenta): sync por snapshot (push/pull) con Supabase`).

---

### Task 4: Módulo de auth y AuthProvider

**Files:**
- Create: `src/auth/auth.ts`
- Create: `src/auth/AuthProvider.tsx`
- Modify: `src/app/_layout.tsx` (envolver con `AuthProvider`)

**Interfaces:**
- Produces (`auth.ts`):
  - `signUpEmail(email, password): Promise<{ error: Error | null; needsConfirm: boolean }>`
  - `signInEmail(email, password): Promise<{ error: Error | null }>`
  - `signInWithGoogle(): Promise<{ error: Error | null }>`
  - `signOut(): Promise<void>`
  - `resetPassword(email): Promise<{ error: Error | null }>`
- Produces (`AuthProvider.tsx`): `AuthProvider` y `useSession(): { session: Session | null; user: User | null; loading: boolean }`

- [ ] **Step 1: Implementar** `src/auth/auth.ts`

```ts
import { makeRedirectUri } from 'expo-auth-session';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from '@/lib/supabase';

export async function signUpEmail(email: string, password: string): Promise<{ error: Error | null; needsConfirm: boolean }> {
  const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
  // Si "Confirm email" está activo, no hay sesión hasta confirmar.
  return { error: error as Error | null, needsConfirm: !error && !data.session };
}

export async function signInEmail(email: string, password: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  return { error: error as Error | null };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function resetPassword(email: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
  return { error: error as Error | null };
}

export async function signInWithGoogle(): Promise<{ error: Error | null }> {
  try {
    const redirectTo = makeRedirectUri({ scheme: 'momentum' });
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) return { error };
    if (!data.url) return { error: new Error('No se pudo iniciar sesión con Google.') };
    const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (res.type !== 'success') return { error: null }; // cancelado por el usuario
    const { queryParams } = Linking.parse(res.url);
    const code = queryParams?.code;
    if (typeof code === 'string') {
      const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
      return { error: exErr as Error | null };
    }
    return { error: new Error('Respuesta de Google inválida.') };
  } catch (e) {
    return { error: e as Error };
  }
}
```

- [ ] **Step 2: Implementar** `src/auth/AuthProvider.tsx`

```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

interface AuthValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthValue>({ session: null, user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ session, user: session?.user ?? null, loading }}>{children}</AuthContext.Provider>;
}

export function useSession(): AuthValue {
  return useContext(AuthContext);
}
```

- [ ] **Step 3: Envolver la app** en `src/app/_layout.tsx` (añadir el import y envolver dentro de `AppThemeProvider`, fuera de `NavThemeProvider`):

```tsx
import { AuthProvider } from '@/auth/AuthProvider';
// ...
return (
  <AppThemeProvider>
    <AuthProvider>
      <NavThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AppTabs />
      </NavThemeProvider>
    </AuthProvider>
  </AppThemeProvider>
);
```

- [ ] **Step 4: Verificar** `npx tsc --noEmit` (OK).

- [ ] **Step 5: Commit** (`git add src/auth/auth.ts src/auth/AuthProvider.tsx src/app/_layout.tsx`; mensaje: `feat(cuenta): modulo de auth y AuthProvider`).

---

### Task 5: Pantalla de cuenta y sección en Ajustes

**Files:**
- Create: `src/ui/CuentaScreen.tsx`
- Create: `src/app/cuenta.tsx` (ruta, fuera de la barra de pestañas)
- Modify: `src/components/app-tabs.tsx` (registrar `cuenta` con `href: null`)
- Modify: `src/ui/AjustesScreen.tsx` (sección "Cuenta")

**Interfaces:**
- Consumes: `useSession`, `signUpEmail`, `signInEmail`, `signInWithGoogle`, `resetPassword`.
- Produces: ruta `/cuenta`.

- [ ] **Step 1: Crear** `src/ui/CuentaScreen.tsx` (login/registro email + Google + reset). Usa el patrón de tema (`useTheme`/`useThemedStyles`).

```tsx
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, TextInput, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { signInEmail, signUpEmail, signInWithGoogle, resetPassword } from '@/auth/auth';
import { useTheme, useThemedStyles, type Theme } from '@/ui/theme';

export function CuentaScreen() {
  const router = useRouter();
  const { c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!email.trim() || pass.length < 6) {
      Alert.alert('Datos incompletos', 'Introduce un email y una contraseña de al menos 6 caracteres.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { error, needsConfirm } = await signUpEmail(email, pass);
        if (error) return Alert.alert('No se pudo registrar', error.message);
        if (needsConfirm) {
          Alert.alert('Casi listo', 'Te hemos enviado un correo para confirmar tu cuenta. Confírmalo y vuelve a iniciar sesión.');
          setMode('login');
          return;
        }
      } else {
        const { error } = await signInEmail(email, pass);
        if (error) return Alert.alert('No se pudo entrar', error.message);
      }
      router.back();
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) Alert.alert('Google', error.message);
      else router.back();
    } finally {
      setBusy(false);
    }
  }

  async function forgot() {
    if (!email.trim()) return Alert.alert('Email', 'Escribe tu email arriba y vuelve a pulsar.');
    const { error } = await resetPassword(email);
    Alert.alert(error ? 'Error' : 'Listo', error ? error.message : 'Te hemos enviado un correo para restablecer la contraseña.');
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backRow}>
        <Ionicons name="chevron-back" size={22} color={c.accent} />
        <Text style={styles.back}>Ajustes</Text>
      </Pressable>
      <Text style={styles.h1}>{mode === 'signup' ? 'Crear cuenta' : 'Iniciar sesión'}</Text>
      <Text style={styles.note}>Con cuenta, tus datos se guardan en la nube y los recuperas en cualquier móvil. Es opcional.</Text>

      <Text style={styles.lbl}>Email</Text>
      <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="tu@email.com" placeholderTextColor={c.textMuted} style={styles.input} />
      <Text style={styles.lbl}>Contraseña</Text>
      <TextInput value={pass} onChangeText={setPass} secureTextEntry placeholder="······" placeholderTextColor={c.textMuted} style={styles.input} />

      <Pressable style={[styles.primary, busy && styles.off]} disabled={busy} onPress={submit}>
        <Text style={styles.primaryTxt}>{mode === 'signup' ? 'Registrarme' : 'Entrar'}</Text>
      </Pressable>
      <Pressable style={styles.google} disabled={busy} onPress={google}>
        <Ionicons name="logo-google" size={18} color={c.text} />
        <Text style={styles.googleTxt}>Continuar con Google</Text>
      </Pressable>

      <Pressable onPress={() => setMode(mode === 'signup' ? 'login' : 'signup')}>
        <Text style={styles.link}>{mode === 'signup' ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}</Text>
      </Pressable>
      {mode === 'login' && (
        <Pressable onPress={forgot}><Text style={styles.link}>¿Olvidaste la contraseña?</Text></Pressable>
      )}
    </ScrollView>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.surface },
    content: { padding: 14, gap: 8 },
    backRow: { flexDirection: 'row', alignItems: 'center' },
    back: { color: c.accent, fontWeight: '700', fontSize: 15 },
    h1: { color: c.text, fontSize: 22, fontWeight: '800', marginTop: 4 },
    note: { color: c.textMuted, fontSize: 13, marginBottom: 8 },
    lbl: { color: c.textMuted, fontSize: 12, marginTop: 8 },
    input: { color: c.text, fontSize: 16, fontWeight: '600', backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, marginTop: 4 },
    primary: { backgroundColor: c.accentStrong, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 14 },
    primaryTxt: { color: c.onAccent, fontWeight: '800', fontSize: 15 },
    off: { opacity: 0.5 },
    google: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 12, paddingVertical: 13, marginTop: 10 },
    googleTxt: { color: c.text, fontWeight: '700' },
    link: { color: c.accent, fontWeight: '700', fontSize: 13, textAlign: 'center', marginTop: 14 },
  });
```

- [ ] **Step 2: Crear ruta** `src/app/cuenta.tsx`

```tsx
import { SafeAreaView } from 'react-native-safe-area-context';

import { CuentaScreen } from '@/ui/CuentaScreen';
import { useTheme } from '@/ui/theme';

export default function CuentaRoute() {
  const { c } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <CuentaScreen />
    </SafeAreaView>
  );
}
```

- [ ] **Step 3: Registrar la ruta** en `src/components/app-tabs.tsx` (junto a las otras `href: null`):

```tsx
<Tabs.Screen name="cuenta" options={{ href: null }} />
```

- [ ] **Step 4: Verificar** `npx tsc --noEmit` (OK) y `npx expo export --platform android`; borrar `dist`.

- [ ] **Step 5: Commit** (`git add src/ui/CuentaScreen.tsx src/app/cuenta.tsx src/components/app-tabs.tsx`; mensaje: `feat(cuenta): pantalla de registro/login`).

---

### Task 6: Sección "Cuenta" en Ajustes + reconciliación y sincronización

**Files:**
- Modify: `src/ui/AjustesScreen.tsx`

**Interfaces:**
- Consumes: `useSession`, `signOut`, `getRemoteMeta`, `pushSnapshot`, `pullSnapshot`, `localHasData`, `reconcileDecision`.

- [ ] **Step 1: Añadir imports** en `AjustesScreen.tsx` (y asegurar que `useEffect` está en el import de `react`: `import { useCallback, useEffect, useState } from 'react';`):

```tsx
import { useSession } from '@/auth/AuthProvider';
import { signOut } from '@/auth/auth';
import { getRemoteMeta, localHasData, pullSnapshot, pushSnapshot } from '@/db/cloud-sync';
import { reconcileDecision } from '@/db/cloud-sync-logic';
```

- [ ] **Step 2: En el componente**, obtener la sesión y un estado de "sincronizando":

```tsx
const { user } = useSession();
const [syncing, setSyncing] = useState(false);
```

- [ ] **Step 3: Reconciliación al iniciar sesión.** Añadir efecto que, cuando aparece `user`, decide push/pull/ask:

```tsx
useEffect(() => {
  if (!user) return;
  let active = true;
  (async () => {
    try {
      const [meta, hasLocal] = await Promise.all([getRemoteMeta(user.id), localHasData()]);
      if (!active) return;
      const action = reconcileDecision({ localHasData: hasLocal, remoteExists: meta.exists });
      if (action === 'pull') { await pullSnapshot(user.id); await load(); }
      else if (action === 'push') { await pushSnapshot(user.id); }
      else if (action === 'ask') {
        Alert.alert('Sincronizar', 'Tienes datos en este móvil y en tu cuenta. ¿Cuáles quieres conservar?', [
          { text: 'Usar los de la nube', onPress: async () => { await pullSnapshot(user.id); await load(); } },
          { text: 'Subir los de este móvil', onPress: async () => { await pushSnapshot(user.id); } },
        ]);
      }
    } catch (e) {
      Alert.alert('Sincronización', 'No se pudo sincronizar ahora (¿sin conexión?). Tus datos siguen en el móvil.');
    }
  })();
  return () => { active = false; };
}, [user]);
```

- [ ] **Step 4: Handlers** de sincronizar y cerrar sesión:

```tsx
async function syncNow() {
  if (!user) return;
  setSyncing(true);
  try {
    await pushSnapshot(user.id);
    Alert.alert('Hecho', 'Tus datos se han guardado en tu cuenta.');
  } catch {
    Alert.alert('Sincronización', 'No se pudo sincronizar (¿sin conexión?).');
  } finally {
    setSyncing(false);
  }
}

async function cerrarSesion() {
  try { if (user) await pushSnapshot(user.id); } catch {}
  await signOut();
}
```

- [ ] **Step 5: UI de la sección** "Cuenta" (añadir antes de "Apariencia"):

```tsx
{/* Cuenta */}
<Text style={styles.section}>Cuenta</Text>
<View style={styles.card}>
  {user ? (
    <>
      <Text style={styles.note}>Sesión iniciada como {user.email}. Tus datos se guardan en tu cuenta.</Text>
      <Pressable style={[styles.save, syncing && { opacity: 0.5 }]} disabled={syncing} onPress={syncNow}>
        <Text style={styles.saveTxt}>{syncing ? 'Sincronizando…' : 'Sincronizar ahora'}</Text>
      </Pressable>
      <Pressable style={styles.secondary} onPress={cerrarSesion}>
        <Text style={styles.secondaryTxt}>Cerrar sesión</Text>
      </Pressable>
    </>
  ) : (
    <>
      <Text style={styles.note}>Inicia sesión para guardar tus datos en la nube y recuperarlos en otro móvil. Es opcional.</Text>
      <Pressable style={styles.save} onPress={() => router.push('/cuenta')}>
        <Text style={styles.saveTxt}>Iniciar sesión / Registrarse</Text>
      </Pressable>
    </>
  )}
</View>
```

- [ ] **Step 6: Verificar** `npx tsc --noEmit` (OK), `npx jest` (verde), `npx expo export --platform android`; borrar `dist`.

- [ ] **Step 7: Commit** (`git add src/ui/AjustesScreen.tsx`; mensaje: `feat(cuenta): seccion de cuenta en Ajustes con reconciliacion y sync`).

---

### Task 7: Build de prueba y verificación manual (requiere Task 0 hecha)

No se puede probar auth/sync en Expo Go con OAuth de forma fiable; hace falta build de EAS.

- [ ] **Step 1:** Confirmar que `.env` tiene la URL y anon key reales (Task 0).
- [ ] **Step 2:** `npx eas-cli@latest build -p android --profile preview` e instalar la APK.
- [ ] **Step 3 (manual):** Registrarse con email → confirmar correo → iniciar sesión → "Sincronizar ahora". En Supabase, comprobar que `user_snapshot` tiene una fila para el usuario.
- [ ] **Step 4 (manual):** Cerrar sesión, borrar datos del dispositivo (o en otro móvil), iniciar sesión → debe **restaurar** (pull).
- [ ] **Step 5 (manual):** Probar "Continuar con Google" (vuelve a la app con sesión).
- [ ] **Step 6 (manual):** Modo avión → "Sincronizar ahora" debe avisar sin romper.

---

## Notas de implementación
- **Orden recomendado:** Tasks 1, 2, 4, 5 no requieren credenciales reales (compilan y pasan tsc/jest sin backend). Tasks 3 y 6 requieren las credenciales (Task 0) para probarse en vivo, pero su código se puede escribir antes. Task 7 cierra con el build real.
- **Borrar este plan y el spec** al terminar la Fase 1 (norma del proyecto).
- La **Fase 2** (sync por filas) y la **Fase 3** (RGPD, borrar cuenta) tendrán su propio spec.
