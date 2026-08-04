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

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const { createMemoryDb } = require('./helpers/sqliteMemory');

const mockOpenDatabaseAsync = jest.fn(() => Promise.resolve(null));

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: mockOpenDatabaseAsync,
}));

describe('0.6 - Salt no hash de senha', () => {
  let hashPassword, verifyPassword, isLegacyHash, registerUser, loginUser;

  beforeEach(() => {
    jest.isolateModules(() => {
      const authDb = require('../src/services/authDb');
      hashPassword = authDb.hashPassword;
      verifyPassword = authDb.verifyPassword;
      isLegacyHash = authDb.isLegacyHash;
      registerUser = authDb.registerUser;
      loginUser = authDb.loginUser;
    });
  });

  test('mesma senha gera hashes diferentes (salt aleatório)', async () => {
    const h1 = await hashPassword('minhaSenha123');
    const h2 = await hashPassword('minhaSenha123');
    expect(h1).not.toBe(h2);
    expect(h1).toMatch(/^[A-Za-z0-9+/=]+:[0-9a-f]{64}$/);
    expect(h2).toMatch(/^[A-Za-z0-9+/=]+:[0-9a-f]{64}$/);
  });

  test('verifyPassword aceita senha correta e rejeita incorreta', async () => {
    const hash = await hashPassword('senhaCorreta');
    expect(await verifyPassword('senhaCorreta', hash)).toBe(true);
    expect(await verifyPassword('senhaErrada', hash)).toBe(false);
  });

  test('hash legado (sem salt) continua validando o login', async () => {
    const crypto = require('crypto');
    const legacy = crypto.createHash('sha256').update('velhaSenha', 'utf8').digest('hex');
    expect(isLegacyHash(legacy)).toBe(true);
    expect(await verifyPassword('velhaSenha', legacy)).toBe(true);
    expect(await verifyPassword('outra', legacy)).toBe(false);
  });

  test('hash com salt não é legado', async () => {
    const hash = await hashPassword('x');
    expect(isLegacyHash(hash)).toBe(false);
  });

  test('registro e login funcionam de ponta a ponta com SQLite em memória', async () => {
    const memDb = await createMemoryDb();
    await memDb.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        senha_hash TEXT NOT NULL,
        created_at TEXT NOT NULL,
        avatar TEXT
      );
    `);

    mockOpenDatabaseAsync.mockImplementation(async () => memDb);

    await registerUser('a@b.com', 'senhaForte');
    const user = await loginUser('a@b.com', 'senhaForte');
    expect(user).toMatchObject({ id: 1, email: 'a@b.com' });

    const senhaErrada = await loginUser('a@b.com', 'senhaErrada');
    expect(senhaErrada).toBeNull();
  });

  test('login migra hash legado para salted automaticamente', async () => {
    const crypto = require('crypto');
    const memDb = await createMemoryDb();
    await memDb.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        senha_hash TEXT NOT NULL,
        created_at TEXT NOT NULL,
        avatar TEXT
      );
    `);
    const legacy = crypto.createHash('sha256').update('antiga', 'utf8').digest('hex');
    await memDb.runAsync(
      'INSERT INTO users (email, senha_hash, created_at) VALUES (?, ?, ?)',
      ['velho@b.com', legacy, new Date().toISOString()]
    );

    mockOpenDatabaseAsync.mockImplementation(async () => memDb);

    const user = await loginUser('velho@b.com', 'antiga');
    expect(user).toMatchObject({ id: 1, email: 'velho@b.com' });

    const row = await memDb.getFirstAsync('SELECT senha_hash FROM users WHERE id = 1');
    expect(row.senha_hash).toMatch(/:/);
    expect(await verifyPassword('antiga', row.senha_hash)).toBe(true);
  });
});
