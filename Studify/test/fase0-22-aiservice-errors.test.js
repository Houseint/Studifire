describe('0.22 - aiService: caminhos de erro', () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_GROQ_API_KEY = 'chave-teste';
    global.fetch = jest.fn();
    jest.resetModules();
  });

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_GROQ_API_KEY;
    global.fetch.mockRestore();
  });

  test('resposta de erro da API retorna mensagem com o erro', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: { message: 'rate limit excedido' } }),
    });

    const { enviarMensagem } = require('../src/services/aiService');
    const resp = await enviarMensagem([{ role: 'user', text: 'oi' }]);

    expect(resp).toBe('Erro na API: rate limit excedido');
  });

  test('erro de rede retorna mensagem de conexão', async () => {
    global.fetch.mockRejectedValue(new Error('network down'));

    const { enviarMensagem } = require('../src/services/aiService');
    const resp = await enviarMensagem([{ role: 'user', text: 'oi' }]);

    expect(resp).toBe('Erro de conexão. Verifique sua internet.');
  });

  test('resposta sem choices retorna "Sem resposta."', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [] }),
    });

    const { enviarMensagem } = require('../src/services/aiService');
    const resp = await enviarMensagem([{ role: 'user', text: 'oi' }]);

    expect(resp).toBe('Sem resposta.');
  });

  test('monta mensagens com role e text do histórico', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'ok' } }] }),
    });

    const { enviarMensagem } = require('../src/services/aiService');
    await enviarMensagem([
      { role: 'user', text: 'pergunta' },
      { role: 'assistant', text: 'resposta' },
    ]);

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    const contents = body.messages.map((m) => m.content);
    expect(contents).toContain('pergunta');
    expect(contents).toContain('resposta');
    expect(body.messages[0].role).toBe('system');
  });
});