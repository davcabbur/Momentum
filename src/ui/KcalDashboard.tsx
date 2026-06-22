import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useTheme, useThemedStyles, type Theme } from '@/ui/theme';

const r0 = (n: number) => Math.round(n);

interface MacroProgress {
  goal: number;
  consumed: number;
}

interface Props {
  goalKcal: number;
  foodKcal: number; // kcal introducidas (alimentos)
  burnedKcal: number; // kcal quemadas (ejercicio, estimadas)
  protein: MacroProgress;
  carbs: MacroProgress;
  fat: MacroProgress;
}

/** Anillo de progreso con contenido centrado. */
function Ring({
  size,
  stroke,
  progress,
  color,
  track,
  children,
}: {
  size: number;
  stroke: number;
  progress: number;
  color: string;
  track: string;
  children: React.ReactNode;
}) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const p = Math.max(0, Math.min(1, progress));
  const len = p * circ;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={track} strokeWidth={stroke} fill="none" />
        {len > 0 && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${len} ${circ - len}`}
            strokeLinecap="round"
            rotation={-90}
            origin={`${size / 2}, ${size / 2}`}
          />
        )}
      </Svg>
      <View style={StyleSheet.absoluteFill}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>{children}</View>
      </View>
    </View>
  );
}

/** Dashboard deslizable: página 1 = calorías (restantes), página 2 = macros restantes. */
export function KcalDashboard({ goalKcal, foodKcal, burnedKcal, protein, carbs, fat }: Props) {
  const { c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);

  const pageW = width - 28; // el contenido de Nutrición tiene padding 14 a cada lado
  const remaining = r0(goalKcal - foodKcal + burnedKcal);
  const kcalProg = goalKcal + burnedKcal > 0 ? foodKcal / (goalKcal + burnedKcal) : 0;

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / pageW))}
        style={{ width: pageW }}
      >
        {/* Página 1 — Calorías */}
        <View style={[styles.page, { width: pageW }]}>
          <View style={styles.card}>
            <Text style={styles.title}>Calorías de hoy</Text>
            <View style={styles.kcalRow}>
              <Ring size={150} stroke={14} progress={kcalProg} color={c.good} track={c.track}>
                <Text style={[styles.bigNum, remaining < 0 && { color: c.bad }]}>{remaining}</Text>
                <Text style={styles.bigLbl}>kcal restantes</Text>
              </Ring>
              <View style={styles.legend}>
                <Legend icon="flag-outline" color={c.text} label="Total" value={r0(goalKcal)} />
                <Legend icon="restaurant-outline" color={c.accent} label="Alimentos" value={r0(foodKcal)} />
                <Legend icon="barbell-outline" color={c.info} label="Ejercicio" value={r0(burnedKcal)} />
              </View>
            </View>
            <Text style={styles.foot}>Restantes = Total − Alimentos + Ejercicio. El ejercicio se estima a partir de tus series.</Text>
          </View>
        </View>

        {/* Página 2 — Macros */}
        <View style={[styles.page, { width: pageW }]}>
          <View style={styles.card}>
            <Text style={styles.title}>Macros restantes</Text>
            <View style={styles.macroRow}>
              <MacroItem label="Proteínas" goal={protein.goal} consumed={protein.consumed} color={c.accent} track={c.track} />
              <MacroItem label="Carbos" goal={carbs.goal} consumed={carbs.consumed} color={c.info} track={c.track} />
              <MacroItem label="Grasas" goal={fat.goal} consumed={fat.consumed} color={c.warn} track={c.track} />
            </View>
            <Text style={styles.foot}>Gramos que te quedan para llegar a tu objetivo del día.</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.dots}>
        {[0, 1].map((i) => (
          <View key={i} style={[styles.dot, page === i && styles.dotOn]} />
        ))}
      </View>
    </View>
  );
}

function Legend({ icon, color, label, value }: { icon: keyof typeof Ionicons.glyphMap; color: string; label: string; value: number }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.legendRow}>
      <Ionicons name={icon} size={18} color={color} style={styles.legendIcon} />
      <Text style={styles.legendLbl}>{label}</Text>
      <Text style={styles.legendVal}>{value}</Text>
    </View>
  );
}

function MacroItem({ label, goal, consumed, color, track }: { label: string; goal: number; consumed: number; color: string; track: string }) {
  const styles = useThemedStyles(makeStyles);
  const remaining = r0(goal - consumed);
  const prog = goal > 0 ? consumed / goal : 0;
  return (
    <View style={styles.macroItem}>
      <Ring size={86} stroke={9} progress={prog} color={color} track={track}>
        <Text style={[styles.macroNum, remaining < 0 && { color }]}>{remaining}</Text>
        <Text style={styles.macroUnit}>g</Text>
      </Ring>
      <Text style={styles.macroLbl}>{label}</Text>
    </View>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    page: { paddingRight: 0 },
    card: { backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 16, padding: 16, gap: 12 },
    title: { color: c.textMuted, fontSize: 11, textTransform: 'uppercase', fontWeight: '700' },
    kcalRow: { flexDirection: 'row', alignItems: 'center', gap: 18 },
    bigNum: { color: c.text, fontSize: 34, fontWeight: '800' },
    bigLbl: { color: c.textMuted, fontSize: 12, marginTop: -2 },
    legend: { flex: 1, gap: 10 },
    legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    legendIcon: { width: 22, textAlign: 'center' },
    legendLbl: { color: c.textMuted, fontSize: 14, flex: 1 },
    legendVal: { color: c.text, fontSize: 16, fontWeight: '800' },
    macroRow: { flexDirection: 'row', justifyContent: 'space-around' },
    macroItem: { alignItems: 'center', gap: 8 },
    macroNum: { color: c.text, fontSize: 20, fontWeight: '800' },
    macroUnit: { color: c.textMuted, fontSize: 11, marginTop: -3 },
    macroLbl: { color: c.textMuted, fontSize: 12, fontWeight: '600' },
    foot: { color: c.textMuted, fontSize: 11, fontStyle: 'italic' },
    dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 8 },
    dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: c.track },
    dotOn: { backgroundColor: c.accent, width: 18 },
  });
