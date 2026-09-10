const mockOpenDatabaseAsync = jest.fn(() => Promise.resolve(null));

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: mockOpenDatabaseAsync,
}));

const { createMemoryDb } = require('./helpers/sqliteMemory');

describe('Passo 3 - Metas por matéria: subject_goals no SQLite', () => {
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

  test('sem meta retorna null; set/get/upsert/desligar', async () => {
    await setupDb();
    const mat = await subjectsDb.criarMateria(1, 'Física', []);

    expect(await subjectsDb.getSubjectGoal(1, mat.id)).toBeNull();

    expect(await subjectsDb.setSubjectGoal(1, mat.id, 120)).toBe(120);
    expect(await subjectsDb.getSubjectGoal(1, mat.id)).toBe(120);

    // upsert: trocar o valor não duplica
    expect(await subjectsDb.setSubjectGoal(1, mat.id, 60)).toBe(60);
    expect(await subjectsDb.getSubjectGoal(1, mat.id)).toBe(60);

    // 0 desliga (remove)
    expect(await subjectsDb.setSubjectGoal(1, mat.id, 0)).toBeNull();
    expect(await subjectsDb.getSubjectGoal(1, mat.id)).toBeNull();
  });

  test('getSubjectWeekMinutes soma só as sessões desta semana', async () => {
    const memDb = await setupDb();
    const mat = await subjectsDb.criarMateria(1, 'Química', []);

    await subjectsDb.registrarSessao(1, mat.id, 10);
    await subjectsDb.registrarSessao(1, mat.id, 20);
    expect(await subjectsDb.getSubjectWeekMinutes(1, mat.id)).toBe(30);

    // sessão antiga (mês passado) não entra na conta
    await memDb.runAsync(
      "INSERT INTO sessions (subject_id, user_id, duration_minutes, started_at) VALUES (?, ?, ?, '2020-01-05T12:00:00.000Z')",
      [mat.id, 1, 99]
    );
    expect(await subjectsDb.getSubjectWeekMinutes(1, mat.id)).toBe(30);
  });
});
