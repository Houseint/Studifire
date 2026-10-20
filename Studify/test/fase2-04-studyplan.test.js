import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { buildStudyQueue, buildWeeklyPlan } from '../src/shared/utils/studyPlan';
import StudyPlanCard from '../src/components/home/StudyPlanCard';

const NOW = new Date('2026-09-10T12:00:00.000Z'); // quinta

const materias = [
  {
    id: 1,
    nome: 'Mat',
    topicos: [
      { nome: 'Vencido', estudado: true, due_date: '2026-09-01T00:00:00.000Z' },
      { nome: 'Novo', estudado: false },
      { nome: 'Feito', estudado: true, due_date: '2026-12-31T00:00:00.000Z' },
    ],
  },
];

describe('2.3 - Planner semanal (card na Home)', () => {
  test('fila: revisão vencida antes de novo, novo antes de reforço', () => {
    const queue = buildStudyQueue(materias, NOW);
    expect(queue.map((q) => q.kind)).toEqual(['revisao', 'novo', 'reforco']);
    expect(queue.map((q) => q.materiaId)).toEqual([1, 1, 1]);
    expect(queue.map((q) => q.topicoIndex)).toEqual([0, 1, 2]);
  });

  test('plano: 7 dias, meta restante dividida, máx 3 itens/dia', () => {
    const plan = buildWeeklyPlan(materias, { goalMinutes: 300, currentMinutes: 90, now: NOW });
    expect(plan.days).toHaveLength(7);
    expect(plan.remainingMinutes).toBe(210);
    expect(plan.perDayMinutes).toBe(30); // ceil(210/7)
    expect(plan.totalItems).toBe(3);
    expect(plan.days[0].items).toHaveLength(3);
    expect(plan.days[0].weekday).toBe('Qui');
  });

  test('sem matérias: zero itens, meta intacta', () => {
    const plan = buildWeeklyPlan([], { goalMinutes: 300, currentMinutes: 0, now: NOW });
    expect(plan.totalItems).toBe(0);
    expect(plan.perDayMinutes).toBe(43); // ceil(300/7)
  });

  test('card: some quando não há itens', () => {
    const screen = render(<StudyPlanCard materias={[]} goalMinutes={300} currentMinutes={0} />);
    expect(screen.queryByText('PLANO DA SEMANA')).toBeNull();
  });

  test('card: mostra resumo e próximos dias com itens', () => {
    // congela o relógio na quinta do NOW → rótulo do dia estável ('Qui', sem depender do dia real)
    jest.useFakeTimers({ now: NOW });
    try {
      const screen = render(
        <StudyPlanCard materias={materias} goalMinutes={300} currentMinutes={90} />
      );
      expect(screen.getByText('PLANO DA SEMANA')).toBeTruthy();
      expect(screen.getByText('30 min/dia · 3 itens')).toBeTruthy();
      // legenda do dia: weekday + ícones SVG + nome de cada tópico (emojis → ícones)
      expect(screen.getByText('Qui ·')).toBeTruthy();
      expect(screen.getByText('Vencido')).toBeTruthy();
      expect(screen.getByText('Novo')).toBeTruthy();
      expect(screen.getByText('Feito')).toBeTruthy();
    } finally {
      jest.useRealTimers();
    }
  });

  test('card: seleciona um dia e mostra só a agenda dele', () => {
    jest.useFakeTimers({ now: NOW });
    try {
      const screen = render(
        <StudyPlanCard materias={materias} goalMinutes={300} currentMinutes={90} />
      );

      fireEvent.press(screen.getByLabelText('Dia Sex 11'));

      expect(screen.getByText('Sex ·')).toBeTruthy();
      expect(screen.getByText('Dia livre — descanse ou adiante um tópico.')).toBeTruthy();
      expect(screen.queryByText('Vencido')).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  test('card: tocar em um item abre a matéria designada', () => {
    jest.useFakeTimers({ now: NOW });
    try {
      const onItemPress = jest.fn();
      const screen = render(
        <StudyPlanCard
          materias={materias}
          goalMinutes={300}
          currentMinutes={90}
          onItemPress={onItemPress}
        />
      );

      fireEvent.press(screen.getAllByLabelText('Abrir Mat')[0]);

      expect(onItemPress).toHaveBeenCalledWith(1);
    } finally {
      jest.useRealTimers();
    }
  });
});
