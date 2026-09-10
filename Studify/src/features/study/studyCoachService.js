/**
 * Studify - Study Coach Service (Detail revitalizado)
 *
 * 1 call Groq -> {explicacao, recursos, metodo, quiz}
 * Usa topic_coach_cache (SQLite) para não re-gastar tokens.
 * Rate limiter já no groqClient (free guard).
 */
import { groqChatCompletion } from '../../core/api/groqClient';
import { getTopicCoachCache, saveTopicCoachCache } from '../subjects/subjectsDb';

const CACHE_TTL_DAYS = 7;
const CACHE_VERSION = 3; // bump: 2 era decimal exato (√13≈3,6), 3 prefere inteiros leves

function isFresh(payload) {
  if (!payload?.geradoEm) return false;
  if (payload.version !== CACHE_VERSION) return false; // força regerar após prompt fix
  const ageMs = Date.now() - new Date(payload.geradoEm).getTime();
  return ageMs < CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;
}

function buildCoachPrompt(materiaNome, topicoNome, outrosTopicos) {
  const outros = (outrosTopicos || []).filter((t) => t !== topicoNome).slice(0, 5).join(', ') || 'nenhum';
  return {
    system: `Você é um tutor especialista do Studify. Retorne APENAS JSON válido com as chaves:
{
  "explicacao": "string 1-2 parágrafos curtos (máx 500 chars), PT-BR, Feynman",
  "recursos": [
    {"tipo": "video", "titulo": "Título curto", "query": "termo de busca"},
    {"tipo": "artigo", "titulo": "...", "query": "..."},
    {"tipo": "exercicio", "titulo": "...", "query": "..."}
  ],
  "metodo": {"nome": "Pomodoro 25/5 | Feynman | Active Recall | Bloco 50/10", "motivo": "1 linha por que p/ ESTE tópico", "duracao": 25, "pausa": 5},
  "quiz": {"pergunta": "1 pergunta objetiva", "alternativas": ["A","B","C","D"], "correta": 0, "explicacao": "por que a correta"}
}
REGRAS CRÍTICAS:
- explicacao máx 500 chars, sem alucinar.
- recursos: só query, máx 3.
- metodo duracao 25 ou 50, pausa 5 ou 10.
- QUIZ LEVE (preferência do usuário: respostas INTEIRAS, sem decimais cansativos):
  1. Prefira quiz cuja "correta" é NÚMERO INTEIRO ou conceito curto. EVITE decimais quebrados (ex: NÃO pergunte √13≈3,605...).
  2. Se tópico é cálculo que naturalmente dá decimal quebrado, GERE QUIZ CONCEITUAL ao invés (ex: "O que significa √?" ou "√16=?" que dá 4, não √13).
  3. Se for cálculo, use apenas números que fecham inteiro: quadrados perfeitos (√16, √25), Pitágoras 3-4-5, tabuada, etc. Nunca √13, √7, etc.
  4. Antes de marcar "correta", recalcule 1x e garanta que índice aponta pro inteiro correto.
  5. "explicacao" curta, 1 linha que prova (ex: "√16=4 porque 4×4=16").
- Seja CONCISO.`,
    user: `Matéria: "${materiaNome}"\nTópico foco: "${topicoNome}"\nOutros: [${outros}]\nGere coach:`,
  };
}

/**
 * Busca assist do cache ou gera via Groq e salva.
 * @param {number} userId
 * @param {number} subjectId
 * @param {string} materiaNome
 * @param {string} topicoNome
 * @param {string[]} outrosTopicos
 * @param {Object} opts {forceRefresh:boolean}
 * @returns {Promise<{explicacao:string, recursos:Array, metodo:Object, quiz:Object, fromCache:boolean}>}
 */
export async function getTopicAssist(userId, subjectId, materiaNome, topicoNome, outrosTopicos = [], opts = {}) {
  if (!topicoNome || !materiaNome) throw new Error('TOPICO_MATERIA_OBRIGATORIOS');

  // cache first (unless forceRefresh)
  if (!opts.forceRefresh) {
    try {
      const cached = await getTopicCoachCache(userId, subjectId, topicoNome);
      if (cached && isFresh(cached)) {
        return { ...cached, fromCache: true };
      }
    } catch (_) {}
  }

  const { system, user } = buildCoachPrompt(materiaNome, topicoNome, outrosTopicos);

  // gpt-oss: low economiza token mas prejudica conta; medium + temp baixa melhora precisão matemática (raiz 13)
  let raw = await groqChatCompletion(
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    { temperature: 0.3, max_tokens: 1400, response_format: { type: 'json_object' }, reasoning_effort: 'medium' },
  );

  if (typeof raw === 'string' && raw.startsWith('⏳')) throw new Error(raw);
  if (typeof raw === 'string' && raw.startsWith('Configure')) throw new Error(raw);
  // Groq retorna "Erro na API: Failed to generate JSON. max completion tokens..." quando estoura
  if (typeof raw === 'string' && raw.startsWith('Erro na API')) {
    // se for json_validate_failed por tokens, tenta 1 retry com 1600
    if (raw.includes('json_validate_failed') || raw.includes('max completion tokens') || raw.includes('Failed to generate JSON')) {
      console.warn('[studyCoach] retry por json_validate_failed, max_tokens 1600');
      raw = await groqChatCompletion(
        [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        { temperature: 0.3, max_tokens: 1600, response_format: { type: 'json_object' }, reasoning_effort: 'medium' },
      );
      if (typeof raw === 'string' && raw.startsWith('Erro na API')) throw new Error('IA sobrecarregada, tente novamente em alguns segundos.');
    } else {
      throw new Error(raw);
    }
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (_) {
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) {
      try { parsed = JSON.parse(m[0]); } catch (_) {}
    }
  }
  if (!parsed || !parsed.explicacao) {
    throw new Error('Resposta IA inválida');
  }

  // sanitiza
  const payload = {
    version: CACHE_VERSION,
    explicacao: String(parsed.explicacao).slice(0, 2000),
    recursos: Array.isArray(parsed.recursos) ? parsed.recursos.slice(0, 3).map((r) => ({
      tipo: String(r.tipo || 'artigo').slice(0, 12),
      titulo: String(r.titulo || r.query || 'Recurso').slice(0, 80),
      query: String(r.query || r.titulo || topicoNome).slice(0, 100),
    })) : [],
    metodo: parsed.metodo && typeof parsed.metodo === 'object' ? {
      nome: String(parsed.metodo.nome || 'Pomodoro 25/5').slice(0, 30),
      motivo: String(parsed.metodo.motivo || 'Foco em blocos').slice(0, 120),
      duracao: Number(parsed.metodo.duracao) === 50 ? 50 : 25,
      pausa: Number(parsed.metodo.pausa) === 10 ? 10 : 5,
    } : { nome: 'Pomodoro 25/5', motivo: 'Tema denso', duracao: 25, pausa: 5 },
    quiz: parsed.quiz && typeof parsed.quiz === 'object' ? {
      pergunta: String(parsed.quiz.pergunta || '').slice(0, 300),
      alternativas: Array.isArray(parsed.quiz.alternativas) ? parsed.quiz.alternativas.slice(0, 4).map((s) => String(s).slice(0, 120)) : [],
      correta: Number.isInteger(parsed.quiz.correta) ? parsed.quiz.correta : 0,
      explicacao: String(parsed.quiz.explicacao || '').slice(0, 300),
    } : null,
    geradoEm: new Date().toISOString(),
    materiaNome,
    topicoNome,
  };

  if (payload.recursos.length === 0) {
    payload.recursos = [
      { tipo: 'video', titulo: `${topicoNome} - Khan Academy`, query: `${materiaNome} ${topicoNome} Khan Academy` },
      { tipo: 'artigo', titulo: `${topicoNome} resumo`, query: `${topicoNome} ${materiaNome} resumo` },
    ];
  }

  // salva cache async (não bloqueia retorno se falhar, mas tenta)
  try {
    await saveTopicCoachCache(userId, subjectId, topicoNome, payload);
  } catch (e) {
    console.warn('[studyCoach] falha ao salvar cache', e?.message);
  }

  return { ...payload, fromCache: false };
}

export function buildSearchUrl(query, tipo) {
  const q = encodeURIComponent(query);
  if (tipo === 'video') return `https://www.youtube.com/results?search_query=${q}`;
  return `https://www.google.com/search?q=${q}`;
}
