import { makeRedirectUri } from 'expo-auth-session';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

export async function signUpEmail(email: string, password: string): Promise<{ error: Error | null; needsConfirm: boolean }> {
  const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
  // Con "Confirm email" activo, no hay sesión hasta que el usuario confirma el correo.
  return { error: (error as Error | null) ?? null, needsConfirm: !error && !data.session };
}

export async function signInEmail(email: string, password: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  return { error: (error as Error | null) ?? null };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Borra la cuenta del usuario y todos sus datos en la nube.
 * - Intenta eliminar el propio usuario de Auth vía la Edge Function `delete-account`
 *   (necesita la service_role en el servidor; ver supabase/functions/delete-account).
 * - Pase lo que pase, borra su copia en `user_snapshot` (las políticas RLS permiten
 *   que cada usuario borre su propia fila), para que no queden datos suyos en la nube.
 * El borrado de los datos LOCALES y el cierre de sesión se hacen aparte, en la UI.
 */
export async function deleteAccount(): Promise<{ error: Error | null }> {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  let fnError: Error | null = null;
  try {
    const { error } = await supabase.functions.invoke('delete-account');
    if (error) fnError = error as Error;
  } catch (e) {
    fnError = e as Error;
  }
  if (userId) {
    await supabase.from('user_snapshot').delete().eq('user_id', userId);
  }
  return { error: fnError };
}

export async function resetPassword(email: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
  return { error: (error as Error | null) ?? null };
}

export async function signInWithGoogle(): Promise<{ error: Error | null }> {
  if (Platform.OS === 'web') return signInWithGoogleWeb();
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
    const code = Linking.parse(res.url).queryParams?.code;
    if (typeof code === 'string') {
      const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
      return { error: (exErr as Error | null) ?? null };
    }
    return { error: new Error('Respuesta de Google inválida.') };
  } catch (e) {
    return { error: e as Error };
  }
}

/**
 * Login con Google en la PWA: redirección de la página completa, no ventana emergente.
 *
 * La versión web se sirve con Cross-Origin-Opener-Policy: same-origin (hace falta
 * para que expo-sqlite tenga SharedArrayBuffer), y esa cabecera corta la referencia
 * entre la ventana emergente y la que la abrió — así que el flujo de popup que usa
 * WebBrowser en web se queda esperando para siempre. Redirigiendo la pestaña entera
 * no hay ventana que vigilar: Google vuelve a la app con el `code` en la URL y lo
 * canjea supabase-js al arrancar (detectSessionInUrl).
 *
 * La URL de vuelta es el propio origen, y hay que tenerla dada de alta en Supabase →
 * Authentication → URL Configuration → Redirect URLs (ver DEPLOY.md).
 */
async function signInWithGoogleWeb(): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    // Si no hay error el navegador ya está navegando fuera; no hay nada más que hacer.
    return { error: (error as Error | null) ?? null };
  } catch (e) {
    return { error: e as Error };
  }
}
