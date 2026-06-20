import Svg, { Circle, Path } from 'react-native-svg';

import { useTheme } from '@/ui/theme';

interface Props {
  values: number[];
  width?: number;
  height?: number;
}

/** Línea simple escalada al min/max de los valores. Para progreso de 1RM/volumen. */
export function LineChart({ values, width = 300, height = 90 }: Props) {
  const { c } = useTheme();
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = 6;

  const x = (i: number) => pad + (i / (values.length - 1)) * (width - pad * 2);
  const y = (v: number) => height - pad - ((v - min) / span) * (height - pad * 2);

  const path = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(v)}`).join(' ');

  return (
    <Svg width={width} height={height}>
      <Path d={path} stroke={c.accent} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {values.map((v, i) => (
        <Circle key={i} cx={x(i)} cy={y(v)} r={2.6} fill={c.accent} />
      ))}
    </Svg>
  );
}
