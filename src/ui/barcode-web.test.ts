import { crearDecodificador } from './barcode-web';

/**
 * Codifica un EAN-13 según la norma y comprueba que el decodificador lo lee.
 *
 * Se genera el código aquí en vez de guardar imágenes: así el test comprueba el viaje
 * redondo completo —dígitos → barras → píxeles → dígitos— y no depende de ningún fichero.
 */

const L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
const G = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111'];
const R = ['1110010', '1100110', '1101100', '1000010', '1011100', '1001110', '1010000', '1000100', '1001000', '1110100'];
/** Qué tabla (L o G) usa cada una de las 6 primeras cifras, según el dígito inicial. */
const PARIDAD = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];

function barrasEan13(codigo: string): string {
  const d = codigo.split('').map(Number);
  const patron = PARIDAD[d[0]];
  let bits = '101'; // guarda inicial
  for (let i = 0; i < 6; i++) bits += (patron[i] === 'L' ? L : G)[d[i + 1]];
  bits += '01010'; // guarda central
  for (let i = 7; i < 13; i++) bits += R[d[i]];
  return bits + '101'; // guarda final
}

/** Pinta las barras como RGBA, con margen blanco a los lados (la "zona muda" del código). */
function pintarRgba(bits: string, escala = 3, alto = 80, margen = 30) {
  const ancho = margen * 2 + bits.length * escala;
  const rgba = new Uint8ClampedArray(ancho * alto * 4).fill(255);
  for (let y = 0; y < alto; y++) {
    for (let i = 0; i < bits.length; i++) {
      if (bits[i] !== '1') continue;
      for (let k = 0; k < escala; k++) {
        const p = (y * ancho + margen + i * escala + k) * 4;
        rgba[p] = rgba[p + 1] = rgba[p + 2] = 0;
      }
    }
  }
  return { rgba, ancho, alto };
}

const leer = (codigo: string, escala?: number) => {
  const { rgba, ancho, alto } = pintarRgba(barrasEan13(codigo), escala);
  return crearDecodificador().decodificar(rgba, ancho, alto);
};

describe('decodificador de códigos de barras (web)', () => {
  it('lee códigos EAN-13 reales', () => {
    // Nutella 400 g, Coca-Cola, y un código español cualquiera.
    expect(leer('3017620422003')).toBe('3017620422003');
    expect(leer('5449000000996')).toBe('5449000000996');
    expect(leer('8410000810004')).toBe('8410000810004');
  });

  it('lee con barras finas y con barras gruesas (distintas distancias a la cámara)', () => {
    expect(leer('3017620422003', 2)).toBe('3017620422003');
    expect(leer('3017620422003', 6)).toBe('3017620422003');
  });

  it('devuelve null en una imagen sin código, sin lanzar', () => {
    const ancho = 200;
    const alto = 80;
    // Blanco entero: no encontrar nada es lo normal en la mayoría de fotogramas.
    expect(crearDecodificador().decodificar(new Uint8ClampedArray(ancho * alto * 4).fill(255), ancho, alto)).toBeNull();
  });

  it('reutilizar el mismo decodificador no arrastra el resultado anterior', () => {
    // Si no se reseteara el lector entre fotogramas, el segundo podría devolver el primero.
    const d = crearDecodificador();
    const a = pintarRgba(barrasEan13('3017620422003'));
    expect(d.decodificar(a.rgba, a.ancho, a.alto)).toBe('3017620422003');

    const blanco = new Uint8ClampedArray(a.ancho * a.alto * 4).fill(255);
    expect(d.decodificar(blanco, a.ancho, a.alto)).toBeNull();

    const b = pintarRgba(barrasEan13('5449000000996'));
    expect(d.decodificar(b.rgba, b.ancho, b.alto)).toBe('5449000000996');
  });
});
