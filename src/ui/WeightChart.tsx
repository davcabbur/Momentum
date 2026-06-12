import Svg, { Circle, Line, Path } from 'react-native-svg';

import type { TrendPoint } from '@/bodyweight/trend';
import { Brand } from '@/constants/theme';

interface Props {
  points: TrendPoint[];
  goalKg?: number;
  width?: number;
  height?: number;
}

/**
 * Pesajes diarios (puntos grises) + tendencia suavizada (línea morada) +
 * línea de objetivo (verde discontinua). Se escala al min/max del conjunto.
 */
export function WeightChart({ points, goalKg, width = 300, height = 130 }: Props) {
  if (points.length === 0) return null;

  const values = points.flatMap((p) => [p.weightKg, p.trendKg]);
  if (goalKg != null) values.push(goalKg);
  const min = Math.min(...values) - 0.5;
  const max = Math.max(...values) + 0.5;
  const span = max - min || 1;

  const x = (i: number) => (i / Math.max(1, points.length - 1)) * width;
  const y = (w: number) => height - ((w - min) / span) * height;

  const trendPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.trendKg)}`).join(' ');

  return (
    <Svg width={width} height={height}>
      {goalKg != null && (
        <Line x1={0} y1={y(goalKg)} x2={width} y2={y(goalKg)} stroke={Brand.good} strokeDasharray="4 4" strokeWidth={1} />
      )}
      {points.map((p, i) => (
        <Circle key={i} cx={x(i)} cy={y(p.weightKg)} r={2.6} fill={Brand.textMuted} />
      ))}
      <Path d={trendPath} stroke={Brand.accent} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
