import { useEffect, useState } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useThemedStyles, type Theme } from '@/ui/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onScanned: (barcode: string) => void;
}

/** Escáner de código de barras (cámara). Llama a onScanned una vez con el código. */
export function ScannerSheet({ visible, onClose, onScanned }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [handled, setHandled] = useState(false);
  const styles = useThemedStyles(makeStyles);

  useEffect(() => {
    if (visible) setHandled(false);
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={styles.screen}>
        {!permission?.granted ? (
          <View style={styles.center}>
            <Text style={styles.msg}>Necesito permiso para usar la cámara y escanear el código de barras.</Text>
            <Pressable style={styles.btn} onPress={requestPermission}>
              <Text style={styles.btnTxt}>Dar permiso</Text>
            </Pressable>
            <Pressable style={styles.linkBtn} onPress={onClose}>
              <Text style={styles.link}>Cancelar</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <CameraView
              style={styles.camera}
              barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
              onBarcodeScanned={
                handled
                  ? undefined
                  : (e) => {
                      setHandled(true);
                      onScanned(e.data);
                    }
              }
            />
            <View style={styles.overlay} pointerEvents="none">
              <View style={styles.frame} />
              <Text style={styles.hint}>Apunta al código de barras</Text>
            </View>
            <Pressable style={styles.close} onPress={onClose}>
              <Text style={styles.closeTxt}>Cerrar</Text>
            </Pressable>
          </>
        )}
      </View>
    </Modal>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#000' },
    camera: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, gap: 14, backgroundColor: c.surface },
    msg: { color: c.text, fontSize: 15, textAlign: 'center', lineHeight: 21 },
    btn: { backgroundColor: c.accentStrong, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24 },
    btnTxt: { color: c.onAccent, fontWeight: '800' },
    linkBtn: { padding: 8 },
    link: { color: c.textMuted },
    overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
    frame: { width: '70%', height: 140, borderColor: '#fff', borderWidth: 2, borderRadius: 12, opacity: 0.8 },
    hint: { color: '#fff', marginTop: 16, fontWeight: '700' },
    close: { position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: '#000a', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28 },
    closeTxt: { color: '#fff', fontWeight: '800' },
  });
