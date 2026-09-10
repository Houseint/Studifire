import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';

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

import { getMateriaById, carregarSessoesPorMateria, carregarQuizAttempts, getSubjectGoal, getSubjectWeekMinutes } from '../src/services/subjectsDb';

const DetailScreen = require('../src/screens/DetailScreen').default;

const materia = {
  id: 1,
  nome: 'Matemática',
  topicos: [{ nome: 'Álgebra', estudado: true }],
  fixada: false,
  created_at: '2026-01-01T00:00:00.000Z',
  accessed_at: '2026-01-01T00:00:00.000Z',
};

const ATTEMPTS = [
  { id: 2, topic_nome: 'Álgebra', questions_total: 4, questions_correct: 3, created_at: '2026-09-10T10:00:00.000Z' },
  { id: 1, topic_nome: 'Álgebra', questions_total: 4, questions_correct: 1, created_at: '2026-09-09T10:00:00.000Z' },
];

beforeEach(() => {
  jest.clearAllMocks();
  getMateriaById.mockResolvedValue(materia);
  carregarSessoesPorMateria.mockResolvedValue([]);
});

describe('Detail — histórico de quizzes', () => {
  test('mostra ÚLTIMOS QUIZZES com tópico e placar', async () => {
    carregarQuizAttempts.mockResolvedValue(ATTEMPTS);
    const screen = render(
      <DetailScreen route={{ params: { id: 1 } }} navigation={{ goBack: jest.fn() }} />
    );
    await act(async () => {});
    await waitFor(() => {
      expect(screen.getByText('ÚLTIMOS QUIZZES')).toBeTruthy();
    });
    expect(screen.getAllByText('3/4').length).toBeGreaterThan(0);
  });

  test('sem attempts a seção não aparece', async () => {
    carregarQuizAttempts.mockResolvedValue([]);
    const screen = render(
      <DetailScreen route={{ params: { id: 1 } }} navigation={{ goBack: jest.fn() }} />
    );
    await act(async () => {});
    expect(screen.queryByText('ÚLTIMOS QUIZZES')).toBeNull();
  });
});

describe('Detail — meta semanal da matéria', () => {
  test('sem meta mostra convite para definir', async () => {
    carregarQuizAttempts.mockResolvedValue([]);
    getSubjectGoal.mockResolvedValue(null);
    getSubjectWeekMinutes.mockResolvedValue(0);
    const screen = render(
      <DetailScreen route={{ params: { id: 1 } }} navigation={{ goBack: jest.fn() }} />
    );
    await act(async () => {});
    await waitFor(() => {
      expect(screen.getByText('META SEMANAL')).toBeTruthy();
    });
    expect(screen.getByText('Sem meta · toque para definir')).toBeTruthy();
  });

  test('com meta mostra progresso da semana', async () => {
    carregarQuizAttempts.mockResolvedValue([]);
    getSubjectGoal.mockResolvedValue(120);
    getSubjectWeekMinutes.mockResolvedValue(45);
    const screen = render(
      <DetailScreen route={{ params: { id: 1 } }} navigation={{ goBack: jest.fn() }} />
    );
    await act(async () => {});
    await waitFor(() => {
      expect(screen.getByText('45/120 min')).toBeTruthy();
    });
    expect(screen.getByText('38%')).toBeTruthy();
  });
});
