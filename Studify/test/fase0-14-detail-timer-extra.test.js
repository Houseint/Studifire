import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { TimerProvider } from '../src/shared/timer/TimerContext';

jest.mock('../src/hooks/useUserId', () => ({
  useUserId: () => 1,
}));

jest.mock('../src/services/aiService', () => ({
  gerarTopicosComplementares: jest.fn(),
  gerarTopicosDeMaterial: jest.fn(),
  gerarQuiz: jest.fn(),
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
import { gerarQuiz } from '../src/services/aiService';

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
    <TimerProvider>
      <DetailScreen
        route={{ params: { id: 1 } }}
        navigation={navigation || { goBack: jest.fn() }}
      />
    </TimerProvider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  getMateriaById.mockResolvedValue(materia);
  carregarSessoesPorMateria.mockResolvedValue([]);
  registrarSessao.mockResolvedValue(undefined);
  atualizarMateria.mockResolvedValue(undefined);
  gerarQuiz.mockResolvedValue({
    questoes: [{ pergunta: 'Quanto é 2+2?', alternativas: ['4', '3', '5', '6'], correta: 0 }],
  });
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
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

  test('sem tempo mínimo: avisa e não conclui o tópico', async () => {
    const screen = renderScreen();
    await act(async () => {});

    fireEvent.press(screen.getByText('Álgebra'));

    await waitFor(() => {
      expect(screen.getByText('Tempo mínimo não atingido')).toBeTruthy();
      expect(screen.getByText(/Estude pelo menos 10 min/)).toBeTruthy();
    });
    expect(atualizarMateria).not.toHaveBeenCalled();
    expect(gerarQuiz).not.toHaveBeenCalled();
  });

  test('com 10 min registrados: abre mini quiz antes de concluir', async () => {
    const hoje = new Date().toISOString();
    carregarSessoesPorMateria.mockResolvedValue([
      { started_at: hoje, duration_minutes: 12 },
    ]);
    const screen = renderScreen();
    await act(async () => {});

    fireEvent.press(screen.getByText('Álgebra'));

    await waitFor(() => {
      expect(gerarQuiz).toHaveBeenCalledWith('Matemática', ['Álgebra'], { qtd: 2 });
    });
    await waitFor(() => {
      expect(screen.getByText('Quanto é 2+2?')).toBeTruthy();
    });
    // Ainda não concluiu: só marca depois de acertar 60% no quiz.
    expect(atualizarMateria).not.toHaveBeenCalled();
  });

  test('sem id na rota volta para a tela anterior', async () => {
    const goBack = jest.fn();
    render(
      <DetailScreen route={{ params: {} }} navigation={{ goBack }} />
    );
    expect(goBack).toHaveBeenCalled();
  });
});
