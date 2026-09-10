import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';

jest.mock('../src/hooks/useUserId', () => ({
  useUserId: () => 1,
}));

jest.mock('../src/services/subjectsDb', () => ({
  getMateriaById: jest.fn(),
  atualizarMateria: jest.fn(),
  registrarSessao: jest.fn(),
  carregarSessoesPorMateria: jest.fn(),
  registrarQuizAttempt: jest.fn(),
  carregarQuizAttempts: jest.fn(() => Promise.resolve([])),
  getSubjectGoal: jest.fn(() => Promise.resolve(null)),
  setSubjectGoal: jest.fn(),
  getSubjectWeekMinutes: jest.fn(() => Promise.resolve(0)),
}));

import {
  getMateriaById,
  registrarSessao,
  carregarSessoesPorMateria,
} from '../src/services/subjectsDb';

const DetailScreen = require('../src/screens/DetailScreen').default;

const materia = {
  id: 1,
  nome: 'Matemática',
  topicos: [{ nome: 'Álgebra', estudado: false }],
  fixada: false,
  created_at: '2026-01-01T00:00:00.000Z',
  accessed_at: '2026-01-01T00:00:00.000Z',
};

function renderScreen(navigation) {
  return render(
    <DetailScreen
      route={{ params: { id: 1 } }}
      navigation={navigation || { goBack: jest.fn() }}
    />
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  getMateriaById.mockResolvedValue(materia);
  carregarSessoesPorMateria.mockResolvedValue([]);
  registrarSessao.mockResolvedValue(undefined);
});

afterEach(() => {
  jest.useRealTimers();
});

test('inicia estudo, avança 65s e para: salva 1 minuto', async () => {
  const screen = renderScreen();
  await act(async () => {});

  fireEvent.press(screen.getByText('▶ Iniciar Estudos'));
  act(() => {
    jest.advanceTimersByTime(65000);
  });

  fireEvent.press(screen.getByText('⏹ Parar'));

  await waitFor(() => {
    expect(registrarSessao).toHaveBeenCalledWith(1, 1, 1);
  });
});

test('navegar para fora durante estudo limpa o interval e não salva sem consentimento', async () => {
  const screen = renderScreen();
  await act(async () => {});

  fireEvent.press(screen.getByText('▶ Iniciar Estudos'));
  act(() => {
    jest.advanceTimersByTime(30000);
  });

  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  fireEvent.press(screen.getByText('←'));

  expect(alertSpy).toHaveBeenCalled();
  const buttons = alertSpy.mock.calls[0][2];
  const sairSemSalvar = buttons.find((b) => b.text === 'Sair sem salvar');
  act(() => {
    sairSemSalvar.onPress();
  });

  expect(registrarSessao).not.toHaveBeenCalled();
  alertSpy.mockRestore();
});

test('após unmount o interval não continua atualizando estado', async () => {
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  const screen = renderScreen();
  await act(async () => {});

  fireEvent.press(screen.getByText('▶ Iniciar Estudos'));
  act(() => {
    jest.advanceTimersByTime(5000);
  });

  screen.unmount();

  act(() => {
    jest.advanceTimersByTime(30000);
  });

  expect(errorSpy).not.toHaveBeenCalled();
  expect(registrarSessao).not.toHaveBeenCalled();
  errorSpy.mockRestore();
});

test('opção "Salvar e sair" persiste o tempo parcial correto', async () => {
  const screen = renderScreen();
  await act(async () => {});

  fireEvent.press(screen.getByText('▶ Iniciar Estudos'));
  act(() => {
    jest.advanceTimersByTime(120000);
  });

  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  fireEvent.press(screen.getByText('←'));

  const buttons = alertSpy.mock.calls[0][2];
  const salvarESair = buttons.find((b) => b.text === 'Salvar e sair');
  await act(async () => {
    await salvarESair.onPress();
  });

  expect(registrarSessao).toHaveBeenCalledWith(1, 1, 2);
  alertSpy.mockRestore();
});

test('pausar limpa o interval: tempo não avança enquanto pausado', async () => {
  const screen = renderScreen();
  await act(async () => {});

  fireEvent.press(screen.getByText('▶ Iniciar Estudos'));
  act(() => {
    jest.advanceTimersByTime(10000);
  });

  fireEvent.press(screen.getByText('⏸ Pausar'));
  const displayPausado = screen.getByText('Pausado');
  expect(displayPausado).toBeTruthy();

  act(() => {
    jest.advanceTimersByTime(60000);
  });

  expect(screen.getByText('00:00:10')).toBeTruthy();

  fireEvent.press(screen.getByText('▶ Retomar'));
  act(() => {
    jest.advanceTimersByTime(10000);
  });

  expect(screen.getByText('00:00:20')).toBeTruthy();

  fireEvent.press(screen.getByText('⏹ Parar'));

  expect(registrarSessao).not.toHaveBeenCalled();
});
