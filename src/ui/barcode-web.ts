import {
  BarcodeFormat,
  BinaryBitmap,
  DecodeHintType,
  HybridBinarizer,
  MultiFormatOneDReader,
  RGBLuminanceSource,
} from '@zxing/library';

/**
 * Decodificador de códigos de barras para web, aparte de la UI para poder probarlo solo.
 *
 * Se usa el núcleo de @zxing/library y no su envoltorio de navegador, ni expo-camera: en web
 * expo-camera solo enciende su escáner si se le piden códigos 'qr', y por debajo trae jsQR
 * desde un CDN — que además nuestras cabeceras COEP/CORP bloquean. Ver ScannerSheet.tsx.
 *
 * @zxing/library es JavaScript puro, sin WebAssembly y sin descargar nada: eso es
 * justamente por lo que se eligió frente a zxing-wasm, que va a buscar su .wasm a un CDN.
 */

/** Solo códigos de producto. Restringirlo acelera y evita lecturas falsas. */
const FORMATOS = [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E];

/**
 * Lector de códigos de UNA dimensión, no el multiformato general.
 *
 * `MultiFormatReader` arrastra además los lectores de QR, DataMatrix, PDF417 y Aztec, que
 * son la mayor parte del peso y aquí no se usan: un alimento lleva un código de barras de
 * toda la vida. Con el de 1D el bundle baja bastante y decodifica igual.
 */
function crearLector(): MultiFormatOneDReader {
  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, FORMATOS);
  // Merece la pena: la cámara de un móvil da fotogramas con reflejos y algo de desenfoque.
  hints.set(DecodeHintType.TRY_HARDER, true);
  return new MultiFormatOneDReader(hints);
}

/** Convierte RGBA a luminancia (un byte por píxel), que es lo que espera zxing. */
function aLuminancia(rgba: Uint8ClampedArray, pixeles: number): Uint8ClampedArray {
  const lum = new Uint8ClampedArray(pixeles);
  for (let i = 0; i < pixeles; i++) {
    const p = i * 4;
    // Pesos de luminancia percibida (Rec. 601): el verde manda, el azul casi no cuenta.
    lum[i] = (rgba[p] * 299 + rgba[p + 1] * 587 + rgba[p + 2] * 114) / 1000;
  }
  return lum;
}

export interface Decodificador {
  /** Devuelve el código si lo encuentra en el fotograma, o null si no hay ninguno. */
  decodificar(rgba: Uint8ClampedArray, ancho: number, alto: number): string | null;
}

export function crearDecodificador(): Decodificador {
  const lector = crearLector();
  return {
    decodificar(rgba, ancho, alto) {
      const lum = aLuminancia(rgba, ancho * alto);
      const bitmap = new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(lum, ancho, alto)));
      try {
        const resultado = lector.decode(bitmap);
        const texto = resultado.getText()?.trim();
        // Un código de producto es solo dígitos. Si sale otra cosa, no es lo que buscamos.
        return texto && /^\d{8,14}$/.test(texto) ? texto : null;
      } catch {
        // No encontrar nada es lo normal en la mayoría de fotogramas, no un error.
        return null;
      } finally {
        // Sin esto, el lector arrastra estado del fotograma anterior entre llamadas.
        lector.reset();
      }
    },
  };
}
