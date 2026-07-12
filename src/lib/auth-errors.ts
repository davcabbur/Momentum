/**
 * Traduce los mensajes de error de Supabase Auth (llegan en inglés) a español.
 * Matching por subcadena y sin distinguir mayúsculas; fallback genérico.
 */
const TRANSLATIONS: Array<[needle: string, message: string]> = [
  ['invalid login credentials', 'Correo o contraseña incorrectos.'],
  ['user already registered', 'Ya existe una cuenta con ese correo.'],
  ['email not confirmed', 'Confirma tu correo antes de entrar (revisa tu bandeja).'],
  ['password should be at least', 'La contraseña debe tener al menos 6 caracteres.'],
  ['for security purposes', 'Demasiados intentos. Espera un momento y vuelve a probar.'],
  ['rate limit', 'Demasiados intentos. Espera un momento y vuelve a probar.'],
  ['network request failed', 'Sin conexión. Comprueba tu internet e inténtalo de nuevo.'],
  ['failed to fetch', 'Sin conexión. Comprueba tu internet e inténtalo de nuevo.'],
];

export function translateAuthError(message: string): string {
  const lower = message.toLowerCase();
  for (const [needle, translated] of TRANSLATIONS) {
    if (lower.includes(needle)) return translated;
  }
  return 'No se pudo completar. Inténtalo de nuevo.';
}
