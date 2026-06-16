import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Brand } from '@/constants/theme';

interface Props {
  pct: number; // 0..100
  size?: number;
  strokeWidth?: number;
  color?: string;
  children?: ReactNode;
}

/** Anillo de progreso circular con contenido centrado. */
export function ProgressRing({ pct, size = 150, strokeWidth = 7, color = Brand.accent, children }: Props) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  const offset = c * (1 - clamped / 100);
  const center = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={center} cy={center} r={r} stroke={Brand.track} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={center}
          cy={center}
          r={r}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      <View style={{ alignItems: 'center' }}>{children}</View>
    </View>
  );
}
