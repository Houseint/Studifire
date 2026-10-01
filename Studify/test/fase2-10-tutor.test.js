/**
 * FASE 3 item 2 — Tutor hints-first: gerarDicaSocratica + gerarDicaLocal.
 * Mesmo padrão do quiz: guards + JSON robusto + fallback offline (botão nunca morre).
 */
import { gerarDicaSocratica, gerarDicaLocal } from '../src/features/chat/aiService';

describe('Tutor hints-first — gerarDicaSocratica', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete global.fetch;
  });

  test('guards: NOME/TOPICO/NIVEL invalidos', async () => {
    await expect(gerarDicaSocratica('', 'Fotossíntese', 'o que é?', 1)).rejects.toThrow('NOME_INVALIDO');
    await expect(gerarDicaSocratica('Bio', '', 'o que é?', 1)).rejects.toThrow('TOPICO_INVALIDO');
    await expect(gerarDicaSocratica('Bio', 'Fotossíntese', 'o que é?', 9)).rejects.toThrow('NIVEL_INVALIDO');
  });

  test('IA ok retorna dica nivel 1 sem entregar resposta', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: '{"dica": "O que a clorofila faz antes de olhar a resposta?"}' } }] }),
    });
    const r = await gerarDicaSocratica('Biologia', 'Fotossíntese', 'como funciona?', 1);
    expect(r.dica.length).toBeGreaterThan(10);
    expect(r.nivel).toBe(1);
    expect(r.local).toBe(false);
  });

  test('IA falha cai para fallback local (offline-first)', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network request failed'));
    const r = await gerarDicaSocratica('Bio', 'Fotossíntese', 'travei', 2);
    expect(r.local).toBe(true);
    expect(r.dica).toMatch(/Dica 2/);
  });

  test('gerarDicaLocal puro nos 3 niveis', () => {
    expect(gerarDicaLocal(1, 'Mitose', 'Bio').dica).toMatch(/Dica 1/);
    expect(gerarDicaLocal(2, 'Mitose', 'Bio').nivel).toBe(2);
    expect(gerarDicaLocal(3, 'Mitose', 'Bio').dica).toMatch(/Solução guiada/);
  });
});
