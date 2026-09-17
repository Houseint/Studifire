const mockOpenDatabaseAsync = jest.fn(() => Promise.resolve(null));

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: mockOpenDatabaseAsync,
}));

describe('FASE 3 - Material → tópicos: gerarTopicosDeMaterial (vision)', () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_GROQ_API_KEY = 'chave-teste';
    global.fetch = jest.fn();
    jest.resetModules();
  });

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_GROQ_API_KEY;
    global.fetch.mockRestore();
  });

  const BASE64_FAKE = `x`.repeat(200);
  const TOPICOS = { topicos: ['Fotossíntese', 'Ciclo de Krebs', 'Álgebra'] };

  function mockVision(payload) {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: JSON.stringify(payload) } }] }),
    });
  }

  test('parseia JSON da vision e deduplica contra existentes', async () => {
    mockVision(TOPICOS);
    const { gerarTopicosDeMaterial } = require('../src/services/aiService');
    const { topicos } = await gerarTopicosDeMaterial('Biologia', BASE64_FAKE, ['Álgebra']);
    expect(topicos.map((t) => t.nome)).toEqual(['Fotossíntese', 'Ciclo de Krebs']);
    expect(topicos.every((t) => t.estudado === false)).toBe(true);
  });

  test('funciona sem nenhum tópico existente (sem trava PRECISA_1_TOPICO)', async () => {
    mockVision(TOPICOS);
    const { gerarTopicosDeMaterial } = require('../src/services/aiService');
    const { topicos } = await gerarTopicosDeMaterial('Biologia', BASE64_FAKE, []);
    expect(topicos).toHaveLength(3);
  });

  test('envia modelo vision + image_url em base64 no body', async () => {
    mockVision(TOPICOS);
    const { gerarTopicosDeMaterial, VISION_MODEL } = require('../src/services/aiService');
    await gerarTopicosDeMaterial('Biologia', BASE64_FAKE, []);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.model).toBe(VISION_MODEL);
    const userMsg = body.messages.find((m) => m.role === 'user');
    const img = userMsg.content.find((c) => c.type === 'image_url');
    expect(img.image_url.url.startsWith('data:image/jpeg;base64,')).toBe(true);
  });

  test('guards rejeitam entrada inválida sem chamar a API', async () => {
    const { gerarTopicosDeMaterial } = require('../src/services/aiService');
    await expect(gerarTopicosDeMaterial('Bi', BASE64_FAKE, [])).rejects.toThrow('NOME_INVALIDO');
    await expect(gerarTopicosDeMaterial('Biologia', '', [])).rejects.toThrow('IMAGEM_OBRIGATORIA');
    await expect(gerarTopicosDeMaterial('Biologia', null, [])).rejects.toThrow('IMAGEM_OBRIGATORIA');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('10 tópicos existentes retorna limite_atingido sem chamar a API', async () => {
    const { gerarTopicosDeMaterial } = require('../src/services/aiService');
    const dez = Array.from({ length: 10 }, (_, i) => `Tópico ${i + 1}`);
    const res = await gerarTopicosDeMaterial('Biologia', BASE64_FAKE, dez);
    expect(res.reason).toBe('limite_atingido');
    expect(res.topicos).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('sem chave joga erro amigável sem chamar fetch', async () => {
    delete process.env.EXPO_PUBLIC_GROQ_API_KEY;
    const { gerarTopicosDeMaterial } = require('../src/services/aiService');
    await expect(gerarTopicosDeMaterial('Biologia', BASE64_FAKE, [])).rejects.toThrow(/chave/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('imagem ilegível (zero tópicos) pede foto mais nítida', async () => {
    mockVision({ topicos: [] });
    const { gerarTopicosDeMaterial } = require('../src/services/aiService');
    await expect(gerarTopicosDeMaterial('Biologia', BASE64_FAKE, [])).rejects.toThrow(/nítida/);
  });

  test('limite free (⏳) vira throw sem quebrar', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 429,
      headers: { get: () => null },
      json: async () => ({ error: { message: 'Rate limit reached, retry in 30s' } }),
    });
    const { gerarTopicosDeMaterial } = require('../src/services/aiService');
    await expect(gerarTopicosDeMaterial('Biologia', BASE64_FAKE, [])).rejects.toThrow(/⏳/);
  });
});
