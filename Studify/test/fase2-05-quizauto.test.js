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
  carregarQuizAttempts: jest.fn(),
  getSubjectGoal: jest.fn(() => Promise.resolve(null)),
  setSubjectGoal: jest.fn(),
  getSubjectWeekMinutes: jest.fn(() => Promise.resolve(0)),
}));

jest.mock('../src/services/aiService', () => ({
  gerarTopicosComplementares: jest.fn(),
  gerarQuiz: jest.fn(),
}));

import {
  getMateriaById,
  atualizarMateria,
  registrarSessao,
  carregarSessoesPorMateria,
  registrarQuizAttempt,
  carregarQuizAttempts,
} from '../src/services/subjectsDb';
import { gerarQuiz } from '../src/services/aiService';

const DetailScreen = require('../src/screens/DetailScreen').default;

const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

const materia = {
  id: 1,
  nome: 'Matemática',
  topicos: [{ nome: 'Álgebra', estudado: false }],
  fixada: false,
  created_at: '2026-01-01T00:00:00.000Z',
  accessed_at: '2026-01-01T00:00:00.000Z',
};

const QUESTOES = [
  { pergunta: 'Quanto é 2+2?', alternativas: ['4', '3', '5', '6'], correta: 0 },
];

function renderScreen() {
  return render(
    <DetailScreen route={{ params: { id: 1 } }} navigation={{ goBack: jest.fn() }} />
  );
}

async function estudar60s(screen) {
  fireEvent.press(screen.getByText('▶ Iniciar Estudos'));
  act(() => {
    jest.advanceTimersByTime(60000);
  });
  fireEvent.press(screen.getByText('⏹ Parar'));
  await act(async () => {});
}

function ofertaQuizCalls() {
  return alertSpy.mock.calls.filter((c) => c[0] === 'Sessão salva! 🎉');
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  getMateriaById.mockResolvedValue(materia);
  carregarSessoesPorMateria.mockResolvedValue([]);
  registrarSessao.mockResolvedValue(undefined);
  atualizarMateria.mockResolvedValue(undefined);
  registrarQuizAttempt.mockResolvedValue({ id: 1 });
  carregarQuizAttempts.mockResolvedValue([]);
  gerarQuiz.mockResolvedValue({ questoes: QUESTOES, raw: '' });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('Quiz automático pós-sessão', () => {
  test('sessão de 1min oferece o quiz (sem abrir modal sozinho)', async () => {
    const screen = renderScreen();
    await act(async () => {});

    await estudar60s(screen);

    await waitFor(() => {
      expect(ofertaQuizCalls()).toHaveLength(1);
    });
    // Modal não abre sozinho: pergunta só aparece após aceitar.
    expect(screen.queryByText('Quanto é 2+2?')).toBeNull();
  });

  test('sessão curta (<1min) não oferece quiz', async () => {
    const screen = renderScreen();
    await act(async () => {});

    fireEvent.press(screen.getByText('▶ Iniciar Estudos'));
    act(() => {
      jest.advanceTimersByTime(30000);
    });
    fireEvent.press(screen.getByText('⏹ Parar'));
    await act(async () => {});

    expect(ofertaQuizCalls()).toHaveLength(0);
  });

  test('aceitar abre o quiz e salvar registra a tentativa', async () => {
    const screen = renderScreen();
    await act(async () => {});

    await estudar60s(screen);
    await waitFor(() => {
      expect(ofertaQuizCalls()).toHaveLength(1);
    });

    // Aceita a oferta: onPress do botão "Fazer quiz".
    const fazerQuiz = ofertaQuizCalls()[0][2].find((b) => b.text === 'Fazer quiz');
    await act(async () => {
      await fazerQuiz.onPress();
    });
    expect(screen.getByText('Quanto é 2+2?')).toBeTruthy();

    // Responde, vê resultado e salva.
    fireEvent.press(screen.getByText('4'));
    fireEvent.press(screen.getByText('Ver resultado'));
    fireEvent.press(screen.getByText('Salvar resultado'));
    await act(async () => {});
    expect(registrarQuizAttempt).toHaveBeenCalledTimes(1);
    expect(registrarQuizAttempt).toHaveBeenCalledWith(1, expect.objectContaining({
      subject_id: 1,
      questions_total: 1,
      questions_correct: 1,
    }));
  });

  test('nova sessão oferece de novo (start reseta a oferta)', async () => {
    const screen = renderScreen();
    await act(async () => {});

    await estudar60s(screen);
    await waitFor(() => {
      expect(ofertaQuizCalls()).toHaveLength(1);
    });

    await estudar60s(screen);
    await waitFor(() => {
      expect(ofertaQuizCalls()).toHaveLength(2);
    });
  });
});
