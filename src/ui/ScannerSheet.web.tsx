import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useThemedStyles, type Theme } from '@/ui/theme';

/**
 * Escáner de códigos de barras para web (Metro elige este archivo al compilar para web).
 *
 * No usa expo-camera: en web solo enciende su escáner para códigos 'qr' y por debajo trae
 * jsQR de un CDN, que además nuestras cabeceras COEP/CORP bloquean. Aquí se pide la cámara
 * con getUserMedia, se leen fotogramas a un canvas y se decodifican con zxing (JavaScript
 * puro, empaquetado con la app).
 *
 * Detalles del iPhone que no son opcionales:
 * - `playsInline`: sin él, Safari se lleva el vídeo a pantalla completa y tapa la app.
 * - `muted` + `autoPlay`: sin los dos, iOS no deja arrancar la reproducción solo.
 * - `facingMode: 'environment'`: la cámara de atrás, que es la que enfoca el envase.
 * - Hace falta HTTPS. En producción lo hay; en local, 127.0.0.1 también cuenta.
 */

interface Props {
  visible: boolean;
  onClose: () => void;
  onScanned: (barcode: string) => void;
}

/** Cada cuánto se intenta decodificar. 10/s es de sobra y deja respirar al móvil. */
const INTERVALO_MS = 100;

/** Tras este tiempo sin leer nada, se ofrece la salida por búsqueda en vez de insistir. */
const PISTA_MS = 12_000;

type Estado = 'pidiendo' | 'escaneando' | 'sin-permiso' | 'sin-camara' | 'sin-https';

export function ScannerSheet({ visible, onClose, onScanned }: Props) {
  const styles = useThemedStyles(makeStyles);
  const [estado, setEstado] = useState<Estado>('pidiendo');
  const [tardando, setTardando] = useState(false);

  const video = useRef<HTMLVideoElement | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pista = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Una sola lectura: sin esto, un código bien enfocado dispara varias veces seguidas.
  const entregado = useRef(false);

  const parar = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    if (pista.current) clearTimeout(pista.current);
    timer.current = null;
    pista.current = null;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  }, []);

  const cerrar = useCallback(() => {
    parar();
    onClose();
  }, [parar, onClose]);

  useEffect(() => {
    if (!visible) return;
    entregado.current = false;
    setTardando(false);
    setEstado('pidiendo');

    let vivo = true;
    const lienzo = document.createElement('canvas');
    const ctx = lienzo.getContext('2d', { willReadFrequently: true });
    // En diferido: el decodificador son ~460 KB y solo hacen falta si se abre el escáner.
    // Cargarlo arriba se los cobraría a cada arranque de la app, escanees o no.
    let decodificador: { decodificar: (rgba: Uint8ClampedArray, ancho: number, alto: number) => string | null } | null = null;
    import('@/ui/barcode-web')
      .then((m) => { if (vivo) decodificador = m.crearDecodificador(); })
      .catch(() => { if (vivo) setEstado('sin-camara'); });

    (async () => {
      if (!globalThis.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setEstado(globalThis.isSecureContext ? 'sin-camara' : 'sin-https');
        return;
      }
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (!vivo) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream.current = s;
        setEstado('escaneando');
        if (video.current) {
          video.current.srcObject = s;
          await video.current.play().catch(() => {
            /* iOS puede rechazarlo si aún no hay gesto; el autoPlay lo reintenta. */
          });
        }

        pista.current = setTimeout(() => vivo && setTardando(true), PISTA_MS);

        timer.current = setInterval(() => {
          const v = video.current;
          if (!v || !ctx || !decodificador || entregado.current || v.readyState < 2 || !v.videoWidth) return;

          // Se recorta la banda central: es donde el usuario pone el código, y decodificar
          // menos píxeles es bastante más rápido que hacerlo con el fotograma entero.
          const ancho = v.videoWidth;
          const alto = Math.max(1, Math.round(v.videoHeight * 0.45));
          const desdeY = Math.round((v.videoHeight - alto) / 2);
          lienzo.width = ancho;
          lienzo.height = alto;
          ctx.drawImage(v, 0, desdeY, ancho, alto, 0, 0, ancho, alto);

          const { data } = ctx.getImageData(0, 0, ancho, alto);
          const codigo = decodificador.decodificar(data, ancho, alto);
          if (codigo) {
            entregado.current = true;
            parar();
            onScanned(codigo);
          }
        }, INTERVALO_MS);
      } catch (e) {
        if (!vivo) return;
        const nombre = (e as { name?: string })?.name;
        setEstado(nombre === 'NotAllowedError' || nombre === 'SecurityError' ? 'sin-permiso' : 'sin-camara');
      }
    })();

    return () => {
      vivo = false;
      parar();
    };
  }, [visible, parar, onScanned]);

  if (!visible) return null;

  const AVISOS: Record<Exclude<Estado, 'escaneando' | 'pidiendo'>, string> = {
    'sin-permiso':
      'No me has dado permiso para la cámara. Puedes concederlo en los ajustes de Safari, o buscar el alimento por su nombre.',
    'sin-camara': 'No he podido abrir la cámara en este dispositivo. Busca el alimento por su nombre: encontrarás lo mismo.',
    'sin-https': 'La cámara solo funciona sobre una conexión segura. Busca el alimento por su nombre.',
  };

  if (estado !== 'escaneando' && estado !== 'pidiendo') {
    return (
      <Modal visible animationType="slide" onRequestClose={cerrar}>
        <View style={styles.screen}>
          <View style={styles.center}>
            <Text style={styles.msg}>{AVISOS[estado]}</Text>
            <Pressable style={styles.btn} onPress={cerrar}>
              <Text style={styles.btnTxt}>Buscar por nombre</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible animationType="slide" onRequestClose={cerrar}>
      <View style={styles.screen}>
        {/* Elemento del DOM a propósito: React Native Web no tiene <video>. */}
        <video
          ref={video}
          autoPlay
          muted
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover', backgroundColor: '#000' }}
        />
        <View style={styles.overlay} pointerEvents="none">
          <View style={styles.frame} />
          <Text style={styles.hint}>
            {estado === 'pidiendo' ? 'Abriendo la cámara…' : 'Apunta al código de barras'}
          </Text>
          {tardando && (
            <Text style={styles.slow}>
              Si no lo coge: acerca un poco más, busca luz, y que el código quede recto dentro del marco.
            </Text>
          )}
        </View>
        <Pressable style={styles.close} onPress={cerrar}>
          <Text style={styles.closeTxt}>Cerrar</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#000' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, gap: 14, backgroundColor: c.surface },
    msg: { color: c.text, fontSize: 15, textAlign: 'center', lineHeight: 21 },
    btn: { backgroundColor: c.accentStrong, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24 },
    btnTxt: { color: c.onAccent, fontWeight: '800' },
    overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
    frame: { width: '80%', height: 130, borderColor: '#fff', borderWidth: 2, borderRadius: 12, opacity: 0.85 },
    hint: { color: '#fff', marginTop: 16, fontWeight: '700' },
    slow: { color: '#fff', marginTop: 10, fontSize: 13, textAlign: 'center', lineHeight: 19, opacity: 0.85 },
    close: { position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: '#000a', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28 },
    closeTxt: { color: '#fff', fontWeight: '800' },
  });
