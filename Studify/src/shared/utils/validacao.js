/**
 * Studify - Validação de nome de matéria (modo segurança anti-baboseira).
 * Puro e testável: bloqueia vazio, curto, sem letra, tecla presa ("aaa"),
 * sem vogal ("zxcv") e sequências de teclado ("asdf", "qwerty").
 * Não usa IA: funciona offline e não gasta tokens.
 */

const TECLADO_BLOQUEADO = ['asdf', 'qwer', 'zxcv', 'hjkl', 'qwerty', 'abcd', '1234'];
const VOGAL = /[aeiouáéíóúâêîôûãõàèìòùäëïöü]/i;

/**
 * @param {string} nome
 * @returns {{ok:boolean, code?:string, message?:string}}
 */
export function validarNomeMateria(nome) {
  const n = String(nome || '').trim();
  if (n.length < 3) {
    return { ok: false, code: 'CURTO', message: 'Nome precisa de 3+ letras.' };
  }
  if (n.length > 60) {
    return { ok: false, code: 'LONGO', message: 'Nome muito longo (máx 60 caracteres).' };
  }
  if (!/\p{L}/u.test(n)) {
    return { ok: false, code: 'SEM_LETRA', message: 'Nome precisa ter letras, não só números/símbolos.' };
  }
  const soAlnum = n.toLowerCase().replace(/[^a-z0-9á-úâêîôûãõç]/gi, '');
  if (soAlnum.length > 0 && [...soAlnum].every((c) => c === soAlnum[0])) {
    return { ok: false, code: 'REPETIDO', message: 'Isso parece tecla presa (ex.: "aaaa"). Digite o nome real.' };
  }
  if (!VOGAL.test(n)) {
    return { ok: false, code: 'SEM_VOGAL', message: 'Nome sem vogal? Confira a digitação.' };
  }
  const baixo = n.toLowerCase();
  if (TECLADO_BLOQUEADO.some((s) => baixo.includes(s))) {
    return { ok: false, code: 'TECLADO', message: 'Isso parece teste de teclado (ex.: "asdf"). Digite o nome real.' };
  }
  return { ok: true };
}
