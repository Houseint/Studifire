/**
 * Studify - Shared studyPlan utils (FASE 2.3)
 *
 * Plano semanal automático: distribui o que estudar nos próximos 7 dias
 * a partir de dados que a Home já tem (zero query nova, zero tabela nova).
 *
 * Ordem da fila: revisões vencidas (FSRS) → tópicos novos → reforço.
 * Puro e sem imports nativos: usável pela Home, por testes e pela IA.
 */

import { getDueTopics } from './fsrs';

export const PLAN_DAYS = 7;
export const PLAN_MAX_ITEMS_PER_DAY = 3;
export const PLAN_MINUTES_PER_ITEM = 25;

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/**
 * Monta a fila de estudos: vencidos primeiro, depois novos, depois reforço.
 * @param {Array} materias [{id, nome, topicos}]
 * @param {Date} [now=new Date()]
 * @returns {Array<{topicoNome, materiaNome, kind}>} kind: 'revisao' | 'novo' | 'reforco'
 */
export function buildStudyQueue(materias, now = new Date()) {
  const all = Array.isArray(materias) ? materias : [];
  const queue = [];
  const seen = new Set();
  const key = (m, i) => `${m?.id ?? m?.nome ?? '?'}:${i}`;

  for (const d of getDueTopics(all, now)) {
    queue.push({ topicoNome: d.topicoNome, materiaNome: d.materiaNome, kind: 'revisao' });
    seen.add(key({ id: d.materiaId, nome: d.materiaNome }, d.topicoIndex));
  }
  for (const m of all) {
    const tops = Array.isArray(m?.topicos) ? m.topicos : [];
    tops.forEach((t, idx) => {
      if (!t || t.estudado || seen.has(key(m, idx))) return;
      seen.add(key(m, idx));
      queue.push({
        topicoNome: t?.nome || t?.titulo || 'tópico',
        materiaNome: m?.nome || 'Matéria',
        kind: 'novo',
      });
    });
  }
  for (const m of all) {
    const tops = Array.isArray(m?.topicos) ? m.topicos : [];
    tops.forEach((t, idx) => {
      if (!t || !t.estudado || seen.has(key(m, idx))) return;
      seen.add(key(m, idx));
      queue.push({
        topicoNome: t?.nome || t?.titulo || 'tópico',
        materiaNome: m?.nome || 'Matéria',
        kind: 'reforco',
      });
    });
  }
  return queue;
}

/**
 * Distribui a fila em 7 dias a partir de hoje.
 * @param {Array} materias
 * @param {{goalMinutes?:number, currentMinutes?:number, now?:Date}} [opts]
 * @returns {{days: Array<{date:string, weekday:string, minutes:number, items:Array}>, remainingMinutes:number, perDayMinutes:number, totalItems:number}}
 */
export function buildWeeklyPlan(materias, opts = {}) {
  const goalMinutes = Math.max(0, Number(opts.goalMinutes) || 0);
  const currentMinutes = Math.max(0, Number(opts.currentMinutes) || 0);
  const now = opts.now instanceof Date ? opts.now : new Date(opts.now || new Date());
  const remainingMinutes = Math.max(0, goalMinutes - currentMinutes);
  const perDayMinutes = Math.ceil(remainingMinutes / PLAN_DAYS);

  const queue = buildStudyQueue(materias, now);
  const days = [];
  let cursor = 0;
  for (let i = 0; i < PLAN_DAYS; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    days.push({
      date: date.toISOString(),
      weekday: WEEKDAYS[date.getDay()],
      minutes: perDayMinutes,
      items: queue.slice(cursor, cursor + PLAN_MAX_ITEMS_PER_DAY),
    });
    cursor += PLAN_MAX_ITEMS_PER_DAY;
  }
  return { days, remainingMinutes, perDayMinutes, totalItems: queue.length };
}
