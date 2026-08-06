import React from 'react';
import { TextInput } from 'react-native';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';

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
}));

import {
  listarConversas,
  carregarMensagens,
  salvarMensagem,
  atualizarTituloConversa,
} from '../src/services/subjectsDb';
import { enviarMensagem } from '../src/services/aiService';

const ChatScreen = require('../src/screens/ChatScreen').default;

const convA = { id: 1, titulo: 'Conversa A', created_at: '2026-01-01T00:00:00.000Z' };

beforeEach(() => {
  jest.clearAllMocks();
  listarConversas.mockResolvedValue([convA]);
  carregarMensagens.mockResolvedValue([]);
  atualizarTituloConversa.mockResolvedValue(undefined);
  enviarMensagem.mockResolvedValue('resposta fake');
  salvarMensagem
    .mockResolvedValueOnce({ id: 11, conversation_id: 1, role: 'user', content: 'oi', created_at: '2026-01-01T00:00:00.000Z' })
    .mockResolvedValueOnce({ id: 12, conversation_id: 1, role: 'assistant', content: 'resposta fake', created_at: '2026-01-01T00:00:00.000Z' });
});

describe('ChatScreen — A5: salvarMensagem recebe userId (ownership)', () => {
  test('enviar mensagem passa userId antes da conversa em ambas chamadas', async () => {
    const screen = render(<ChatScreen navigation={{ goBack: jest.fn() }} />);
    await act(async () => {});
    await waitFor(() => {
      expect(carregarMensagens).toHaveBeenCalledWith(1, 1);
    });

    const input = screen.UNSAFE_getAllByType(TextInput).find((i) => i.props.placeholder === 'Digite sua dúvida...');
    fireEvent.changeText(input, 'oi');
    fireEvent.press(screen.getByText('↑'));

    await waitFor(() => {
      expect(salvarMensagem).toHaveBeenCalledWith(1, 1, 'user', 'oi');
    });
    await waitFor(() => {
      expect(salvarMensagem).toHaveBeenCalledWith(1, 1, 'assistant', 'resposta fake');
    });

    expect(enviarMensagem).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ role: 'user', text: 'oi' }),
    ]));
    expect(screen.getByText('oi')).toBeTruthy();
    expect(screen.getByText('resposta fake')).toBeTruthy();
  });

  test('primeira mensagem define o título da conversa', async () => {
    const screen = render(<ChatScreen navigation={{ goBack: jest.fn() }} />);
    await act(async () => {});
    await waitFor(() => {
      expect(carregarMensagens).toHaveBeenCalledWith(1, 1);
    });

    const input = screen.UNSAFE_getAllByType(TextInput).find((i) => i.props.placeholder === 'Digite sua dúvida...');
    fireEvent.changeText(input, 'como estudar cálculo?');
    fireEvent.press(screen.getByText('↑'));

    await waitFor(() => {
      expect(atualizarTituloConversa).toHaveBeenCalledWith(1, 1, 'como estudar cálculo?');
    });
  });
});
