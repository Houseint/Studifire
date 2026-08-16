jest.mock('expo-crypto', () => {
  const crypto = require('crypto');
  const SHA256 = 'SHA-256';
  return {
    CryptoDigestAlgorithm: { SHA256 },
    digestStringAsync: jest.fn(async (algorithm, data) => {
      if (algorithm !== SHA256) throw new Error('algoritmo inesperado');
      return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
    }),
    getRandomBytesAsync: jest.fn(async (count) => crypto.randomBytes(count)),
    encoding: { Base64: { encode: (buf) => Buffer.from(buf).toString('base64') } },
  };
});

const mockOpenDatabaseAsync = jest.fn(() => Promise.resolve(null));

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: mockOpenDatabaseAsync,
}));

const { createMemoryDb } = require('./helpers/sqliteMemory');

describe('0.19 - Sessão, perfil e migração do authDb', () => {
  let authDb;
  let AsyncStorage;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.isolateModules(() => {
      // Requer a MESMA instância que o authDb usa (registry do isolate).
      AsyncStorage = require('@react-native-async-storage/async-storage');
      authDb = require('../src/services/authDb');
    });
  });

  async function setupDb() {
    const memDb = await createMemoryDb();
    mockOpenDatabaseAsync.mockImplementation(async () => memDb);
    return memDb;
  }

  test('setSessionUser + getSessionUser: roundtrip completo', async () => {
    await authDb.setSessionUser({ id: 7, email: 'sessao@b.com' });
    const user = await authDb.getSessionUser();
    expect(user).toEqual({ id: 7, email: 'sessao@b.com' });
  });

  test('getSessionUser com JSON inválido retorna null e limpa a sessão', async () => {
    await AsyncStorage.setItem('studify_session', '{json inválido');

    expect(await authDb.getSessionUser()).toBeNull();
    expect(await AsyncStorage.getItem('studify_session')).toBeNull();
  });

  test('getSessionUser com shape errado retorna null e limpa a sessão', async () => {
    await AsyncStorage.setItem('studify_session', JSON.stringify({ id: 'nao-numero' }));

    expect(await authDb.getSessionUser()).toBeNull();
    expect(await AsyncStorage.getItem('studify_session')).toBeNull();
  });

  test('getUserById retorna id, email e avatar', async () => {
    const memDb = await setupDb();
    await authDb.registerUser('perfil@b.com', 'senhaForte');

    const user = await authDb.getUserById(1);
    expect(user).toMatchObject({ id: 1, email: 'perfil@b.com' });
    expect(user.avatar).toBeNull();
  });

  test('atualizarAvatar salva o avatar do usuário', async () => {
    await setupDb();
    await authDb.registerUser('avatar@b.com', 'senhaForte');

    await authDb.atualizarAvatar(1, 'data:image/png;base64,AAAA');

    const user = await authDb.getUserById(1);
    expect(user.avatar).toBe('data:image/png;base64,AAAA');
  });

  test('logoutUser limpa a sessão salva', async () => {
    await authDb.setSessionUser({ id: 1, email: 'sair@b.com' });
    expect(await authDb.getSessionUser()).not.toBeNull();

    await authDb.logoutUser();

    expect(await authDb.getSessionUser()).toBeNull();
  });

  test('migração: usuário com senha em texto puro vira senha_hash no login', async () => {
    const memDb = await createMemoryDb();
    // Tabela legada: coluna `senha` em texto puro, sem senha_hash/avatar.
    await memDb.execAsync(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        senha TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
    await memDb.runAsync(
      'INSERT INTO users (email, senha, created_at) VALUES (?, ?, ?)',
      ['legado@b.com', 'senhaAntiga', new Date().toISOString()]
    );
    mockOpenDatabaseAsync.mockImplementation(async () => memDb);

    const user = await authDb.loginUser('legado@b.com', 'senhaAntiga');
    expect(user).toMatchObject({ id: 1, email: 'legado@b.com' });

    const row = await memDb.getFirstAsync('SELECT senha_hash FROM users WHERE id = 1');
    expect(row.senha_hash).toMatch(/:/);
    expect(await authDb.verifyPassword('senhaAntiga', row.senha_hash)).toBe(true);
  });

  test('loginUser com banco indisponível lança DB_UNAVAILABLE', async () => {
    mockOpenDatabaseAsync.mockRejectedValue(new Error('banco corrompido'));

    await expect(authDb.loginUser('x@b.com', 'senha')).rejects.toMatchObject({
      code: 'DB_UNAVAILABLE',
    });
  });
});