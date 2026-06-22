import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useTheme, useThemedStyles, type Theme } from '@/ui/theme';

const r0 = (n: number) => Math.round(n);
const g1 = (n: number) => (Math.round(n * 10) / 10).toString().replace('.', ',');

/** Dashboard de una ración: anillo con las kcal en el centro y los 3 macros con % y gramos. */
export function MacroRing({ kcal, protein, carbs, fat }: { kcal: number; protein: number; carbs: number; fat: number }) {
  const { c } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const size = 120;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;

  const cK = carbs * 4;
  const fK = fat * 9;
  const pK = protein * 4;
  const total = cK + fK + pK || 1;
  const segs = [
    { frac: cK / total, color: c.info },
    { frac: fK / total, color: c.warn },
    { frac: pK / total, color: c.accent },
  ];
  let acc = 0;

  return (
    <View style={styles.wrap}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={radius} stroke={c.track} strokeWidth={stroke} fill="none" />
          {segs.map((s, i) => {
            const len = s.frac * circ;
            const dashoffset = -acc * circ;
            acc += s.frac;
            if (len <= 0) return null;
            return (
              <Circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={s.color}
                strokeWidth={stroke}
                fill="none"
                strokeDasharray={`${len} ${circ - len}`}
                strokeDashoffset={dashoffset}
                strokeLinecap="butt"
                rotation={-90}
                origin={`${size / 2}, ${size / 2}`}
              />
            );
          })}
        </Svg>
        <View style={styles.center}>
          <Text style={styles.kcal}>{r0(kcal)}</Text>
          <Text style={styles.kcalLbl}>cal</Text>
        </View>
      </View>

      <View style={styles.stats}>
        <Stat pct={Math.round((cK / total) * 100)} grams={carbs} label="Carbohidratos" color={c.info} />
        <Stat pct={Math.round((fK / total) * 100)} grams={fat} label="Grasas" color={c.warn} />
        <Stat pct={Math.round((pK / total) * 100)} grams={protein} label="Proteínas" color={c.accent} />
      </View>
    </View>
  );
}

function Stat({ pct, grams, label, color }: { pct: number; grams: number; label: string; color: string }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.stat}>
      <Text style={[styles.statPct, { color }]}>{pct} %</Text>
      <Text style={styles.statG}>{g1(grams)} g</Text>
      <Text style={styles.statLbl}>{label}</Text>
    </View>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    wrap: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
    kcal: { color: c.text, fontSize: 30, fontWeight: '800' },
    kcalLbl: { color: c.textMuted, fontSize: 13, marginTop: -2 },
    stats: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
    stat: { alignItems: 'center', flex: 1 },
    statPct: { fontSize: 13, fontWeight: '800' },
    statG: { color: c.text, fontSize: 17, fontWeight: '800', marginTop: 2 },
    statLbl: { color: c.textMuted, fontSize: 11, marginTop: 2, textAlign: 'center' },
  });
