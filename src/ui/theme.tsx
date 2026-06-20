import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';

import { darkTheme, lightTheme, type Theme } from '@/constants/theme';
import { getSetting, setSetting } from '@/db/settings-repo';

export type { Theme } from '@/constants/theme';

/** Modo elegido por el usuario: 'system' sigue al móvil. */
export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  c: Theme;
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({ c: darkTheme, mode: 'system', setMode: () => {} });

const SETTING_KEY = 'theme_mode';

/**
 * Provee el tema activo. Por defecto sigue el tema del sistema (móvil); el usuario
 * puede forzar Claro/Oscuro/Automático en Ajustes (se guarda en la BD).
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme(); // 'light' | 'dark' | null
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    getSetting(SETTING_KEY).then((v) => {
      if (v === 'light' || v === 'dark' || v === 'system') setModeState(v);
    });
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    setSetting(SETTING_KEY, m);
  }, []);

  const effective = mode === 'system' ? system ?? 'dark' : mode;
  const c = effective === 'light' ? lightTheme : darkTheme;

  const value = useMemo(() => ({ c, mode, setMode }), [c, mode, setMode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

/**
 * Crea los estilos a partir del tema activo, memoizados. Define `makeStyles` a nivel de
 * módulo: `const makeStyles = (c: Theme) => StyleSheet.create({ ... c.surface ... })`.
 */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(factory: (c: Theme) => T): T {
  const { c } = useTheme();
  return useMemo(() => factory(c), [c, factory]);
}
