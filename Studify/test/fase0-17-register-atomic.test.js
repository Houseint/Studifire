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

describe('0.17 - Cadastro atômico e recuperação do banco', () => {
  let registerUser, loginUser;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.isolateModules(() => {
      const authDb = require('../src/services/authDb');
      registerUser = authDb.registerUser;
      loginUser = authDb.loginUser;
    });
  });

  test('cadastro cria usuário e login funciona de ponta a ponta', async () => {
    const memDb = await createMemoryDb();
    mockOpenDatabaseAsync.mockImplementation(async () => memDb);

    await registerUser('novo@b.com', 'senhaForte');

    const user = await loginUser('novo@b.com', 'senhaForte');
    expect(user).toMatchObject({ id: 1, email: 'novo@b.com' });
  });

  test('e-mail duplicado lança erro estruturado EMAIL_EXISTS', async () => {
    const memDb = await createMemoryDb();
    mockOpenDatabaseAsync.mockImplementation(async () => memDb);

    await registerUser('dup@b.com', 'senhaForte');

    await expect(registerUser('dup@b.com', 'outraSenha')).rejects.toMatchObject({
      code: 'EMAIL_EXISTS',
    });
  });

  test('e-mail é normalizado (trim + lowercase) antes de salvar', async () => {
    const memDb = await createMemoryDb();
    mockOpenDatabaseAsync.mockImplementation(async () => memDb);

    await registerUser('  Usuario@Exemplo.COM  ', 'senhaForte');

    const user = await loginUser('usuario@exemplo.com', 'senhaForte');
    expect(user).toMatchObject({ id: 1, email: 'usuario@exemplo.com' });
  });

  test('race condition: INSERT OR IGNORE com changes=0 vira EMAIL_EXISTS', async () => {
    const memDb = await createMemoryDb();
    mockOpenDatabaseAsync.mockImplementation(async () => memDb);

    // Inicializa o banco (migrações criam a tabela users).
    await registerUser('seed@b.com', 'senhaForte');

    // Simula o cenário real da corrida: o pre-check não vê o e-mail,
    // mas o INSERT OR IGNORE é ignorado (outra requisição inseriu antes).
    await memDb.runAsync(
      'INSERT INTO users (email, senha_hash, created_at) VALUES (?, ?, ?)',
      ['race@b.com', 'hash-existente', new Date().toISOString()]
    );
    const getFirstSpy = jest
      .spyOn(memDb, 'getFirstAsync')
      .mockResolvedValueOnce(null);

    await expect(registerUser('race@b.com', 'senhaForte')).rejects.toMatchObject({
      code: 'EMAIL_EXISTS',
    });
    getFirstSpy.mockRestore();
  });

  test('falha ao abrir o banco: DB_UNAVAILABLE com cause, próxima chamada recupera', async () => {
    const memDb = await createMemoryDb();
    mockOpenDatabaseAsync
      .mockRejectedValueOnce(new Error('falha ao abrir'))
      .mockImplementation(async () => memDb);

    await expect(registerUser('a@b.com', 'senhaForte')).rejects.toMatchObject({
      code: 'DB_UNAVAILABLE',
    });

    // Auto-recuperação: a próxima chamada tenta abrir de novo e funciona.
    await registerUser('a@b.com', 'senhaForte');
    const user = await loginUser('a@b.com', 'senhaForte');
    expect(user).toMatchObject({ id: 1, email: 'a@b.com' });
  });

  test('falha na migração: DB_UNAVAILABLE, próxima chamada re-executa migrações', async () => {
    const memDb = await createMemoryDb();
    mockOpenDatabaseAsync.mockImplementation(async () => memDb);

    const execSpy = jest
      .spyOn(memDb, 'execAsync')
      .mockRejectedValueOnce(new Error('migração falhou'));

    await expect(registerUser('mig@b.com', 'senhaForte')).rejects.toMatchObject({
      code: 'DB_UNAVAILABLE',
    });
    execSpy.mockRestore();

    // A migração falhou antes de criar a tabela; a nova chamada recria tudo.
    await registerUser('mig@b.com', 'senhaForte');
    const user = await loginUser('mig@b.com', 'senhaForte');
    expect(user).toMatchObject({ id: 1, email: 'mig@b.com' });
  });

  test('subjectsDb: mesma auto-recuperação na abertura do banco', async () => {
    const memDb = await createMemoryDb();
    mockOpenDatabaseAsync
      .mockRejectedValueOnce(new Error('falha ao abrir'))
      .mockImplementation(async () => memDb);

    let carregarMaterias;
    jest.isolateModules(() => {
      const subjectsDb = require('../src/services/subjectsDb');
      carregarMaterias = subjectsDb.carregarMaterias;
    });

    await expect(carregarMaterias(1)).rejects.toThrow('falha ao abrir');

    const materias = await carregarMaterias(1);
    expect(materias).toEqual([]);
  });
});