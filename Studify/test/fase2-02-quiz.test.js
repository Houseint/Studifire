const mockOpenDatabaseAsync = jest.fn(() => Promise.resolve(null));

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: mockOpenDatabaseAsync,
}));

const { createMemoryDb } = require('./helpers/sqliteMemory');
const { aplicarResultadoQuiz } = require('../src/shared/utils/fsrs');

describe('2.2 - Quiz pós-sessão: FSRS reage ao resultado', () => {
  const now = new Date('2026-09-10T12:00:00.000Z');
  const base = [{ nome: 'Álgebra', estudado: false, difficulty: 2, reps: 0 }];

  test('errar tudo endurece o tópico (difficulty sobe, revisão chega antes)', () => {
    const { topicos, difficulty, score } = aplicarResultadoQuiz(base, 0, {
      total: 4,
      correct: 1,
      now,
    });
    expect(score).toBe(0.25);
    expect(difficulty).toBe(3);
    expect(topicos[0]).toMatchObject({ estudado: true, difficulty: 3, reps: 1 });
    expect(new Date(topicos[0].due_date).toISOString().slice(0, 10)).toBe('2026-09-17');
  });

  test('acertar quase tudo facilita (difficulty desce, revisão vai pra longe)', () => {
    const { topicos, difficulty, score } = aplicarResultadoQuiz(base, 0, {
      total: 5,
      correct: 4,
      now,
    });
    expect(score).toBe(0.8);
    expect(difficulty).toBe(1);
    expect(new Date(topicos[0].due_date).toISOString().slice(0, 10)).toBe('2026-09-11');
  });

  test('meio-termo mantém a dificuldade e só reagenda', () => {
    const { topicos, difficulty } = aplicarResultadoQuiz(base, 0, {
      total: 4,
      correct: 2,
      now,
    });
    expect(difficulty).toBe(2);
    expect(topicos[0]).toMatchObject({ estudado: true, difficulty: 2, reps: 1 });
    expect(topicos[0].due_date).toBeTruthy();
  });

  test('quiz vazio não muda nada', () => {
    const { topicos, score } = aplicarResultadoQuiz(base, 0, { total: 0, correct: 0, now });
    expect(score).toBe(0);
    expect(topicos).toEqual(base);
  });

  test('não muta o array original', () => {
    const copia = JSON.parse(JSON.stringify(base));
    aplicarResultadoQuiz(base, 0, { total: 3, correct: 3, now });
    expect(base).toEqual(copia);
  });
});

describe('2.2 - Quiz pós-sessão: persiste attempts no SQLite', () => {
  let subjectsDb;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.isolateModules(() => {
      subjectsDb = require('../src/services/subjectsDb');
    });
  });

  async function setupDb() {
    const memDb = await createMemoryDb();
    mockOpenDatabaseAsync.mockImplementation(async () => memDb);
    return memDb;
  }

  test('registrarQuizAttempt + carregarQuizAttempts (por matéria e geral)', async () => {
    await setupDb();
    const mat = await subjectsDb.criarMateria(1, 'Matemática', [
      { nome: 'Álgebra', estudado: false },
    ]);

    const tentativa = await subjectsDb.registrarQuizAttempt(1, {
      subject_id: mat.id,
      topic_index: 0,
      topic_nome: 'Álgebra',
      questions_total: 3,
      questions_correct: 2,
    });
    expect(tentativa).toMatchObject({
      user_id: 1,
      subject_id: mat.id,
      topic_index: 0,
      topic_nome: 'Álgebra',
      questions_total: 3,
      questions_correct: 2,
    });
    expect(tentativa.id).toBeTruthy();

    const daMateria = await subjectsDb.carregarQuizAttempts(1, mat.id);
    expect(daMateria).toHaveLength(1);
    expect(daMateria[0]).toMatchObject({ topic_nome: 'Álgebra', questions_correct: 2 });

    const geral = await subjectsDb.carregarQuizAttempts(1);
    expect(geral).toHaveLength(1);

    expect(await subjectsDb.carregarQuizAttempts(2)).toEqual([]);
  });
});

describe('2.2 - Quiz pós-sessão: gerarQuiz (IA)', () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_GROQ_API_KEY = 'chave-teste';
    global.fetch = jest.fn();
    jest.resetModules();
  });

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_GROQ_API_KEY;
    global.fetch.mockRestore();
  });

  const QUESTOES = {
    questoes: [
      {
        pergunta: 'Quanto é 2 + 2 na aritmética básica?',
        alternativas: ['3', '4', '5', '22'],
        correta: 1,
      },
      {
        pergunta: 'Qual é a raiz quadrada de 9?',
        alternativas: ['2', '3', '4', '9'],
        correta: 1,
      },
    ],
  };

  test('parseia JSON válido e limita pela qtd pedida', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: JSON.stringify(QUESTOES) } }] }),
    });
    const { gerarQuiz } = require('../src/services/aiService');
    const { questoes } = await gerarQuiz('Matemática', ['Álgebra'], { qtd: 1 });
    expect(questoes).toHaveLength(1);
    expect(questoes[0]).toMatchObject({
      pergunta: expect.stringContaining('2 + 2'),
      correta: 1,
    });
    expect(questoes[0].alternativas).toHaveLength(4);
  });

  test('descarta questão inválida (sem 4 alternativas)', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                questoes: [
                  { pergunta: 'Pergunta incompleta aqui?', alternativas: ['só uma'], correta: 0 },
                  QUESTOES.questoes[0],
                ],
              }),
            },
          },
        ],
      }),
    });
    const { gerarQuiz } = require('../src/services/aiService');
    const { questoes } = await gerarQuiz('Matemática', ['Álgebra']);
    expect(questoes).toHaveLength(1);
    expect(questoes[0].correta).toBe(1);
  });

  test('guards rejeitam entrada inválida sem chamar a API', async () => {
    const { gerarQuiz } = require('../src/services/aiService');
    await expect(gerarQuiz('M', ['Álgebra'])).rejects.toThrow('NOME_INVALIDO');
    await expect(gerarQuiz('Matemática', [])).rejects.toThrow('SEM_TOPICOS');
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
