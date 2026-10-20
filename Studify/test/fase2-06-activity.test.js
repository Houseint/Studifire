import {
  minutesToLevel,
  buildActivityHeatmap,
  buildWeeklyActivity,
  buildHistoryDays,
} from '../src/shared/utils/activity';

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

describe('Histórico por período (buildHistoryDays)', () => {
  const now = new Date(2026, 8, 10, 12, 0, 0);
  const sessions = [
    {
      id: 1,
      subject_id: 1,
      subject_nome: 'Matemática',
      started_at: new Date(2026, 8, 10, 8, 0).toISOString(),
      duration_minutes: 50,
    },
    {
      id: 2,
      subject_id: 2,
      subject_nome: 'Biologia',
      started_at: new Date(2026, 8, 8, 10, 0).toISOString(),
      duration_minutes: 30,
    },
    {
      id: 3,
      subject_id: 3,
      subject_nome: 'História',
      started_at: new Date(2026, 8, 6, 10, 0).toISOString(),
      duration_minutes: 40,
    },
  ];
  const materias = [
    {
      id: 1,
      nome: 'Matemática',
      topicos: [
        {
          nome: 'Álgebra',
          estudado: true,
          completed_at: new Date(2026, 8, 10, 9, 30).toISOString(),
        },
      ],
    },
    {
      id: 2,
      nome: 'Biologia',
      topicos: [
        {
          nome: 'Células',
          estudado: true,
          completed_at: new Date(2026, 8, 8, 10, 30).toISOString(),
        },
      ],
    },
  ];

  test('hoje: um dia, só a atividade de hoje', () => {
    const dias = buildHistoryDays(sessions, materias, { period: 'hoje', now });
    expect(dias).toHaveLength(1);
    expect(dias[0]).toMatchObject({ key: '2026-09-10', isToday: true, totalMinutes: 50 });
    expect(dias[0].sessions.map((s) => s.subject_nome)).toEqual(['Matemática']);
    expect(dias[0].topics.map((t) => t.topicoNome)).toEqual(['Álgebra']);
  });

  test('semana: segunda a domingo, com tópicos e sem a semana anterior', () => {
    const dias = buildHistoryDays(sessions, materias, { period: 'semana', now });
    expect(dias.map((d) => d.key)).toEqual([
      '2026-09-07',
      '2026-09-08',
      '2026-09-09',
      '2026-09-10',
      '2026-09-11',
      '2026-09-12',
      '2026-09-13',
    ]);
    expect(dias[3].sessions.map((s) => s.subject_nome)).toEqual(['Matemática']);
    expect(dias[3].topics.map((t) => t.topicoNome)).toEqual(['Álgebra']);
    expect(dias[1].topics.map((t) => t.topicoNome)).toEqual(['Células']);
    expect(dias.flatMap((d) => d.sessions).some((s) => s.subject_nome === 'História')).toBe(false);
  });

  test('mês: do dia 1 até hoje', () => {
    const dias = buildHistoryDays(sessions, materias, { period: 'mes', now });
    expect(dias).toHaveLength(10);
    expect(dias[0].key).toBe('2026-09-01');
    expect(dias[9].key).toBe('2026-09-10');
    expect(dias[5].sessions.map((s) => s.subject_nome)).toEqual(['História']);
  });

  test('todos: apenas dias com atividade, mais recentes primeiro', () => {
    const dias = buildHistoryDays(sessions, materias, { period: 'todos', now });
    expect(dias.map((d) => d.key)).toEqual(['2026-09-10', '2026-09-08', '2026-09-06']);
  });
});
