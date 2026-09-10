import { groqChatCompletion } from '../../core/api/groqClient';
import { carregarMaterias, getProfileStats } from '../subjects/subjectsDb';
import { getDueTopics } from '../../shared/utils/fsrs';

export const SYSTEM_PROMPT = `Você é um assistente de estudos do app Studify.
Responda APENAS sobre: matérias escolares, métodos de estudo,
planejamento de estudos, dicas de aprendizado e motivação educacional.
Se o usuário perguntar algo fora disso, responda:
"Meu propósito é ajudar com seus estudos 📚. Pergunte-me sobre matérias, métodos de estudo ou dicas educacionais!"
Sempre responda em português brasileiro, de forma clara e amigável.
Seja conciso — no máximo 4 parágrafos.`;

export async function enviarMensagem(mensagens) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...mensagens.map((m) => ({
      role: m.role,
      content: m.text,
    })),
  ];

  return groqChatCompletion(messages, {
    temperature: 0.7,
    max_tokens: 512,
    reasoning_effort: 'low',
  });
}

/**
 * Passo 1.1 - IA Contextual (RAG Local)
 * Busca stats e matérias do SQLite e injeta no system prompt.
 * Fail-safe: se DB falhar ou userId null, cai para enviarMensagem (sem contexto).
 *
 * @param {number} userId - id do usuário logado
 * @param {Array<{role:string, text:string}>} mensagens - histórico {role, text}
 * @returns {Promise<string>}
 */
export async function enviarMensagemContextual(userId, mensagens) {
  let systemContent = SYSTEM_PROMPT;

  if (userId) {
    try {
      const contextStr = await buildUserContext(userId);
      if (contextStr) {
        systemContent = `${SYSTEM_PROMPT}\n\n${contextStr}`;
      }
    } catch (e) {
      console.warn('[aiService] falha ao montar contexto, usando prompt base:', e?.message);
    }
  }

  const messages = [
    { role: 'system', content: systemContent },
    ...mensagens.map((m) => ({
      role: m.role,
      content: m.text,
    })),
  ];

  return groqChatCompletion(messages, {
    temperature: 0.7,
    max_tokens: 512,
    reasoning_effort: 'low',
  });
}

/**
 * Monta string de contexto com dados reais do app.
 * Limitada para não estourar tokens: máx 8 matérias, 3 tópicos pendentes cada.
 * @param {number} userId
 * @returns {Promise<string>}
 */
export async function buildUserContext(userId) {
  const [materias, stats] = await Promise.all([
    carregarMaterias(userId).catch(() => []),
    getProfileStats(userId).catch(() => null),
  ]);

  if (!stats) return '';

  const linhas = [];
  linhas.push('Contexto do usuário (dados reais do app Studify):');
  linhas.push(
    `- Resumo: ${stats.totalMaterias} matérias, ${stats.totalTopicos} tópicos (${stats.topicosConcluidos} concluídos), ${stats.totalSessoes} sessões, ${stats.totalHoras}h estudadas.`,
  );
  linhas.push(`- Streak atual: ${stats.streak} dia(s) consecutivo(s).`);
  linhas.push(`- Minutos esta semana: ${stats.minutosSemana}min (média ${stats.mediaSessao}min/sessão).`);
  if (stats.materiaTop) {
    linhas.push(`- Matéria mais estudada: ${stats.materiaTop.nome} (${stats.materiaTop.minutos}min).`);
  }
  if (stats.melhorDia) {
    linhas.push(`- Melhor dia da semana: ${stats.melhorDia}.`);
  }
  // FASE 2.1: IA sabe o que está vencido e pode cobrar revisão.
  try {
    const due = getDueTopics(materias);
    if (due.length > 0) {
      const nomes = due.slice(0, 5).map((d) => `${d.topicoNome} (${d.materiaNome})`).join(', ');
      const resto = due.length > 5 ? ` +${due.length - 5}` : '';
      linhas.push(`- Revisões vencendo hoje: ${due.length} — ${nomes}${resto}.`);
    }
  } catch {
    // contexto de revisão é opcional
  }

  if (materias.length > 0) {
    linhas.push('- Matérias (nome | progresso | pendentes):');
    const topMaterias = materias.slice(0, 8);
    for (const m of topMaterias) {
      const total = m.topicos?.length || 0;
      const feitos = m.topicos?.filter((t) => t.estudado).length || 0;
      const pct = total > 0 ? Math.round((feitos / total) * 100) : 0;
      const pendentes = (m.topicos || [])
        .filter((t) => !t.estudado)
        .slice(0, 3)
        .map((t) => t.nome || t.titulo || 'tópico')
        .join(', ');
      const pendStr = pendentes ? ` | pendentes: ${pendentes}` : ' | sem pendentes';
      linhas.push(`  • ${m.nome} | ${pct}% (${feitos}/${total})${pendStr}`);
    }
    if (materias.length > 8) {
      linhas.push(`  ... e mais ${materias.length - 8} matéria(s).`);
    }
  } else {
    linhas.push('- Nenhuma matéria cadastrada ainda.');
  }

  linhas.push(
    'Use esses dados para personalizar a resposta. Se o usuário perguntar "como estou?", "o que estudar?", "onde estou fraco?", use-os diretamente. Nunca invente dados.',
  );

  return linhas.join('\n');
}

// --- Utils ---
function normalizeTopico(s) {
  return (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * 1.2 Gerador híbrido (C 1,2,3) — gera tópicos complementares com IA.
 * Exige >=1 tópico existente para contextualizar (trava de UX).
 * Dedup por normalize, limita ao MAX_TOPICOS (10) e preview editável fora.
 *
 * @param {string} nomeMateria
 * @param {Array<string|{nome:string}>} topicosExistentes
 * @param {Object} opts
 * @param {number} [opts.maxTotal=10]
 * @returns {Promise<{topicos:Array<{nome:string,estudado:boolean}>, raw:string}>}
 */
export async function gerarTopicosComplementares(nomeMateria, topicosExistentes = [], opts = {}) {
  const maxTotal = opts.maxTotal || 10;
  const existentesNomes = (topicosExistentes || [])
    .map((t) => (typeof t === 'string' ? t : t?.nome || t?.titulo || ''))
    .map((s) => s.trim())
    .filter(Boolean);

  const existentesSet = new Set(existentesNomes.map(normalizeTopico));
  const slots = maxTotal - existentesNomes.length;
  if (slots <= 0) {
    return { topicos: [], reason: 'limite_atingido', raw: '' };
  }
  if (!nomeMateria || nomeMateria.trim().length < 3) {
    throw new Error('NOME_INVALIDO');
  }
  if (existentesNomes.length < 1) {
    throw new Error('PRECISA_1_TOPICO');
  }

  const qtd = Math.min(slots, 7);
  const system = `Você é um curador especialista que quebra matérias em tópicos atômicos e acionáveis para estudo.
Regras:
- Gere exatamente ${qtd} tópicos COMPLEMENTARES (não repita nenhum existente).
- Tópicos curtos (2-5 palavras), específicos, sem numeração, sem repetição, em PT-BR.
- Evite generalidades; prefira subtópicos acionáveis que um estudante pode marcar como feito em 1 sessão.
- Retorne APENAS JSON válido no formato {"topicos": ["nome1", "nome2", ...]}.`;

  const user = `Matéria: "${nomeMateria.trim()}"
Tópicos já existentes: [${existentesNomes.join(', ')}]
Gere ${qtd} complementares:`;

  let raw = await groqChatCompletion(
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    { temperature: 0.6, max_tokens: 600, response_format: { type: 'json_object' }, reasoning_effort: 'low' },
  );
  if (typeof raw === 'string' && raw.startsWith('Erro na API') && raw.includes('Failed to generate JSON')) {
    console.warn('[aiService] retry topicos por json_validate_failed');
    raw = await groqChatCompletion(
      [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      { temperature: 0.5, max_tokens: 900, response_format: { type: 'json_object' }, reasoning_effort: 'low' },
    );
  }

  // rate limiter guard retorna mensagem com ⏳
  if (typeof raw === 'string' && raw.startsWith('⏳')) {
    throw new Error(raw);
  }
  if (typeof raw === 'string' && raw.startsWith('Configure')) {
    throw new Error(raw);
  }
  if (typeof raw === 'string' && raw.startsWith('Erro na API')) {
    throw new Error('Não foi possível gerar tópicos, tente novamente em alguns segundos.');
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (_) {
    // tenta extrair JSON de dentro do texto
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        parsed = JSON.parse(m[0]);
      } catch (_) {}
    }
  }

  let lista = [];
  if (parsed) {
    if (Array.isArray(parsed.topicos)) lista = parsed.topicos;
    else if (Array.isArray(parsed.topics)) lista = parsed.topics;
    else if (Array.isArray(parsed)) lista = parsed;
  }

  const filtrados = [];
  const seen = new Set(existentesSet);
  for (const item of lista) {
    const nome = typeof item === 'string' ? item.trim() : (item?.nome || item?.titulo || '').trim();
    if (!nome || nome.length < 2 || nome.length > 60) continue;
    const norm = normalizeTopico(nome);
    if (seen.has(norm)) continue;
    seen.add(norm);
    filtrados.push({ nome, estudado: false });
    if (filtrados.length >= qtd) break;
  }

  return { topicos: filtrados, raw };
}

/**
 * 2.2 Quiz pós-sessão — gera perguntas de múltipla escolha sobre a matéria.
 * Mesmo padrão do gerador de tópicos: guards de erro + parse JSON com fallback.
 * Nunca quebra o fluxo de estudo: qualquer falha da IA vira throw com mensagem
 * amigável e a DetailScreen oferece o quiz só quando há questões válidas.
 *
 * @param {string} nomeMateria
 * @param {Array<string|{nome:string}>} topicosFoco nomes dos tópicos estudados
 * @param {Object} opts
 * @param {number} [opts.qtd=3] quantidade de questões (1-5)
 * @returns {Promise<{questoes:Array<{pergunta:string, alternativas:Array<string>, correta:number}>, raw:string}>}
 */
export async function gerarQuiz(nomeMateria, topicosFoco = [], opts = {}) {
  const qtd = Math.min(Math.max(Number(opts.qtd) || 3, 1), 5);
  if (!nomeMateria || nomeMateria.trim().length < 2) {
    throw new Error('NOME_INVALIDO');
  }
  const foco = (topicosFoco || [])
    .map((t) => (typeof t === 'string' ? t : t?.nome || t?.titulo || ''))
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5);
  if (foco.length < 1) {
    throw new Error('SEM_TOPICOS');
  }

  const system = `Você é um professor que cria quizzes rápidos de revisão em PT-BR.
Regras:
- Gere exatamente ${qtd} questões de múltipla escolha sobre os tópicos dados.
- Cada questão: 1 pergunta objetiva + 4 alternativas curtas + índice da correta (0-3).
- Varie a posição da resposta correta; sem pegadinhas, sem "todas as anteriores".
- Retorne APENAS JSON válido no formato {"questoes": [{"pergunta": "...", "alternativas": ["a", "b", "c", "d"], "correta": 0}]}.`;

  const user = `Matéria: "${nomeMateria.trim()}"
Tópicos estudados: [${foco.join(', ')}]
Gere ${qtd} questões:`;

  let raw = await groqChatCompletion(
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    { temperature: 0.6, max_tokens: 900, response_format: { type: 'json_object' }, reasoning_effort: 'low' },
  );

  // rate limiter guard retorna mensagem com ⏳
  if (typeof raw === 'string' && raw.startsWith('⏳')) {
    throw new Error(raw);
  }
  if (typeof raw === 'string' && raw.startsWith('Configure')) {
    throw new Error(raw);
  }
  if (typeof raw === 'string' && raw.startsWith('Erro na API')) {
    throw new Error('Não foi possível gerar o quiz, tente novamente em alguns segundos.');
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (_) {
    // tenta extrair JSON de dentro do texto
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        parsed = JSON.parse(m[0]);
      } catch (_) {}
    }
  }

  let lista = [];
  if (parsed) {
    if (Array.isArray(parsed.questoes)) lista = parsed.questoes;
    else if (Array.isArray(parsed.questions)) lista = parsed.questions;
    else if (Array.isArray(parsed)) lista = parsed;
  }

  const questoes = [];
  for (const item of lista) {
    const pergunta = (item?.pergunta || item?.question || '').trim();
    const alternativas = Array.isArray(item?.alternativas)
      ? item.alternativas
      : Array.isArray(item?.options)
        ? item.options
        : [];
    const correta = Number(item?.correta ?? item?.correct ?? item?.answer);
    if (!pergunta || pergunta.length < 5) continue;
    const alts = alternativas.map((a) => String(a ?? '').trim()).filter(Boolean).slice(0, 4);
    if (alts.length !== 4) continue;
    if (!Number.isInteger(correta) || correta < 0 || correta > 3) continue;
    questoes.push({ pergunta, alternativas: alts, correta });
    if (questoes.length >= qtd) break;
  }

  return { questoes, raw };
}
