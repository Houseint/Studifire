/**
 * Studify - Paletas dark/light.
 * Puro e testável. Dark é o default (modo atual do app, nada muda até o usuário ligar o light).
 * Light: fundo cinza-azulado claro, cards brancos, texto azul-marinho, mesmo roxo do app.
 */

export const THEME_MODES = { DARK: 'dark', LIGHT: 'light' };

export const dark = {
  mode: 'dark',
  bg: '#0a0f1e',
  bgGradient: ['#0a0f1e', '#0d1a2e', '#0a1520'],
  card: '#111832',
  card2: '#1B2545',
  border: '#27315B',
  borderStrong: '#303E70',
  text: '#F4F6FF',
  textSecondary: '#C0CAE8',
  textMuted: '#7F8AB7',
  accent: '#8A68FF',
  accentStrong: '#6F52FF',
  danger: '#EF4444',
  success: '#4CAF50',
  warn: '#FFAA00',
  statusBar: 'light-content',
};

export const light = {
  mode: 'light',
  bg: '#F2F4FA',
  bgGradient: ['#FFFFFF', '#E9EDF7', '#DDE4F2'],
  card: '#FFFFFF',
  card2: '#E9EDF7',
  border: '#D4DBEC',
  borderStrong: '#B9C3DA',
  text: '#141B33',
  textSecondary: '#3D4A6B',
  textMuted: '#6B7694',
  accent: '#6F52FF',
  accentStrong: '#6F52FF',
  danger: '#EF4444',
  success: '#4CAF50',
  warn: '#FFAA00',
  statusBar: 'dark-content',
};

/** Retorna a paleta do modo; qualquer valor inválido cai em dark. */
export function getColors(mode) {
  return mode === THEME_MODES.LIGHT ? light : dark;
}
