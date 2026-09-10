import React from 'react';
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
  atualizarMateria,
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
  atualizarMateria.mockResolvedValue(undefined);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('DetailScreen — A2: timer unificado sem refs', () => {
  test('UI fluida: display atualiza segundo a segundo', async () => {
    const screen = renderScreen();
    await act(async () => {});

    fireEvent.press(screen.getByText('▶ Iniciar Estudos'));
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(screen.getByText('00:00:05')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText('00:00:06')).toBeTruthy();
  });

  test('pausa não conta tempo e parar salva o total real (sem closure obsoleto)', async () => {
    const screen = renderScreen();
    await act(async () => {});

    fireEvent.press(screen.getByText('▶ Iniciar Estudos'));
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    fireEvent.press(screen.getByText('⏸ Pausar'));
    act(() => {
      jest.advanceTimersByTime(90000);
    });
    expect(screen.getByText('00:00:30')).toBeTruthy();

    fireEvent.press(screen.getByText('▶ Retomar'));
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    fireEvent.press(screen.getByText('⏹ Parar'));

    await waitFor(() => {
      expect(registrarSessao).toHaveBeenCalledWith(1, 1, 1);
    });
  });

  test('toggleTopico persiste e marca o checkbox', async () => {
    const screen = renderScreen();
    await act(async () => {});

    fireEvent.press(screen.getByText('Álgebra'));

    await waitFor(() => {
      // FASE 2.1 FSRS-lite: marcar feito agenda due_date (não quebra o check).
      expect(atualizarMateria).toHaveBeenCalledWith(1, 1, {
        topicos: [
          expect.objectContaining({ nome: 'Álgebra', estudado: true, difficulty: 2, reps: 1 }),
        ],
      });
    });
    await waitFor(() => {
      expect(screen.getByText('✓')).toBeTruthy();
    });
  });

  test('sem id na rota volta para a tela anterior', async () => {
    const goBack = jest.fn();
    render(
      <DetailScreen route={{ params: {} }} navigation={{ goBack }} />
    );
    expect(goBack).toHaveBeenCalled();
  });
});
