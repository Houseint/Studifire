import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';

import { dark, light } from '../src/shared/theme/colors';
import { ThemeProvider } from '../src/shared/theme/ThemeContext';
import { getHelpStyles } from '../src/screens/HelpScreen';
import { getHistoricStyles } from '../src/screens/HistoricScreen';

jest.mock('../src/hooks/useUserId', () => ({
  useUserId: () => 1,
}));

jest.mock('../src/services/subjectsDb', () => ({
  carregarMaterias: jest.fn(),
  carregarHistorico: jest.fn(),
}));

const HelpScreen = require('../src/screens/HelpScreen').default;
const HistoricScreen = require('../src/screens/HistoricScreen').default;

describe('T7 — Ajuda + Histórico light: factories seguem a paleta', () => {
  test('ajuda: container/card/título/descrição seguem tokens (dark preservado, light claro)', () => {
    const d = getHelpStyles(dark);
    const l = getHelpStyles(light);
    expect(d.container.backgroundColor).toBe(dark.bg);
    expect(l.container.backgroundColor).toBe(light.bg);
    expect(d.secaoCard.backgroundColor).toBe(dark.card);
    expect(l.secaoCard.backgroundColor).toBe(light.card);
    expect(d.headerTitle.color).toBe(dark.text);
    expect(l.headerTitle.color).toBe(light.text);
    expect(d.metodoDesc.color).toBe(dark.textMuted);
    expect(l.metodoDesc.color).toBe(light.textMuted);
    expect(l.metodoItem.backgroundColor).toBe(light.card2);
    expect(d.linkItem.backgroundColor).toBe(dark.card2);
  });

  test('histórico: container/statCard/statLabel seguem tokens (dark preservado, light claro)', () => {
    const d = getHistoricStyles(dark);
    const l = getHistoricStyles(light);
    expect(d.container.backgroundColor).toBe(dark.bg);
    expect(l.container.backgroundColor).toBe(light.bg);
    expect(d.statCard.backgroundColor).toBe(dark.card);
    expect(l.statCard.backgroundColor).toBe(light.card);
    expect(d.statLabel.color).toBe(dark.textMuted);
    expect(l.statLabel.color).toBe(light.textMuted);
    expect(d.headerTitle.color).toBe(dark.text);
    expect(l.headerTitle.color).toBe(light.text);
  });

  test('HelpScreen renderiza no provider light sem crash', () => {
    const screen = render(
      <ThemeProvider initialMode="light">
        <HelpScreen navigation={{ goBack: () => {} }} />
      </ThemeProvider>
    );
    expect(screen.getByText('Ajuda nos Estudos')).toBeTruthy();
  });

  test('HistoricScreen renderiza no provider light sem crash', async () => {
    const { carregarMaterias, carregarHistorico } = require('../src/services/subjectsDb');
    carregarMaterias.mockResolvedValue([]);
    carregarHistorico.mockResolvedValue([]);
    const screen = render(
      <NavigationContainer>
        <ThemeProvider initialMode="light">
          <HistoricScreen navigation={{ goBack: () => {} }} />
        </ThemeProvider>
      </NavigationContainer>
    );
    await waitFor(() => {
      expect(screen.getByText('Histórico')).toBeTruthy();
    });
  });
});
