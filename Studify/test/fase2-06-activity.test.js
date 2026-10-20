import { minutesToLevel, buildActivityHeatmap, buildWeeklyActivity } from '../src/shared/utils/activity';

describe('Heatmap de atividade (últimos 7 dias)', () => {
  test('minutesToLevel: 0/10/20/45/90 → 0/1/2/3/4', () => {
    expect([0, 10, 20, 45, 90].map(minutesToLevel)).toEqual([0, 1, 2, 3, 4]);
  });

  test('soma minutos do mesmo dia e marca hoje por último', () => {
    const now = new Date('2026-09-10T12:00:00');
    const sessions = [
      { started_at: '2026-09-10T08:00:00', duration_minutes: 20 },
      { started_at: '2026-09-10T20:00:00', duration_minutes: 50 },
      { started_at: '2026-09-08T10:00:00', duration_minutes: 10 },
    ];
    const heat = buildActivityHeatmap(sessions, { now });
    expect(heat).toHaveLength(7);
    const today = heat[6];
    expect(today.isToday).toBe(true);
    expect(today.minutes).toBe(70);
    expect(today.level).toBe(4);
    expect(heat[4].minutes).toBe(10);
    expect(heat[4].level).toBe(1);
    expect(heat[0].minutes).toBe(0);
    expect(heat[0].level).toBe(0);
  });

  test('ignora sessão com data inválida e entrada vazia', () => {
    const heat = buildActivityHeatmap(
      [{ started_at: 'invalida', duration_minutes: 99 }],
      { now: new Date('2026-09-10T12:00:00') }
    );
    expect(heat.every((d) => d.minutes === 0)).toBe(true);
    expect(buildActivityHeatmap(null)).toHaveLength(7);
  });
});

describe('Atividade da semana (sessões + tópicos concluídos)', () => {
  test('agrupa por dia, deduplica e ignora o que está fora da semana', () => {
    const now = new Date('2026-09-10T12:00:00');
    const sessions = [
      { started_at: '2026-09-10T08:00:00', duration_minutes: 50, subject_nome: 'Matemática' },
      { started_at: '2026-09-10T19:00:00', duration_minutes: 20, subject_nome: 'Matemática' },
      { started_at: '2026-09-08T10:00:00', duration_minutes: 30, subject_nome: 'Biologia' },
      { started_at: '2026-09-06T10:00:00', duration_minutes: 40, subject_nome: 'História' },
    ];
    const materias = [
      {
        id: 1,
        nome: 'Matemática',
        topicos: [
          { nome: 'Álgebra', estudado: true, completed_at: '2026-09-10T09:30:00' },
          { nome: 'Álgebra', estudado: true, completed_at: '2026-09-10T09:30:00' },
          {
            nome: 'Geometria',
            estudado: true,
            due_date: '2026-09-13T12:00:00',
            difficulty: 2,
          },
          { nome: 'Trigonometria', estudado: true, completed_at: '2026-09-06T10:00:00' },
        ],
      },
      {
        id: 2,
        nome: 'Biologia',
        topicos: [{ nome: 'Células', estudado: true, completed_at: '2026-09-08T10:00:00' }],
      },
    ];

    const semana = buildWeeklyActivity(sessions, materias, { now });

    expect(semana[4].sessoes).toEqual(['Matemática']);
    expect(semana[4].topicos.map((t) => t.topicoNome)).toEqual(['Álgebra', 'Geometria']);
    expect(semana[2].sessoes).toEqual(['Biologia']);
    expect(semana[2].topicos.map((t) => t.topicoNome)).toEqual(['Células']);
    expect(semana[0]).toBeUndefined();
  });
});
