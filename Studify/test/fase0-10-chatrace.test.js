import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';

jest.mock('../src/hooks/useUserId', () => ({
  useUserId: () => 1,
}));

jest.mock('../src/services/aiService', () => ({
  enviarMensagem: jest.fn().mockResolvedValue('resposta fake'),
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
  criarConversa,
} from '../src/services/subjectsDb';

const ChatScreen = require('../src/screens/ChatScreen').default;

function deferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const convA = { id: 1, titulo: 'Conversa A', created_at: '2026-01-01T00:00:00.000Z' };
const convB = { id: 2, titulo: 'Conversa B', created_at: '2026-01-01T00:01:00.000Z' };

beforeEach(() => {
  jest.clearAllMocks();
  listarConversas.mockResolvedValue([convA, convB]);
  criarConversa.mockResolvedValue({ id: 3, titulo: 'Nova conversa', created_at: new Date().toISOString() });
});

test('abrir/fechar rapidamente: carga antiga não sobrescreve conversa atual', async () => {
  const dA = deferred();
  const dB = deferred();
  carregarMensagens.mockImplementation((uid, cid) =>
    cid === 1 ? dA.promise : dB.promise
  );

  const screen = render(<ChatScreen navigation={{ goBack: jest.fn() }} />);

  await act(async () => {});
  await waitFor(() => {
    expect(carregarMensagens).toHaveBeenCalledWith(1, 1);
  });

  fireEvent.press(screen.getByText('Assistente IA'));
  await act(async () => {});
  fireEvent.press(screen.getByText('Conversa B'));
  await act(async () => {});

  expect(carregarMensagens).toHaveBeenCalledWith(1, 2);

  await act(async () => {
    dB.resolve([{ id: 21, role: 'assistant', content: 'mensagem da conversa B' }]);
  });
  await act(async () => {
    dA.resolve([{ id: 11, role: 'assistant', content: 'mensagem da conversa A' }]);
  });

  expect(screen.getByText('mensagem da conversa B')).toBeTruthy();
  expect(screen.queryByText('mensagem da conversa A')).toBeNull();
});

test('unmount durante carregamento não lança setState warning', async () => {
  const dA = deferred();
  carregarMensagens.mockImplementation(() => dA.promise);
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  const screen = render(<ChatScreen navigation={{ goBack: jest.fn() }} />);
  await act(async () => {});
  expect(carregarMensagens).toHaveBeenCalled();

  screen.unmount();

  await act(async () => {
    dA.resolve([{ id: 21, role: 'assistant', content: 'tarde demais' }]);
  });

  expect(errorSpy).not.toHaveBeenCalled();
  errorSpy.mockRestore();
});

test('sem conversas anteriores cria uma nova conversa', async () => {
  listarConversas.mockResolvedValue([]);
  const dC = deferred();
  carregarMensagens.mockImplementation(() => dC.promise);

  const screen = render(<ChatScreen navigation={{ goBack: jest.fn() }} />);
  await act(async () => {});

  expect(criarConversa).toHaveBeenCalledWith(1);
  await act(async () => {
    dC.resolve([]);
  });

  await waitFor(() => {
    expect(screen.getByText(/Olá! Sou seu assistente/)).toBeTruthy();
  });
});
