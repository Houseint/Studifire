import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { dark, light, getColors, THEME_MODES } from '../src/shared/theme/colors';
import { ThemeProvider, useTheme } from '../src/shared/theme/ThemeContext';

describe('Tema: paletas dark/light', () => {
  test('dark e light têm exatamente as mesmas chaves', () => {
    expect(Object.keys(light).sort()).toEqual(Object.keys(dark).sort());
  });

  test('dark é o visual atual (fundo quase preto, texto quase branco)', () => {
    expect(dark.bg).toBe('#0a0f1e');
    expect(dark.text).toBe('#F4F6FF');
    expect(dark.statusBar).toBe('light-content');
  });

  test('light é claro (fundo cinza-azulado, card branco, texto marinho)', () => {
    expect(light.text).toBe('#141B33');
    expect(light.card).toBe('#FFFFFF');
    expect(light.statusBar).toBe('dark-content');
  });

  test('getColors: light só com "light", resto cai em dark', () => {
    expect(getColors('light')).toBe(light);
    expect(getColors('dark')).toBe(dark);
    expect(getColors(undefined)).toBe(dark);
    expect(getColors('rosa-choque')).toBe(dark);
  });
});

function Probe() {
  const { mode, colors, toggleMode } = useTheme();
  return (
    <>
      <Text testID="mode">{mode}</Text>
      <Text testID="bg">{colors.bg}</Text>
      <TouchableOpacity testID="toggle" onPress={toggleMode}>
        <Text>trocar</Text>
      </TouchableOpacity>
    </>
  );
}

describe('Tema: ThemeProvider + useTheme', () => {
  test('default é dark', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );
    expect(getByTestId('mode').props.children).toBe('dark');
    expect(getByTestId('bg').props.children).toBe(dark.bg);
  });

  test('initialMode="light" começa claro', () => {
    const { getByTestId } = render(
      <ThemeProvider initialMode="light">
        <Probe />
      </ThemeProvider>
    );
    expect(getByTestId('mode').props.children).toBe('light');
  });

  test('toggleMode alterna dark<->light e troca as cores', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );
    fireEvent.press(getByTestId('toggle'));
    expect(getByTestId('mode').props.children).toBe('light');
    expect(getByTestId('bg').props.children).toBe(light.bg);
    fireEvent.press(getByTestId('toggle'));
    expect(getByTestId('mode').props.children).toBe('dark');
  });

  test('useTheme fora do provider cai no fallback dark (telas não migradas não quebram)', () => {
    const { getByTestId } = render(<Probe />);
    expect(getByTestId('mode').props.children).toBe('dark');
  });
});
