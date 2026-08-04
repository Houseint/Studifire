describe('0.1 - GROQ_API_KEY fora do bundle client', () => {
  beforeEach(() => {
    delete process.env.EXPO_PUBLIC_GROQ_API_KEY;
    global.fetch = jest.fn();
    jest.resetModules();
  });

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_GROQ_API_KEY;
    global.fetch.mockRestore();
  });

  test('app.config.js não expõe GROQ_API_KEY em extra', () => {
    const config = require('../app.config.js');
    expect(config.expo.extra).not.toHaveProperty('GROQ_API_KEY');
    expect(config.expo.extra.GROQ_API_KEY).toBeUndefined();
  });

  test('aiService não lê a chave via Constants.expoConfig.extra', () => {
    jest.doMock('expo-constants', () => ({
      __esModule: true,
      default: {
        expoConfig: { extra: { GROQ_API_KEY: 'CHAVE_VAZADA' } },
      },
    }));

    const { enviarMensagem } = require('../src/services/aiService');
    return enviarMensagem([{ role: 'user', text: 'oi' }]).then((resp) => {
      expect(resp).toMatch(/Configure sua chave/);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  test('aiService nunca envia a chave quando ela não está definida', async () => {
    const { enviarMensagem } = require('../src/services/aiService');
    const resp = await enviarMensagem([{ role: 'user', text: 'oi' }]);
    expect(resp).toMatch(/Configure sua chave/);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('aiService envia Authorization Bearer somente se a chave existir', async () => {
    process.env.EXPO_PUBLIC_GROQ_API_KEY = 'chave-teste';
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'resposta' } }] }),
    });

    const { enviarMensagem } = require('../src/services/aiService');
    const resp = await enviarMensagem([{ role: 'user', text: 'oi' }]);

    expect(resp).toBe('resposta');
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe('https://api.groq.com/openai/v1/chat/completions');
    const headers = opts.headers;
    expect(headers.Authorization).toBe('Bearer chave-teste');
    const body = JSON.parse(opts.body);
    expect(JSON.stringify(body)).not.toContain('chave-teste');
  });
});
