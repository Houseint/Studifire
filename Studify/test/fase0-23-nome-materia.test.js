const { validarNomeMateria } = require('../src/shared/utils/validacao');

describe('Modo segurança: validarNomeMateria bloqueia baboseira', () => {
  test('aceita nomes reais de matéria', () => {
    for (const nome of ['Matemática', 'História do Brasil', 'EDF', 'Física 2', 'Língua Portuguesa']) {
      expect(validarNomeMateria(nome)).toEqual({ ok: true });
    }
  });

  test('rejeita vazio e curto', () => {
    expect(validarNomeMateria('').ok).toBe(false);
    expect(validarNomeMateria('   ').ok).toBe(false);
    expect(validarNomeMateria('ab').code).toBe('CURTO');
  });

  test('rejeita sem letra (só número/símbolo)', () => {
    expect(validarNomeMateria('12345').code).toBe('SEM_LETRA');
    expect(validarNomeMateria('!!!').code).toBe('SEM_LETRA');
  });

  test('rejeita tecla presa repetida', () => {
    expect(validarNomeMateria('aaaa').code).toBe('REPETIDO');
    expect(validarNomeMateria('111').code).toBe('SEM_LETRA');
  });

  test('rejeita sem vogal e sequência de teclado', () => {
    expect(validarNomeMateria('zxcv').code).toBe('SEM_VOGAL');
    expect(validarNomeMateria('asdf').code).toBe('TECLADO');
    expect(validarNomeMateria('QWERTYabc').code).toBe('TECLADO');
  });

  test('rejeita nome gigante', () => {
    expect(validarNomeMateria('a'.repeat(61)).code).toBe('LONGO');
  });

  test('toda rejeição traz mensagem amigável', () => {
    for (const nome of ['', 'ab', '123', 'aaa', 'zxcv', 'asdf']) {
      const r = validarNomeMateria(nome);
      expect(r.ok).toBe(false);
      expect(typeof r.message).toBe('string');
      expect(r.message.length).toBeGreaterThan(5);
    }
  });
});
