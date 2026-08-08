import { translateAuthError } from './auth-errors';

describe('translateAuthError', () => {
  describe('por texto del mensaje', () => {
    it('traduce credenciales inválidas', () => {
      expect(translateAuthError('Invalid login credentials')).toBe('Correo o contraseña incorrectos.');
    });

    it('traduce usuario ya registrado, con las dos redacciones de Supabase', () => {
      const esperado = 'Ya existe una cuenta con ese correo. Entra con ella en vez de crear una nueva.';
      expect(translateAuthError('User already registered')).toBe(esperado);
      // Redacción nueva: con la antigua a secas, esto caía en el mensaje genérico.
      expect(translateAuthError('User already exists')).toBe(esperado);
    });

    it('traduce correo sin confirmar', () => {
      expect(translateAuthError('Email not confirmed')).toBe('Confirma tu correo antes de entrar (revisa tu bandeja).');
    });

    it('traduce contraseña demasiado corta', () => {
      expect(translateAuthError('Password should be at least 6 characters')).toBe('La contraseña debe tener al menos 6 caracteres.');
    });

    it('traduce registro desactivado en el servidor', () => {
      expect(translateAuthError('Signups not allowed for this instance')).toBe('El registro está desactivado en el servidor.');
      expect(translateAuthError('Email signups are disabled')).toBe('El registro con correo está desactivado en el servidor.');
    });

    it('traduce correo con formato inválido', () => {
      expect(translateAuthError('Unable to validate email address: invalid format')).toBe(
        'Ese correo no es válido. Comprueba que esté bien escrito.',
      );
    });

    it('traduce límite de intentos', () => {
      expect(translateAuthError('For security purposes, you can only request this after 60 seconds.')).toBe(
        'Demasiados intentos. Espera un momento y vuelve a probar.',
      );
      expect(translateAuthError('Email rate limit exceeded')).toBe('Demasiados intentos. Espera un momento y vuelve a probar.');
    });

    it('traduce fallo de red, incluido el "Load failed" de Safari', () => {
      expect(translateAuthError('Network request failed')).toBe('Sin conexión. Comprueba tu internet e inténtalo de nuevo.');
      expect(translateAuthError('Load failed')).toBe('Sin conexión. Comprueba tu internet e inténtalo de nuevo.');
    });

    it('no distingue mayúsculas de minúsculas', () => {
      expect(translateAuthError('INVALID LOGIN CREDENTIALS')).toBe('Correo o contraseña incorrectos.');
    });
  });

  describe('por código', () => {
    it('usa el código cuando está, sin depender del texto', () => {
      expect(translateAuthError({ code: 'invalid_credentials', message: 'texto que cambie mañana' })).toBe(
        'Correo o contraseña incorrectos.',
      );
      expect(translateAuthError({ code: 'user_already_exists', message: 'cualquier cosa' })).toBe(
        'Ya existe una cuenta con ese correo. Entra con ella en vez de crear una nueva.',
      );
      expect(translateAuthError({ code: 'over_email_send_rate_limit', message: '' })).toBe(
        'Se han enviado demasiados correos. Espera unos minutos y vuelve a probar.',
      );
    });

    it('el código manda sobre el mensaje', () => {
      expect(translateAuthError({ code: 'signup_disabled', message: 'Invalid login credentials' })).toBe(
        'El registro está desactivado en el servidor.',
      );
    });

    it('con un código desconocido, recurre al texto', () => {
      expect(translateAuthError({ code: 'algo_nuevo', message: 'Email not confirmed' })).toBe(
        'Confirma tu correo antes de entrar (revisa tu bandeja).',
      );
    });
  });

  describe('errores desconocidos', () => {
    // Lo importante: nunca dejar un aviso sin salida. Si no se reconoce, se muestra el
    // original, que es lo único con lo que se puede averiguar qué ha fallado.
    it('muestra el mensaje original entre el detalle', () => {
      const r = translateAuthError('Something exploded');
      expect(r).toContain('No se pudo completar. Inténtalo de nuevo.');
      expect(r).toContain('Something exploded');
    });

    it('incluye también el código si lo hay', () => {
      const r = translateAuthError({ code: 'unexpected_failure', message: 'Boom' });
      expect(r).toContain('unexpected_failure');
      expect(r).toContain('Boom');
    });

    it('sin nada que mostrar, se queda en el mensaje genérico a secas', () => {
      expect(translateAuthError('')).toBe('No se pudo completar. Inténtalo de nuevo.');
    });
  });
});
