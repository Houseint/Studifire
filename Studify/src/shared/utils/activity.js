/**
 * Studify - Shared activity utils (heatmap 7 dias + atividade semanal)
 *
 * Soma os minutos de sessão por dia e classifica a intensidade em níveis 0-4.
 * Também monta a atividade da semana (sessões + tópicos concluídos) usada
 * pela tela Histórico. Formato de sessão esperado:
 * { started_at: ISO, duration_minutes: number, subject_nome?: string }
 */
import { getTopicCompletedAt } from './fsrs';

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

function startOfWeekMonday(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

/**
 * Atividade da semana atual (segunda 00:00 → próximo domingo 23:59).
 * Junta sessões por matéria e tópicos concluídos/revisados no dia.
 * @param {Array} sessions
 * @param {Array} materias
 * @param {{now?:Date}} [opts]
 * @returns {Record<number, {sessoes:string[], topicos:Array<{key:string,materiaId:number|undefined,materiaNome:string,topicoNome:string,completedAt:Date}>}>}
 */
export function buildWeeklyActivity(sessions, materias, opts = {}) {
  const now = opts.now instanceof Date ? opts.now : new Date();
  const start = startOfWeekMonday(now);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const byDay = {};
  const dayFor = (dow) => {
    if (!byDay[dow]) byDay[dow] = { sessoes: [], topicos: [] };
    return byDay[dow];
  };
  const materiasList = Array.isArray(materias) ? materias : [];
  const byId = new Map(materiasList.map((m) => [m?.id, m]));

  for (const sess of Array.isArray(sessions) ? sessions : []) {
    const d = new Date(sess?.started_at);
    if (Number.isNaN(d.getTime()) || d < start || d >= end) continue;
    const nome = sess?.subject_nome || byId.get(sess?.subject_id)?.nome;
    if (!nome) continue;
    const day = dayFor(d.getDay());
    if (!day.sessoes.includes(nome)) day.sessoes.push(nome);
  }

  for (const m of materiasList) {
    for (const t of Array.isArray(m?.topicos) ? m.topicos : []) {
      const completedAt = getTopicCompletedAt(t);
      if (!completedAt || completedAt < start || completedAt >= end) continue;
      const topicoNome = t?.nome || t?.titulo || 'tópico';
      const key = `${m?.id ?? m?.nome}-${topicoNome}`;
      const day = dayFor(completedAt.getDay());
      if (day.topicos.some((x) => x.key === key)) continue;
      day.topicos.push({
        key,
        materiaId: m?.id,
        materiaNome: m?.nome || 'Matéria',
        topicoNome,
        completedAt,
      });
    }
  }

  Object.values(byDay).forEach((day) => {
    day.topicos.sort((a, b) => a.completedAt - b.completedAt);
  });
  return byDay;
}
