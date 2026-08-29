import { groqChatCompletion } from '../core/api/groqClient';
import { carregarMaterias, getProfileStats } from './subjectsDb';

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
