const mockOpenDatabaseAsync = jest.fn(() => Promise.resolve(null));

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: mockOpenDatabaseAsync,
}));

const { createMemoryDb } = require('./helpers/sqliteMemory');

describe('0.18 - CRUD completo do subjectsDb', () => {
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

  test('criarMateria cria e carregarMaterias retorna com topicos parseados', async () => {
    await setupDb();

    const criada = await subjectsDb.criarMateria(1, '  Matemática  ', [
      { nome: 'Álgebra', estudado: false },
    ]);

    expect(criada.nome).toBe('Matemática');
    expect(criada.topicos).toEqual([{ nome: 'Álgebra', estudado: false }]);
    expect(criada.fixada).toBe(false);

    const materias = await subjectsDb.carregarMaterias(1);
    expect(materias).toHaveLength(1);
    expect(materias[0].nome).toBe('Matemática');
    expect(materias[0].topicos).toEqual([{ nome: 'Álgebra', estudado: false }]);
  });

  test('getMateriaById retorna a matéria do usuário e null para outro usuário', async () => {
    await setupDb();
    const criada = await subjectsDb.criarMateria(1, 'Física', []);

    const da = await subjectsDb.getMateriaById(1, criada.id);
    expect(da).toMatchObject({ id: criada.id, nome: 'Física' });

    const deOutro = await subjectsDb.getMateriaById(2, criada.id);
    expect(deOutro).toBeNull();
  });

  test('atualizarMateria atualiza nome, topicos e fixada', async () => {
    await setupDb();
    const criada = await subjectsDb.criarMateria(1, 'Química', []);

    await subjectsDb.atualizarMateria(1, criada.id, {
      nome: 'Química Orgânica',
      topicos: [{ nome: 'Alcanos', estudado: true }],
      fixada: true,
    });

    const atualizada = await subjectsDb.getMateriaById(1, criada.id);
    expect(atualizada.nome).toBe('Química Orgânica');
    expect(atualizada.topicos).toEqual([{ nome: 'Alcanos', estudado: true }]);
    expect(atualizada.fixada).toBe(true);
  });

  test('toggleFixada inverte o estado atual', async () => {
    await setupDb();
    const criada = await subjectsDb.criarMateria(1, 'História', []);

    await subjectsDb.toggleFixada(1, criada.id, false);
    expect((await subjectsDb.getMateriaById(1, criada.id)).fixada).toBe(true);

    await subjectsDb.toggleFixada(1, criada.id, true);
    expect((await subjectsDb.getMateriaById(1, criada.id)).fixada).toBe(false);
  });

  test('deletarMateria remove a matéria', async () => {
    await setupDb();
    const criada = await subjectsDb.criarMateria(1, 'Biologia', []);

    await subjectsDb.deletarMateria(1, criada.id);

    expect(await subjectsDb.getMateriaById(1, criada.id)).toBeNull();
    expect(await subjectsDb.carregarMaterias(1)).toEqual([]);
  });

  test('registrarSessao + carregarHistorico com nome da matéria', async () => {
    await setupDb();
    const criada = await subjectsDb.criarMateria(1, 'Geografia', []);

    await subjectsDb.registrarSessao(1, criada.id, 25);

    const historico = await subjectsDb.carregarHistorico(1);
    expect(historico).toHaveLength(1);
    expect(historico[0]).toMatchObject({
      subject_id: criada.id,
      duration_minutes: 25,
      subject_nome: 'Geografia',
    });
  });

  test('carregarSessoesPorMateria retorna apenas as sessões da matéria', async () => {
    await setupDb();
    const a = await subjectsDb.criarMateria(1, 'Matéria A', []);
    const b = await subjectsDb.criarMateria(1, 'Matéria B', []);

    await subjectsDb.registrarSessao(1, a.id, 10);
    await subjectsDb.registrarSessao(1, b.id, 20);
    await subjectsDb.registrarSessao(1, a.id, 30);

    const sessoesA = await subjectsDb.carregarSessoesPorMateria(1, a.id);
    expect(sessoesA).toHaveLength(2);
    expect(sessoesA.map((s) => s.duration_minutes).sort()).toEqual([10, 30]);
  });

  test('criarConversa + listarConversas com ultima_msg + getConversa', async () => {
    await setupDb();
    const conv = await subjectsDb.criarConversa(1);
    expect(conv).toMatchObject({ id: 1, titulo: 'Nova conversa' });

    await subjectsDb.salvarMensagem(1, conv.id, 'user', 'olá');
    await subjectsDb.salvarMensagem(1, conv.id, 'assistant', 'oi!');

    const conversas = await subjectsDb.listarConversas(1);
    expect(conversas).toHaveLength(1);
    expect(conversas[0].ultima_msg).toBe('oi!');

    const direta = await subjectsDb.getConversa(1, conv.id);
    expect(direta).toMatchObject({ id: conv.id, titulo: 'Nova conversa' });
  });

  test('atualizarTituloConversa renomeia a conversa', async () => {
    await setupDb();
    const conv = await subjectsDb.criarConversa(1);

    await subjectsDb.atualizarTituloConversa(1, conv.id, 'Dúvidas de cálculo');

    const direta = await subjectsDb.getConversa(1, conv.id);
    expect(direta.titulo).toBe('Dúvidas de cálculo');
  });

  test('salvarMensagem valida role e ownership', async () => {
    await setupDb();
    const conv = await subjectsDb.criarConversa(1);

    const msg = await subjectsDb.salvarMensagem(1, conv.id, 'user', 'conteúdo');
    expect(msg).toMatchObject({ role: 'user', content: 'conteúdo' });

    await expect(
      subjectsDb.salvarMensagem(1, conv.id, 'hacker', 'x')
    ).rejects.toThrow('INVALID_ROLE');

    await expect(
      subjectsDb.salvarMensagem(2, conv.id, 'user', 'x')
    ).rejects.toThrow('CONVERSATION_NOT_OWNED');
  });

  test('carregarMensagens retorna em ordem cronológica', async () => {
    await setupDb();
    const conv = await subjectsDb.criarConversa(1);

    await subjectsDb.salvarMensagem(1, conv.id, 'user', 'primeira');
    await subjectsDb.salvarMensagem(1, conv.id, 'assistant', 'segunda');

    const msgs = await subjectsDb.carregarMensagens(1, conv.id);
    expect(msgs.map((m) => m.content)).toEqual(['primeira', 'segunda']);
  });

  test('deletarConversa remove a conversa e suas mensagens', async () => {
    await setupDb();
    const conv = await subjectsDb.criarConversa(1);
    await subjectsDb.salvarMensagem(1, conv.id, 'user', 'x');

    await subjectsDb.deletarConversa(1, conv.id);

    expect(await subjectsDb.getConversa(1, conv.id)).toBeNull();
    expect(await subjectsDb.carregarMensagens(1, conv.id)).toEqual([]);
  });

  test('limparConversasAntigas respeita o limite', async () => {
    await setupDb();
    for (let i = 0; i < 5; i++) {
      await subjectsDb.criarConversa(1);
    }

    await subjectsDb.limparConversasAntigas(1, 2);

    const restantes = await subjectsDb.listarConversas(1);
    expect(restantes).toHaveLength(2);
  });

  test('ownership: usuário 2 não vê matérias nem conversas do usuário 1', async () => {
    await setupDb();
    await subjectsDb.criarMateria(1, 'Privada', []);
    const conv = await subjectsDb.criarConversa(1);

    expect(await subjectsDb.carregarMaterias(2)).toEqual([]);
    expect(await subjectsDb.listarConversas(2)).toEqual([]);
    expect(await subjectsDb.getConversa(2, conv.id)).toBeNull();
  });
});