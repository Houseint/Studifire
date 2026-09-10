/**
 * Studify - Shared activity utils (heatmap 7 dias)
 *
 * Puro e sem imports: soma os minutos de sessão por dia e classifica
 * a intensidade em níveis 0-4. Usado pela tela Histórico.
 * Formato de sessão esperado: { started_at: ISO, duration_minutes: number }
 */

export const HEATMAP_LEVELS = 5;

/**
 * Classifica minutos em nível 0-4.
 * @param {number} minutos
 * @returns {number}
 */
export function minutesToLevel(minutos) {
  const m = Number(minutos) || 0;
  if (m <= 0) return 0;
  if (m < 15) return 1;
  if (m < 30) return 2;
  if (m < 60) return 3;
  return 4;
}

const WEEKDAY_PT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

/**
 * Monta os últimos N dias (terminando hoje) com minutos e nível.
 * Dias futuros nunca entram; sessão com data inválida é ignorada.
 * @param {Array} sessions
 * @param {{days?:number, now?:Date}} [opts]
 * @returns {Array<{key:string, weekday:string, day:number, minutes:number, level:number, isToday:boolean}>}
 */
export function buildActivityHeatmap(sessions, opts = {}) {
  const days = Math.max(1, Math.min(30, Number(opts.days) || 7));
  const now = opts.now instanceof Date ? opts.now : new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const totals = {};
  for (const sess of Array.isArray(sessions) ? sessions : []) {
    const d = new Date(sess?.started_at);
    if (Number.isNaN(d.getTime())) continue;
    const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toDateString();
    totals[key] = (totals[key] || 0) + (Number(sess?.duration_minutes) || 0);
  }

  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const minutes = totals[d.toDateString()] || 0;
    out.push({
      key: d.toISOString().slice(0, 10),
      weekday: WEEKDAY_PT[d.getDay()],
      day: d.getDate(),
      minutes,
      level: minutesToLevel(minutes),
      isToday: i === 0,
    });
  }
  return out;
}
