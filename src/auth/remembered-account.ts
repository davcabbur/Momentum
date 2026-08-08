import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Recuerda con qué correo se entró la última vez, para que volver a entrar sea un solo
 * campo: la contraseña.
 *
 * Va en AsyncStorage y no en la base de datos a propósito: hay que poder leerlo antes de
 * que la BD esté abierta, porque la pantalla de login se pinta antes que nada. En web,
 * AsyncStorage es localStorage, así que sobrevive a cerrar la app y a los despliegues.
 *
 * Solo se guarda el correo, nunca la contraseña. La sesión ya la persiste supabase-js.
 */

const KEY = 'momentum.last_account_email';

export async function getRememberedEmail(): Promise<string | null> {
  try {
    const value = await AsyncStorage.getItem(KEY);
    return value && value.includes('@') ? value : null;
  } catch {
    // Si el almacenamiento falla, se pide el correo como siempre. No es crítico.
    return null;
  }
}

export async function rememberEmail(email: string): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, email.trim());
  } catch {
    /* Recordarlo es una comodidad, no puede romper el login. */
  }
}

export async function forgetEmail(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    /* idem */
  }
}
