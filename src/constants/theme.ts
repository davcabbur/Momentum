/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

/**
 * Paleta de marca de Momentum (identidad de Claude Design). Dos temas (claro/oscuro)
 * con las mismas claves, para cambiar en caliente con `useTheme()`. Acento violeta-índigo
 * en ambos temas; verde/azul/ámbar/rojo solo para significado (progreso, info, aviso, error).
 *
 * Claves "surface" = tintes (cajas de info, chips activos, fondos de icono);
 * claves "on..." = texto sobre botones de color.
 */
export interface Theme {
  accent: string;
  accentStrong: string;
  accentSurface: string; // tinte de acento (chips/pills activos, fondos de icono)
  good: string;
  goodSurface: string;
  onGood: string; // texto sobre botones verdes
  info: string;
  infoSurface: string; // cajas informativas / bienvenida
  infoText: string; // texto dentro de infoSurface
  warn: string;
  bad: string;
  onAccent: string; // texto sobre botones de acento
  surface: string; // fondo de pantalla
  card: string;
  cardBorder: string;
  track: string; // fondo de barras de progreso
  text: string;
  textMuted: string;
  scheme: 'light' | 'dark';
}

export const darkTheme: Theme = {
  accent: '#8E80FF',
  accentStrong: '#6353EF',
  accentSurface: '#221F3D',
  good: '#36D17E',
  goodSurface: '#13241C',
  onGood: '#06240F',
  info: '#5B9BFF',
  infoSurface: '#16202E',
  infoText: '#B9C4D0',
  warn: '#F2B34F',
  bad: '#F87171',
  onAccent: '#FFFFFF',
  surface: '#0E0F13',
  card: '#181A20',
  cardBorder: '#2A2D37',
  track: '#23262F',
  text: '#F3F5F9',
  textMuted: '#969CAB',
  scheme: 'dark',
};

export const lightTheme: Theme = {
  accent: '#6353EF',
  accentStrong: '#4B39D6',
  accentSurface: '#ECEAFE',
  good: '#1E9E57',
  goodSurface: '#E5F5EC',
  onGood: '#FFFFFF',
  info: '#2563EB',
  infoSurface: '#E8F0FE',
  infoText: '#3A4654',
  warn: '#C2710C',
  bad: '#DC2626',
  onAccent: '#FFFFFF',
  surface: '#F6F7F9',
  card: '#FFFFFF',
  cardBorder: '#E6E8EF',
  track: '#E6E8EF',
  text: '#14161C',
  textMuted: '#5B616E',
  scheme: 'light',
};
