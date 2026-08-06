const mockOpenDatabaseAsync = jest.fn(() => Promise.resolve(null));

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: mockOpenDatabaseAsync,
}));

const { createMemoryDb } = require('./helpers/sqliteMemory');

describe('A5 - Ownership de conversa em salvarMensagem', () => {
  let salvarMensagem;

  async function setupDb() {
    const memDb = await createMemoryDb();
    await memDb.execAsync(`
      CREATE TABLE chat_conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL DEFAULT 'Nova conversa',
        created_at TEXT NOT NULL,
        user_id INTEGER DEFAULT 1
      );
      CREATE TABLE chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
      );
    `);
    const res = await memDb.runAsync(
      'INSERT INTO chat_conversations (titulo, created_at, user_id) VALUES (?, ?, ?)',
      ['Conversa do dono', '2026-01-01T00:00:00.000Z', 1]
    );
    mockOpenDatabaseAsync.mockImplementation(async () => memDb);
    return { memDb, conversationId: res.lastInsertRowId };
  }

  beforeEach(() => {
    jest.isolateModules(() => {
      const subjectsDb = require('../src/services/subjectsDb');
      salvarMensagem = subjectsDb.salvarMensagem;
    });
  });

  test('usuário dono da conversa consegue salvar mensagem', async () => {
    const { memDb, conversationId } = await setupDb();

    const msg = await salvarMensagem(1, conversationId, 'user', 'olá');

    expect(msg.role).toBe('user');
    expect(msg.content).toBe('olá');
    expect(msg.conversation_id).toBe(conversationId);

    const rows = await memDb.getAllAsync('SELECT * FROM chat_messages');
    expect(rows).toHaveLength(1);
    expect(rows[0].content).toBe('olá');
  });

  test('usuário que não é dono recebe CONVERSATION_NOT_OWNED e nada é gravado', async () => {
    const { memDb, conversationId } = await setupDb();

    await expect(
      salvarMensagem(2, conversationId, 'user', 'invasão')
    ).rejects.toThrow('CONVERSATION_NOT_OWNED');

    const rows = await memDb.getAllAsync('SELECT * FROM chat_messages');
    expect(rows).toHaveLength(0);
  });

  test('conversa inexistente também rejeita', async () => {
    await setupDb();

    await expect(
      salvarMensagem(1, 999, 'assistant', 'x')
    ).rejects.toThrow('CONVERSATION_NOT_OWNED');
  });

  test('regressão: consulta usa parâmetros, sem SQL injetável no id', async () => {
    const { memDb } = await setupDb();

    await expect(
      salvarMensagem(1, "1 OR 1=1", 'user', 'x')
    ).rejects.toThrow('CONVERSATION_NOT_OWNED');

    const rows = await memDb.getAllAsync('SELECT * FROM chat_messages');
    expect(rows).toHaveLength(0);
  });
});
