import React from 'react';
import { render } from '@testing-library/react-native';
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
    expect(buildStudyQueue(materias, NOW).map((q) => q.kind)).toEqual([
      'revisao',
      'novo',
      'reforco',
    ]);
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
    const screen = render(
      <StudyPlanCard materias={materias} goalMinutes={300} currentMinutes={90} />
    );
    expect(screen.getByText('PLANO DA SEMANA')).toBeTruthy();
    expect(screen.getByText('30 min/dia · 3 itens')).toBeTruthy();
    expect(screen.getByText('Qui · ⏰ Vencido  🌱 Novo  🔁 Feito')).toBeTruthy();
  });
});
