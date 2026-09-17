import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { getChatStyles } from '../src/screens/ChatScreen';
import { getProgressScreenStyles } from '../src/styles/screens/ProgressScreenStyles';
import { light, dark } from '../src/shared/theme/colors';
import { ThemeProvider } from '../src/shared/theme/ThemeContext';

jest.mock('../src/hooks/useUserId', () => ({
  useUserId: () => 1,
}));

jest.mock('../src/services/aiService', () => ({
  enviarMensagem: jest.fn(),
}));

jest.mock('../src/services/subjectsDb', () => ({
  criarConversa: jest.fn(),
  listarConversas: jest.fn(),
  getConversa: jest.fn(),
  atualizarTituloConversa: jest.fn(),
  deletarConversa: jest.fn(),
  salvarMensagem: jest.fn(),
  carregarMensagens: jest.fn(),
  limparConversasAntigas: jest.fn(),
  carregarMaterias: jest.fn(),
  carregarHistorico: jest.fn(),
}));

import { listarConversas, carregarMensagens } from '../src/services/subjectsDb';

const ChatScreen = require('../src/screens/ChatScreen').default;
const ProgressScreen = require('../src/screens/ProgressScreen').default;

describe('T6 — Chat + Progresso light: factories seguem a paleta', () => {
  test('chat: card/input/bot seguem tokens (dark preservado, light claro)', () => {
    expect(getChatStyles(dark).container.backgroundColor).toBe(dark.bg);
    expect(getChatStyles(light).container.backgroundColor).toBe(light.bg);
    expect(getChatStyles(light).bolhaContent.backgroundColor).toBe(light.card);
    expect(getChatStyles(light).bolhaTextoBot.color).toBe(light.text);
    expect(getChatStyles(light).input.backgroundColor).toBe(light.card2);
  });

  test('progresso: cards/gráfico seguem tokens (dark preservado, light claro)', () => {
    expect(getProgressScreenStyles(dark).statCard.backgroundColor).toBe(dark.card);
    expect(getProgressScreenStyles(light).statCard.backgroundColor).toBe(light.card);
    expect(getProgressScreenStyles(light).headerTitle.color).toBe(light.text);
    expect(getProgressScreenStyles(light).streakValue.color).toBe(light.warn);
    expect(getProgressScreenStyles(light).progressBarContainer.backgroundColor).not.toBe(
      getProgressScreenStyles(dark).progressBarContainer.backgroundColor
    );
  });

  test('ChatScreen renderiza no provider light sem crash', async () => {
    const { criarConversa } = require('../src/services/subjectsDb');
    listarConversas.mockResolvedValue([{ id: 1, titulo: 'C', created_at: '2026-01-01T00:00:00.000Z' }]);
    carregarMensagens.mockResolvedValue([]);
    criarConversa.mockResolvedValue({ id: 1 });
    const screen = render(
      <ThemeProvider initialMode="light">
        <ChatScreen navigation={{ goBack: jest.fn() }} />
      </ThemeProvider>
    );
    await waitFor(() => {
      expect(screen.getByText('Assistente IA')).toBeTruthy();
    });
  });

  test('ProgressScreen renderiza no provider light sem crash', async () => {
    const { carregarMaterias, carregarHistorico } = require('../src/services/subjectsDb');
    carregarMaterias.mockResolvedValue([]);
    carregarHistorico.mockResolvedValue([]);
    const screen = render(
      <NavigationContainer>
        <ThemeProvider initialMode="light">
          <ProgressScreen navigation={{ goBack: jest.fn(), navigate: jest.fn() }} />
        </ThemeProvider>
      </NavigationContainer>
    );
    await waitFor(() => {
      expect(screen.getByText('Progresso')).toBeTruthy();
    });
  });
});
