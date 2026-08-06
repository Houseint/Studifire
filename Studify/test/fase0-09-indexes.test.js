const mockOpenDatabaseAsync = jest.fn(() => Promise.resolve(null));

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: mockOpenDatabaseAsync,
}));

const { createMemoryDb } = require('./helpers/sqliteMemory');

const TABELA_SUBJECTS = `
  CREATE TABLE subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    topicos TEXT NOT NULL DEFAULT '[]',
    fixada INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    accessed_at TEXT NOT NULL,
    user_id INTEGER DEFAULT 1
  );
`;

function insereMaterias(db, count, userId) {
  const base = new Date('2026-01-01T00:00:00.000Z').getTime();
  for (let i = 0; i < count; i++) {
    db.runAsync(
      'INSERT INTO subjects (nome, topicos, fixada, created_at, accessed_at, user_id) VALUES (?, ?, 0, ?, ?, ?)',
      [`Matéria ${i}`, '[]', new Date(base).toISOString(), new Date(base - i * 1000).toISOString(), userId]
    );
  }
}

describe('0.9 - Índices no SQLite', () => {
  let carregarMaterias;

  beforeEach(() => {
    jest.isolateModules(() => {
      carregarMaterias = require('../src/services/subjectsDb').carregarMaterias;
    });
  });

  test('getDb cria os índices das tabelas principais', async () => {
    const memDb = await createMemoryDb();
    await memDb.execAsync(TABELA_SUBJECTS);
    mockOpenDatabaseAsync.mockImplementation(async () => memDb);

    await carregarMaterias(1);

    const indexes = await memDb.getAllAsync(
      "SELECT name FROM sqlite_master WHERE type = 'index' AND sql IS NOT NULL ORDER BY name"
    );
    const names = indexes.map((i) => i.name);
    expect(names).toEqual(
      expect.arrayContaining([
        'idx_subjects_user_accessed',
        'idx_sessions_user_started',
        'idx_sessions_subject',
        'idx_chat_conversations_user',
        'idx_chat_messages_conversation',
      ])
    );
  });

  test('carregarMaterias com 1000 matérias usa o índice (plano de query)', async () => {
    const memDb = await createMemoryDb();
    await memDb.execAsync(TABELA_SUBJECTS);
    insereMaterias(memDb, 1000, 7);
    insereMaterias(memDb, 50, 99);

    mockOpenDatabaseAsync.mockImplementation(async () => memDb);

    const sql = 'SELECT * FROM subjects WHERE user_id = ? ORDER BY accessed_at DESC';

    await memDb.execAsync(
      'CREATE INDEX idx_subjects_user_accessed ON subjects (user_id, accessed_at DESC);'
    );

    const planoComIndice = await memDb.getAllAsync(
      "EXPLAIN QUERY PLAN SELECT * FROM subjects WHERE user_id = ? ORDER BY accessed_at DESC",
      [7]
    );
    const planText = JSON.stringify(planoComIndice);
    expect(planText).toMatch(/USING INDEX idx_subjects_user_accessed/);
    expect(planText).not.toMatch(/SCAN/);

    const rows = await memDb.getAllAsync(sql, [7]);
    expect(rows).toHaveLength(1000);

    const materias = await carregarMaterias(7);
    expect(materias).toHaveLength(1000);

    for (let i = 1; i < materias.length; i++) {
      expect(
        new Date(materias[i - 1].accessed_at).getTime()
      ).toBeGreaterThanOrEqual(new Date(materias[i].accessed_at).getTime());
    }
  });

  test('carregarMaterias não mistura matérias de outros usuários', async () => {
    const memDb = await createMemoryDb();
    await memDb.execAsync(TABELA_SUBJECTS);
    await memDb.execAsync(
      'CREATE INDEX idx_subjects_user_accessed ON subjects (user_id, accessed_at DESC);'
    );
    insereMaterias(memDb, 100, 7);
    insereMaterias(memDb, 30, 99);

    mockOpenDatabaseAsync.mockImplementation(async () => memDb);

    const materias = await carregarMaterias(7);
    expect(materias).toHaveLength(100);
  });
});
