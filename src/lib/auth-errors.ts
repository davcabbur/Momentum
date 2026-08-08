/**
 * Traduce los errores de Supabase Auth (llegan en inglés) a español.
 *
 * Se mira primero el `code`, que Supabase mantiene estable, y solo después el texto del
 * mensaje, que cambia entre versiones. Esa es la razón de que exista el código: con solo
 * el texto, un cambio de redacción arriba deja de coincidir aquí en silencio y el usuario
 * pasa a ver el mensaje genérico — que fue exactamente lo que pasó con "User already
 * registered", rebautizado a "User already exists".
 *
 * Y cuando no se reconoce, el mensaje original se muestra entre paréntesis. Un aviso que
 * solo diga "inténtalo de nuevo" no deja salida: ni el usuario sabe qué arreglar ni se
 * puede diagnosticar a distancia.
 */

/** Errores con `code` estable de Supabase Auth. */
const BY_CODE: Record<string, string> = {
  invalid_credentials: 'Correo o contraseña incorrectos.',
  user_already_exists: 'Ya existe una cuenta con ese correo. Entra con ella en vez de crear una nueva.',
  email_exists: 'Ya existe una cuenta con ese correo. Entra con ella en vez de crear una nueva.',
  email_not_confirmed: 'Confirma tu correo antes de entrar (revisa tu bandeja).',
  weak_password: 'La contraseña debe tener al menos 6 caracteres.',
  email_address_invalid: 'Ese correo no es válido. Comprueba que esté bien escrito.',
  validation_failed: 'Ese correo no es válido. Comprueba que esté bien escrito.',
  signup_disabled: 'El registro está desactivado en el servidor.',
  email_provider_disabled: 'El registro con correo está desactivado en el servidor.',
  over_email_send_rate_limit: 'Se han enviado demasiados correos. Espera unos minutos y vuelve a probar.',
  over_request_rate_limit: 'Demasiados intentos. Espera un momento y vuelve a probar.',
  same_password: 'La contraseña nueva tiene que ser distinta de la actual.',
  user_banned: 'Esta cuenta está bloqueada.',
  session_expired: 'Tu sesión ha caducado. Vuelve a entrar.',
};

/** Reserva por texto, para versiones que no traen `code`. Se compara en minúsculas. */
const BY_MESSAGE: Array<[needle: string, message: string]> = [
  ['invalid login credentials', 'Correo o contraseña incorrectos.'],
  ['user already registered', 'Ya existe una cuenta con ese correo. Entra con ella en vez de crear una nueva.'],
  ['user already exists', 'Ya existe una cuenta con ese correo. Entra con ella en vez de crear una nueva.'],
  ['email already', 'Ya existe una cuenta con ese correo. Entra con ella en vez de crear una nueva.'],
  ['email not confirmed', 'Confirma tu correo antes de entrar (revisa tu bandeja).'],
  ['password should be at least', 'La contraseña debe tener al menos 6 caracteres.'],
  ['weak password', 'La contraseña debe tener al menos 6 caracteres.'],
  ['invalid format', 'Ese correo no es válido. Comprueba que esté bien escrito.'],
  ['is invalid', 'Ese correo no es válido. Comprueba que esté bien escrito.'],
  ['signups not allowed', 'El registro está desactivado en el servidor.'],
  ['signup is disabled', 'El registro está desactivado en el servidor.'],
  ['email signups are disabled', 'El registro con correo está desactivado en el servidor.'],
  ['email logins are disabled', 'La entrada con correo está desactivada en el servidor.'],
  ['for security purposes', 'Demasiados intentos. Espera un momento y vuelve a probar.'],
  ['rate limit', 'Demasiados intentos. Espera un momento y vuelve a probar.'],
  ['network request failed', 'Sin conexión. Comprueba tu internet e inténtalo de nuevo.'],
  ['failed to fetch', 'Sin conexión. Comprueba tu internet e inténtalo de nuevo.'],
  ['load failed', 'Sin conexión. Comprueba tu internet e inténtalo de nuevo.'],
  // Suele ser un trigger o una restricción de la base de datos al crear el usuario.
  ['database error', 'Error del servidor al crear la cuenta. Vuelve a intentarlo en un rato.'],
];

/** Lo que llega de supabase-js: un AuthError, que es un Error con `code` opcional. */
export interface AuthErrorLike {
  message: string;
  code?: string;
}

export function translateAuthError(error: AuthErrorLike | string): string {
  const message = typeof error === 'string' ? error : (error?.message ?? '');
  const code = typeof error === 'string' ? undefined : error?.code;

  if (code && BY_CODE[code]) return BY_CODE[code];

  const lower = message.toLowerCase();
  for (const [needle, translated] of BY_MESSAGE) {
    if (lower.includes(needle)) return translated;
  }

  // Desconocido: se dice lo que se puede en español y se deja ver el original, que es lo
  // único con lo que se puede averiguar qué ha fallado de verdad.
  const detail = [code, message].filter(Boolean).join(': ');
  return detail
    ? `No se pudo completar. Inténtalo de nuevo.\n\nDetalle: ${detail}`
    : 'No se pudo completar. Inténtalo de nuevo.';
}
