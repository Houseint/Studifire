const mockOpenDatabaseAsync = jest.fn(() => Promise.resolve(null));

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: mockOpenDatabaseAsync,
}));

const { createMemoryDb } = require('./helpers/sqliteMemory');

describe('0.8 - SQL injection em atualizarMateria', () => {
  let buildUpdateSql, atualizarMateria;

  beforeEach(() => {
    jest.isolateModules(() => {
      const subjectsDb = require('../src/services/subjectsDb');
      buildUpdateSql = subjectsDb.buildUpdateSql;
      atualizarMateria = subjectsDb.atualizarMateria;
    });
  });

  test('payload malicioso não injeta SQL arbitrário na query', () => {
    const payload = {
      nome: "x'; DROP TABLE subjects;--",
      topicos: [{ nome: "'); DROP TABLE sessions;--" }],
      "nome = 'hackeado'": 'valor',
      'id = 1 OR 1=1': true,
      "accessed_at = (SELECT senha_hash FROM users)": 'x',
      fixada: true,
    };

    const { sql, vals } = buildUpdateSql(payload);

    expect(sql).toBe('nome = ?, topicos = ?, fixada = ?');
    expect(sql).not.toContain('DROP');
    expect(sql).not.toContain('OR');
    expect(sql).not.toContain(';');
    expect(vals).toHaveLength(3);
    expect(vals[0]).toBe("x'; DROP TABLE subjects;--");
  });

  test('chaves desconhecidas são ignoradas sem gerar SQL', () => {
    const { sql, vals } = buildUpdateSql({
      'user_id = 1': 'qualquer',
      'password = (SELECT 1)': 1,
    });
    expect(sql).toBe('');
    expect(vals).toHaveLength(0);
  });

  test('updates válidos geram SQL e valores corretos', () => {
    const { sql, vals } = buildUpdateSql({
      nome: 'Matemática',
      topicos: [{ nome: 'Álgebra', estudado: true }],
      fixada: true,
      accessed_at: '2026-01-01T00:00:00.000Z',
    });
    expect(sql).toBe('nome = ?, topicos = ?, fixada = ?, accessed_at = ?');
    expect(vals[1]).toBe(JSON.stringify([{ nome: 'Álgebra', estudado: true }]));
    expect(vals[2]).toBe(1);
  });

  test('integração: valor malicioso vira parâmetro, não SQL executado', async () => {
    const memDb = await createMemoryDb();
    await memDb.execAsync(`
      CREATE TABLE subjects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        topicos TEXT NOT NULL DEFAULT '[]',
        fixada INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        accessed_at TEXT NOT NULL,
        user_id INTEGER DEFAULT 1
      );
    `);
    await memDb.runAsync(
      'INSERT INTO subjects (nome, topicos, fixada, created_at, accessed_at, user_id) VALUES (?, ?, 0, ?, ?, ?)',
      ['Original', '[]', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z', 1]
    );

    mockOpenDatabaseAsync.mockImplementation(async () => memDb);

    await atualizarMateria(1, 1, { nome: "atacado'; DROP TABLE subjects;--" });

    const tabelaExiste = await memDb.getFirstAsync(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='subjects'"
    );
    expect(tabelaExiste).not.toBeNull();

    const row = await memDb.getFirstAsync('SELECT nome FROM subjects WHERE id = 1');
    expect(row.nome).toBe("atacado'; DROP TABLE subjects;--");
  });

  test('integração: atualização sem campos válidos não executa nada', async () => {
    const memDb = await createMemoryDb();
    await memDb.execAsync(`
      CREATE TABLE subjects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        topicos TEXT NOT NULL DEFAULT '[]',
        fixada INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        accessed_at TEXT NOT NULL,
        user_id INTEGER DEFAULT 1
      );
    `);
    mockOpenDatabaseAsync.mockImplementation(async () => memDb);

    const runSpy = jest.spyOn(memDb, 'runAsync');
    await atualizarMateria(1, 1, { 'DROP TABLE subjects': true });
    // getDb() roda seeds no init — o que importa é não encostar em subjects.
    const subjectCalls = runSpy.mock.calls.filter(([sql]) => /subjects/i.test(String(sql)));
    expect(subjectCalls).toEqual([]);
    runSpy.mockRestore();
  });
});
