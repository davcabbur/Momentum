import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GLOSSARY } from '@/education/glossary';
import { useThemedStyles, type Theme } from '@/ui/theme';

export function GlosarioScreen() {
  const styles = useThemedStyles(makeStyles);
  const [open, setOpen] = useState<string | null>(null);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.h1}>Glosario</Text>
      <Text style={styles.intro}>El lenguaje del entrenador, explicado fácil. Toca un término para ver qué significa.</Text>
      {GLOSSARY.map((t) => {
        const isOpen = open === t.key;
        return (
          <Pressable key={t.key} style={styles.card} onPress={() => setOpen(isOpen ? null : t.key)}>
            <View style={styles.row}>
              <Text style={styles.title}>{t.title}</Text>
              <Text style={styles.chevron}>{isOpen ? '–' : '+'}</Text>
            </View>
            {isOpen && <Text style={styles.body}>{t.body}</Text>}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.surface },
    content: { padding: 14, gap: 8 },
    h1: { color: c.text, fontSize: 20, fontWeight: '800' },
    intro: { color: c.textMuted, fontSize: 13, marginBottom: 4 },
    card: { backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 12, padding: 14 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { color: c.text, fontSize: 15, fontWeight: '700', flex: 1 },
    chevron: { color: c.accent, fontSize: 20, fontWeight: '700', marginLeft: 8 },
    body: { color: c.textMuted, fontSize: 13, marginTop: 8, lineHeight: 19 },
  });
