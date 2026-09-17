import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { getColors, THEME_MODES } from './colors';

const ThemeContext = createContext(null);

const darkFallback = {
  mode: THEME_MODES.DARK,
  colors: getColors(THEME_MODES.DARK),
  setMode: () => {},
  toggleMode: () => {},
  ready: true,
};

/**
 * Provedor de tema. `initialMode` vem do App (lido do SQLite no bootstrap,
 * com a splash cobrindo — sem flash). Telas usam `useTheme()` e reagem a `toggleMode`.
 * Fora do provider (testes, telas não migradas), `useTheme()` cai no fallback dark.
 */
export function ThemeProvider({ children, initialMode = THEME_MODES.DARK }) {
  const [mode, setModeState] = useState(
    initialMode === THEME_MODES.LIGHT ? THEME_MODES.LIGHT : THEME_MODES.DARK
  );

  const setMode = useCallback((next) => {
    setModeState(next === THEME_MODES.LIGHT ? THEME_MODES.LIGHT : THEME_MODES.DARK);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((prev) => (prev === THEME_MODES.DARK ? THEME_MODES.LIGHT : THEME_MODES.DARK));
  }, []);

  const value = useMemo(
    () => ({ mode, colors: getColors(mode), setMode, toggleMode, ready: true }),
    [mode, setMode, toggleMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext) ?? darkFallback;
}
