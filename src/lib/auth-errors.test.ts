import { translateAuthError } from './auth-errors';

describe('translateAuthError', () => {
  it('traduce credenciales inválidas', () => {
    expect(translateAuthError('Invalid login credentials')).toBe('Correo o contraseña incorrectos.');
  });

  it('traduce usuario ya registrado', () => {
    expect(translateAuthError('User already registered')).toBe('Ya existe una cuenta con ese correo.');
  });

  it('traduce correo sin confirmar', () => {
    expect(translateAuthError('Email not confirmed')).toBe('Confirma tu correo antes de entrar (revisa tu bandeja).');
  });

  it('traduce contraseña demasiado corta', () => {
    expect(translateAuthError('Password should be at least 6 characters')).toBe('La contraseña debe tener al menos 6 caracteres.');
  });

  it('traduce límite de intentos', () => {
    expect(translateAuthError('For security purposes, you can only request this after 60 seconds.')).toBe('Demasiados intentos. Espera un momento y vuelve a probar.');
    expect(translateAuthError('Email rate limit exceeded')).toBe('Demasiados intentos. Espera un momento y vuelve a probar.');
  });

  it('traduce fallo de red', () => {
    expect(translateAuthError('Network request failed')).toBe('Sin conexión. Comprueba tu internet e inténtalo de nuevo.');
  });

  it('no distingue mayúsculas de minúsculas', () => {
    expect(translateAuthError('INVALID LOGIN CREDENTIALS')).toBe('Correo o contraseña incorrectos.');
  });

  it('devuelve un fallback genérico para mensajes desconocidos', () => {
    expect(translateAuthError('Something exploded')).toBe('No se pudo completar. Inténtalo de nuevo.');
  });
});
