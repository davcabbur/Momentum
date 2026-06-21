import { makeRedirectUri } from 'expo-auth-session';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

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

export async function resetPassword(email: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
  return { error: (error as Error | null) ?? null };
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
