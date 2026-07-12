import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GLOSSARY, type GlossaryTerm } from '@/education/glossary';
import { useThemedStyles, type Theme } from '@/ui/theme';

/**
 * Ficha de glosario en bottom sheet. `term` admite una entrada de GLOSSARY o
 * una ficha ad hoc (p. ej. la combinada de tipos de serie).
 */
export function TermSheet({ term, visible, onClose }: { term: GlossaryTerm | null; visible: boolean; onClose: () => void }) {
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  if (!term) return null;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]} onPress={() => {}}>
          <Text style={styles.title}>{term.title}</Text>
          <Text style={styles.body}>{term.body}</Text>
          <Pressable
            style={styles.link}
            onPress={() => {
              onClose();
              router.push('/glosario');
            }}>
            <Text style={styles.linkTxt}>Ver glosario completo →</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

interface TerminoProps {
  /** Clave del término en GLOSSARY. */
  id: string;
  /** Texto visible; por defecto, el título de la ficha. */
  children?: string;
  style?: StyleProp<TextStyle>;
  /**
   * Si se pasa, delega la apertura (útil con useTermSheet). OBLIGATORIO cuando
   * este Termino va anidado dentro de un <Text>: sin onOpen monta un Modal
   * propio, y un Modal dentro de Text rompe en Android.
   */
  onOpen?: (t: GlossaryTerm) => void;
}

/** Término de entrenador tocable: subrayado punteado; al tocar abre su ficha. */
export function Termino({ id, children, style, onOpen }: TerminoProps) {
  const styles = useThemedStyles(makeStyles);
  const [open, setOpen] = useState(false);
  const term = GLOSSARY.find((g) => g.key === id) ?? null;
  const label = children ?? term?.title ?? id;
  if (!term) return <Text style={style}>{label}</Text>;
  if (onOpen) {
    return (
      <Text style={[style, styles.term]} suppressHighlighting onPress={() => onOpen(term)}>
        {label}
      </Text>
    );
  }
  return (
    <>
      <Text style={[style, styles.term]} suppressHighlighting onPress={() => setOpen(true)}>
        {label}
      </Text>
      <TermSheet term={term} visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

/** Estado + sheet listos para una pantalla: monta `sheet` una vez y llama a `openTerm`. */
export function useTermSheet() {
  const [term, setTerm] = useState<GlossaryTerm | null>(null);
  const openTerm = (idOrTerm: string | GlossaryTerm) => {
    setTerm(typeof idOrTerm === 'string' ? GLOSSARY.find((g) => g.key === idOrTerm) ?? null : idOrTerm);
  };
  const sheet = <TermSheet term={term} visible={term != null} onClose={() => setTerm(null)} />;
  return { openTerm, sheet };
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    // Backdrop '#0008': mismo patrón que SetLogSheet (excepción admitida al tema).
    backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0008' },
    sheet: { backgroundColor: c.card, padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
    title: { color: c.text, fontSize: 17, fontWeight: '800', marginBottom: 8 },
    body: { color: c.textMuted, fontSize: 14, lineHeight: 21 },
    link: { marginTop: 14, alignSelf: 'flex-start' },
    linkTxt: { color: c.accent, fontSize: 13, fontWeight: '700' },
    // En Android el punteado cae a subrayado sólido (limitación de RN); aceptado.
    term: { textDecorationLine: 'underline', textDecorationStyle: 'dotted', textDecorationColor: c.accent },
  });
