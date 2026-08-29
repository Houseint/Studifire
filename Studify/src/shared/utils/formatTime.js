/**
 * Studify - Shared formatTime utils
 *
 * Passo 1.0 - FASE 1: extrai helpers de tempo de DetailScreen.js e helpers.js.
 * Antes: DetailScreen definia formatarTempo/formatarCronometro inline (duplicação).
 * Agora: único ponto, importável por Detail, Progress, Home, etc.
 *
 * Zero breaking: mantém assinaturas idênticas.
 */

/**
 * Formata minutos em string legível: "45 min" | "1h" | "2h 15min"
 * @param {number} minutos
 * @returns {string}
 */
export function formatarTempo(minutos) {
  if (!Number.isFinite(minutos) || minutos <= 0) return '0 min';
  if (minutos < 60) return `${minutos} min`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

/**
 * Formata segundos em cronômetro HH:MM:SS
 * @param {number} segundos
 * @returns {string}
 */
export function formatarCronometro(segundos) {
  const s = Math.max(0, Math.floor(segundos || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

/**
 * Calcula stats globais de tópicos (extraído de components/home/helpers.js)
 * Mantido aqui para futuro uso compartilhado; helpers.js re-exporta para compatibilidade.
 * @param {Array} revisados
 * @param {Array} fixados
 * @returns {{totalTopicos:number, concluidos:number}}
 */
export function calcGlobalStats(revisados, fixados) {
  const all = [...(revisados || []), ...(fixados || [])];
  const totalTopicos = all.reduce((acc, m) => acc + (m.topicos?.length || 0), 0);
  const concluidos = all.reduce((acc, m) => acc + (m.topicos?.filter((t) => t.estudado).length || 0), 0);
  return { totalTopicos, concluidos };
}
