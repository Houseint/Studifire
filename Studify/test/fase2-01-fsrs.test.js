import {
  FSRS_INTERVALS,
  clampDifficulty,
  calcDueDate,
  isTopicDue,
  toggleTopicoWithFsrs,
  getDueTopics,
} from '../src/shared/utils/fsrs';
import { getNextStep } from '../src/components/home/SmartNextSteps';

describe('2.1 - FSRS-lite (memória inteligente)', () => {
  test('intervalos por dificuldade: 1/2/3/4 → 1/3/7/14 dias', () => {
    expect(FSRS_INTERVALS).toEqual({ 1: 1, 2: 3, 3: 7, 4: 14 });
  });

  test('clampDifficulty: inválido vira 2, limites 1-4', () => {
    expect(clampDifficulty(undefined)).toBe(2);
    expect(clampDifficulty(0)).toBe(1);
    expect(clampDifficulty(99)).toBe(4);
    expect(clampDifficulty(3)).toBe(3);
  });

  test('calcDueDate: dificuldade 2 a partir de data fixa soma 3 dias', () => {
    const iso = calcDueDate(2, new Date('2026-09-01T12:00:00.000Z'));
    expect(new Date(iso).toISOString().slice(0, 10)).toBe('2026-09-04');
  });

  test('formato antigo sem due_date nunca vence (zero breaking)', () => {
    expect(isTopicDue({ nome: 'X', estudado: true })).toBe(false);
    expect(isTopicDue({ nome: 'X', estudado: false }, new Date())).toBe(false);
  });

  test('toggle: marcar feito agenda due_date; desmarcar limpa', () => {
    const now = new Date('2026-09-10T12:00:00.000Z');
    const marcados = toggleTopicoWithFsrs([{ nome: 'Álgebra', estudado: false }], 0, { now });
    expect(marcados[0].estudado).toBe(true);
    expect(marcados[0].difficulty).toBe(2);
    expect(marcados[0].reps).toBe(1);
    expect(marcados[0].due_date).toBeTruthy();

    const desmarcados = toggleTopicoWithFsrs(marcados, 0, { now });
    expect(desmarcados[0].estudado).toBe(false);
    expect(desmarcados[0].due_date).toBeNull();
  });

  test('getDueTopics: só lista estudado + vencido', () => {
    const materias = [
      {
        id: 1,
        nome: 'Mat',
        topicos: [
          { nome: 'A', estudado: true, due_date: '2026-09-01T00:00:00.000Z' },
          { nome: 'B', estudado: true, due_date: '2026-12-31T00:00:00.000Z' },
          { nome: 'C', estudado: false },
        ],
      },
    ];
    const due = getDueTopics(materias, new Date('2026-09-10T12:00:00.000Z'));
    expect(due.map((d) => d.topicoNome)).toEqual(['A']);
  });

  test('SmartNextSteps prioriza a revisão vencida', () => {
    const step = getNextStep({
      streak: 3,
      materias: [
        {
          nome: 'Mat',
          topicos: [{ nome: 'Bhaskara', estudado: true, due_date: '2026-09-01T00:00:00.000Z' }],
        },
      ],
      weeklyPercent: 10,
      weeklyRemaining: 50,
    });
    expect(step.emoji).toBe('⏰');
    expect(step.text).toMatch('Bhaskara');
  });

  test('SmartNextSteps sem vencido mantém comportamento antigo', () => {
    const step = getNextStep({ streak: 0, materias: [{ nome: 'Mat', topicos: [] }] });
    expect(step.text).toMatch('streak');
  });
});
