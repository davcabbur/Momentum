import { shouldAutoSync, type AutoSyncInput } from './auto-sync-logic';

const AHORA = Date.parse('2026-08-08T12:00:00.000Z');
const YO = 'usuario-1';

/** Caso base: todo en orden y la última copia hace 30 h, así que toca subir. */
const base = (extra: Partial<AutoSyncInput> = {}): AutoSyncInput => ({
  hasSession: true,
  reconciling: false,
  dataOwner: YO,
  userId: YO,
  lastSyncAt: '2026-08-07T06:00:00.000Z',
  nowMs: AHORA,
  ...extra,
});

const horasAtras = (h: number) => new Date(AHORA - h * 60 * 60 * 1000).toISOString();

describe('shouldAutoSync', () => {
  it('sube cuando ha pasado el intervalo', () => {
    expect(shouldAutoSync(base())).toBe(true);
    expect(shouldAutoSync(base({ lastSyncAt: horasAtras(24) }))).toBe(true);
    expect(shouldAutoSync(base({ lastSyncAt: horasAtras(200) }))).toBe(true);
  });

  it('no sube si la última copia es reciente', () => {
    expect(shouldAutoSync(base({ lastSyncAt: horasAtras(1) }))).toBe(false);
    expect(shouldAutoSync(base({ lastSyncAt: horasAtras(23.9) }))).toBe(false);
  });

  it('respeta un intervalo distinto', () => {
    expect(shouldAutoSync(base({ lastSyncAt: horasAtras(2), minHours: 1 }))).toBe(true);
    expect(shouldAutoSync(base({ lastSyncAt: horasAtras(2), minHours: 6 }))).toBe(false);
  });

  it('no hace nada sin sesión', () => {
    expect(shouldAutoSync(base({ hasSession: false }))).toBe(false);
    expect(shouldAutoSync(base({ userId: null }))).toBe(false);
  });

  it('no se mete en medio del reconcile', () => {
    // El reconcile puede estar bajando datos; subir a la vez es pedir una carrera.
    expect(shouldAutoSync(base({ reconciling: true }))).toBe(false);
  });

  describe('propiedad de los datos (lo que protege la nube)', () => {
    it('no sube datos de otra cuenta', () => {
      expect(shouldAutoSync(base({ dataOwner: 'otro-usuario' }))).toBe(false);
    });

    it('no sube si no consta de quién son', () => {
      // Instalación nueva y vacía: subirla machacaría la copia buena con una vacía.
      expect(shouldAutoSync(base({ dataOwner: null }))).toBe(false);
    });
  });

  describe('marcas de tiempo raras', () => {
    it('sube si no hay marca de sincronización', () => {
      expect(shouldAutoSync(base({ lastSyncAt: null }))).toBe(true);
    });

    it('sube si la marca es ilegible, en vez de bloquearse para siempre', () => {
      expect(shouldAutoSync(base({ lastSyncAt: 'no-es-una-fecha' }))).toBe(true);
    });

    it('no sube si la marca está en el futuro', () => {
      // Reloj cambiado o copia traída de otro móvil: subir en cada arranque sería peor.
      expect(shouldAutoSync(base({ lastSyncAt: horasAtras(-5) }))).toBe(false);
    });
  });
});
