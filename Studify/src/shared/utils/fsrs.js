/**
 * Studify - Shared FSRS-lite utils (FASE 2.1)
 *
 * Memória inteligente mínima: cada tópico ganha dificuldade (1-4) e
 * data de revisão (due_date ISO). Sem tabela nova: tudo mora dentro do
 * JSON `topicos` existente em `subjects` — zero migração SQL.
 *
 * - Tópico antigo {nome, estudado} continua válido: campos novos têm default.
 * - Puro e sem imports: usável por Detail, Home, SmartNextSteps, reminder, IA.
 *
 * Intervalos (dias) por dificuldade:
 * 1 = fácil→1d · 2 = médio→3d (padrão) · 3 = difícil→7d · 4 = muito difícil→14d
 */

export const FSRS_INTERVALS = { 1: 1, 2: 3, 3: 7, 4: 14 };

export const FSRS_DEFAULT_DIFFICULTY = 2;

/**
 * Garante dificuldade 1-4 (inteiro). Qualquer valor inválido vira 2.
 * @param {*} d
 * @returns {number}
 */
export function clampDifficulty(d) {
  const n = Number(d);
  if (!Number.isFinite(n)) return FSRS_DEFAULT_DIFFICULTY;
  const i = Math.floor(n);
  if (i < 1) return 1;
  if (i > 4) return 4;
  return i;
}

/**
 * Calcula a próxima data de revisão (ISO) a partir de uma data base.
 * @param {number} difficulty 1-4
 * @param {Date|string} [fromDate=new Date()]
 * @returns {string} ISO string
 */
export function calcDueDate(difficulty, fromDate = new Date()) {
  const diff = clampDifficulty(difficulty);
  const days = FSRS_INTERVALS[diff] || FSRS_INTERVALS[2];
  const base = fromDate instanceof Date ? new Date(fromDate) : new Date(fromDate);
  if (Number.isNaN(base.getTime())) {
    const now = new Date();
    now.setDate(now.getDate() + days);
    return now.toISOString();
  }
  base.setDate(base.getDate() + days);
  return base.toISOString();
}

/**
 * Início do dia local (00:00) — base de comparação de "vence hoje".
 * @param {Date} [d=new Date()]
 * @returns {Date}
 */
export function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * Diz se o tópico está vencido (estudado + due_date <= hoje).
 * Tolerante ao formato antigo: sem due_date ou data inválida = não vencido.
 * @param {{estudado?:boolean, due_date?:string|null}} topic
 * @param {Date} [now=new Date()]
 * @returns {boolean}
 */
export function isTopicDue(topic, now = new Date()) {
  if (!topic || !topic.estudado) return false;
  if (!topic.due_date) return false;
  const due = new Date(topic.due_date);
  if (Number.isNaN(due.getTime())) return false;
  return startOfDay(due) <= startOfDay(now);
}

/**
 * Inverte o check do tópico aplicando a regra FSRS.
 * Marcar feito → estudado=true, reps+1, due_date calculada.
 * Desmarcar → estudado=false, due_date limpa (não cobra revisão).
 * Não muta o array original.
 * @param {Array} topicos
 * @param {number} index
 * @param {{difficulty?:number, now?:Date}} [opts]
 * @returns {Array}
 */
export function toggleTopicoWithFsrs(topicos, index, opts = {}) {
  const list = Array.isArray(topicos) ? topicos : [];
  const now = opts.now instanceof Date ? opts.now : new Date();
  return list.map((t, i) => {
    if (i !== index) return t;
    const cur = t && typeof t === 'object' ? t : { nome: String(t ?? '') };
    const willStudy = !cur.estudado;
    if (!willStudy) {
      return { ...cur, estudado: false, due_date: null };
    }
    const difficulty = clampDifficulty(cur.difficulty ?? opts.difficulty ?? FSRS_DEFAULT_DIFFICULTY);
    return {
      ...cur,
      estudado: true,
      difficulty,
      reps: (Number(cur.reps) || 0) + 1,
      due_date: calcDueDate(difficulty, now),
    };
  });
}

/**
 * Lista todos os tópicos vencidos de uma lista de matérias.
 * @param {Array} materias [{id, nome, topicos}]
 * @param {Date} [now=new Date()]
 * @returns {Array<{materiaId, materiaNome, topicoIndex, topicoNome, due_date, difficulty}>}
 */
export function getDueTopics(materias, now = new Date()) {
  const all = Array.isArray(materias) ? materias : [];
  const out = [];
  for (const m of all) {
    const tops = Array.isArray(m?.topicos) ? m.topicos : [];
    tops.forEach((t, idx) => {
      if (isTopicDue(t, now)) {
        out.push({
          materiaId: m?.id,
          materiaNome: m?.nome || 'Matéria',
          topicoIndex: idx,
          topicoNome: t?.nome || t?.titulo || 'tópico',
          due_date: t?.due_date || null,
          difficulty: clampDifficulty(t?.difficulty),
        });
      }
    });
  }
  out.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  return out;
}

/**
 * Formata due_date ISO como DD/MM para a UI.
 * @param {string} iso
 * @returns {string}
 */
export function formatDueDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * FASE 2.2 — aplica o resultado do quiz pós-sessão no tópico (fecha o ciclo FSRS).
 * Acertou quase tudo (>=80%) → tópico mais fácil, revisão mais longe.
 * Errou muito (<50%) → tópico mais difícil, revisão mais perto.
 * No meio (50-79%) → mantém a dificuldade, só reagenda.
 * Quiz conta como revisão: marca estudado, soma reps e recalcula due_date.
 * Não muta o array original.
 * @param {Array} topicos
 * @param {number} index
 * @param {{total?:number, correct?:number, now?:Date}} [result]
 * @returns {{topicos:Array, difficulty:number, score:number}}
 */
export function aplicarResultadoQuiz(topicos, index, result = {}) {
  const list = Array.isArray(topicos) ? topicos : [];
  const total = Number(result.total) || 0;
  const correct = Number(result.correct) || 0;
  const now = result.now instanceof Date ? result.now : new Date();
  if (total <= 0) {
    const cur = list[index];
    return { topicos: list, difficulty: clampDifficulty(cur?.difficulty), score: 0 };
  }
  const score = correct / total;
  const novos = list.map((t, i) => {
    if (i !== index) return t;
    const cur = t && typeof t === 'object' ? t : { nome: String(t ?? '') };
    const atual = clampDifficulty(cur.difficulty);
    const difficulty = score >= 0.8 ? Math.max(1, atual - 1) : score < 0.5 ? Math.min(4, atual + 1) : atual;
    return {
      ...cur,
      estudado: true,
      difficulty,
      reps: (Number(cur.reps) || 0) + 1,
      due_date: calcDueDate(difficulty, now),
    };
  });
  return { topicos: novos, difficulty: clampDifficulty(novos[index]?.difficulty), score };
}
