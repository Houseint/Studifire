import { getDb } from '../../core/db/client';
import { getDueTopics } from '../../shared/utils/fsrs';

// FASE 2.1 FSRS-lite: revisões vencidas do usuário (lê o JSON `topicos` existente).
// Retorna [] em vez de quebrar — reminder/IA chamam isso no boot.
export async function getDueTopicsForUser(userId, now = new Date()) {
  try {
    if (!userId) return [];
    const materias = await carregarMaterias(userId);
    return getDueTopics(materias, now);
  } catch {
    return [];
  }
}

export async function carregarMaterias(userId) {
  const db = await getDb();
  const rows = await db.getAllAsync(
    'SELECT * FROM subjects WHERE user_id = ? ORDER BY accessed_at DESC',
    [userId]
  );
  return rows.map(parseRow);
}

export async function getMateriaById(userId, id) {
  const db = await getDb();
  const row = await db.getFirstAsync(
    'SELECT * FROM subjects WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  return row ? parseRow(row) : null;
}

export async function criarMateria(userId, nome, topicos) {
  const db = await getDb();
  const now = new Date().toISOString();
  const result = await db.runAsync(
    'INSERT INTO subjects (nome, topicos, fixada, created_at, accessed_at, user_id) VALUES (?, ?, 0, ?, ?, ?)',
    [nome.trim(), JSON.stringify(topicos), now, now, userId]
  );
  return {
    id: result.lastInsertRowId,
    nome: nome.trim(),
    topicos,
    fixada: false,
    created_at: now,
    accessed_at: now,
  };
}

const UPDATE_WHITELIST = {
  nome: { sql: 'nome = ?', value: (v) => v },
  topicos: { sql: 'topicos = ?', value: (v) => JSON.stringify(v) },
  fixada: { sql: 'fixada = ?', value: (v) => (v ? 1 : 0) },
  accessed_at: { sql: 'accessed_at = ?', value: (v) => v },
};

export function buildUpdateSql(updates) {
  const sets = [];
  const vals = [];
  Object.keys(updates || {}).forEach((key) => {
    const column = UPDATE_WHITELIST[key];
    if (!column) return;
    sets.push(column.sql);
    vals.push(column.value(updates[key]));
  });
  return { sql: sets.join(', '), vals };
}

export async function atualizarMateria(userId, id, updates) {
  const db = await getDb();
  const { sql, vals } = buildUpdateSql(updates);
  if (!sql) return;
  vals.push(id, userId);
  await db.runAsync(
    `UPDATE subjects SET ${sql} WHERE id = ? AND user_id = ?`,
    vals
  );
}

export async function deletarMateria(userId, id) {
  const db = await getDb();
  await db.runAsync('DELETE FROM subjects WHERE id = ? AND user_id = ?', [id, userId]);
}

export async function registrarSessao(userId, subjectId, durationMinutes) {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.runAsync(
    'INSERT INTO sessions (subject_id, started_at, duration_minutes, user_id) VALUES (?, ?, ?, ?)',
    [subjectId, now, durationMinutes, userId]
  );
  await atualizarMateria(userId, subjectId, { accessed_at: now });
}

export async function toggleFixada(userId, id, atualmenteFixada) {
  return atualizarMateria(userId, id, { fixada: !atualmenteFixada });
}

export async function carregarHistorico(userId) {
  const db = await getDb();
  const rows = await db.getAllAsync(
    `SELECT s.*, sub.nome AS subject_nome FROM sessions s
     JOIN subjects sub ON s.subject_id = sub.id
     WHERE sub.user_id = ?
     ORDER BY s.started_at DESC`,
    [userId]
  );
  return rows;
}

export async function carregarSessoesPorMateria(userId, subjectId) {
  const db = await getDb();
  return db.getAllAsync(
    'SELECT * FROM sessions WHERE subject_id = ? AND user_id = ? ORDER BY started_at DESC',
    [subjectId, userId]
  );
}

// ===== Quiz pós-sessão (FASE 2.2) =====
// Guarda o resultado de cada quiz para evoluir o FSRS (acerto/erro ajusta difficulty).
export async function registrarQuizAttempt(userId, { subject_id, topic_index = null, topic_nome = null, questions_total = 0, questions_correct = 0 }) {
  const db = await getDb();
  const now = new Date().toISOString();
  const result = await db.runAsync(
    'INSERT INTO quiz_attempts (user_id, subject_id, topic_index, topic_nome, questions_total, questions_correct, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [userId, subject_id, topic_index, topic_nome, questions_total, questions_correct, now]
  );
  return {
    id: result.lastInsertRowId,
    user_id: userId,
    subject_id,
    topic_index,
    topic_nome,
    questions_total,
    questions_correct,
    created_at: now,
  };
}

export async function carregarQuizAttempts(userId, subjectId = null) {
  const db = await getDb();
  if (subjectId == null) {
    return db.getAllAsync(
      'SELECT * FROM quiz_attempts WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
  }
  return db.getAllAsync(
    'SELECT * FROM quiz_attempts WHERE user_id = ? AND subject_id = ? ORDER BY created_at DESC',
    [userId, subjectId]
  );
}

export async function criarConversa(userId) {
  const db = await getDb();
  const now = new Date().toISOString();
  const result = await db.runAsync(
    'INSERT INTO chat_conversations (titulo, created_at, user_id) VALUES (?, ?, ?)',
    ['Nova conversa', now, userId]
  );
  return { id: result.lastInsertRowId, titulo: 'Nova conversa', created_at: now };
}

export async function listarConversas(userId) {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT c.*,
      (SELECT content FROM chat_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS ultima_msg
     FROM chat_conversations c
     WHERE c.user_id = ?
     ORDER BY c.created_at DESC`,
    [userId]
  );
}

export async function getConversa(userId, id) {
  const db = await getDb();
  return db.getFirstAsync(
    'SELECT * FROM chat_conversations WHERE id = ? AND user_id = ?',
    [id, userId]
  );
}

export async function atualizarTituloConversa(userId, id, titulo) {
  const db = await getDb();
  await db.runAsync(
    'UPDATE chat_conversations SET titulo = ? WHERE id = ? AND user_id = ?',
    [titulo, id, userId]
  );
}

export async function deletarConversa(userId, id) {
  const db = await getDb();
  await db.runAsync(
    'DELETE FROM chat_messages WHERE conversation_id IN (SELECT id FROM chat_conversations WHERE id = ? AND user_id = ?)',
    [id, userId]
  );
  await db.runAsync(
    'DELETE FROM chat_conversations WHERE id = ? AND user_id = ?',
    [id, userId]
  );
}

export async function salvarMensagem(userId, conversationId, role, content) {
  const db = await getDb();
  const conv = await db.getFirstAsync(
    'SELECT 1 FROM chat_conversations WHERE id = ? AND user_id = ?',
    [conversationId, userId]
  );
  if (!conv) throw new Error('CONVERSATION_NOT_OWNED');
  if (role !== 'user' && role !== 'assistant') {
    throw new Error('INVALID_ROLE');
  }
  const now = new Date().toISOString();
  const result = await db.runAsync(
    'INSERT INTO chat_messages (conversation_id, role, content, created_at) VALUES (?, ?, ?, ?)',
    [conversationId, role, content, now]
  );
  return { id: result.lastInsertRowId, conversation_id: conversationId, role, content, created_at: now };
}

export async function carregarMensagens(userId, conversationId) {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT m.* FROM chat_messages m
     JOIN chat_conversations c ON m.conversation_id = c.id
     WHERE m.conversation_id = ? AND c.user_id = ?
     ORDER BY m.created_at ASC`,
    [conversationId, userId]
  );
}

export async function limparConversasAntigas(userId, limite = 20) {
  const db = await getDb();
  const todas = await db.getAllAsync(
    'SELECT id FROM chat_conversations WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
  if (todas.length > limite) {
    for (let i = limite; i < todas.length; i++) {
      await deletarConversa(userId, todas[i].id);
    }
  }
}

// ===== NOVAS FUNCTIONS PARA PROFILE =====

// User Settings
export async function getUserSettings(userId) {
  const db = await getDb();
  let settings = await db.getFirstAsync(
    'SELECT * FROM user_settings WHERE user_id = ?',
    [userId]
  );
  if (!settings) {
    // Cria settings padrão (inclui lembrete diário desligado às 20:00)
    const now = new Date().toISOString();
    await db.runAsync(
      'INSERT INTO user_settings (user_id, weekly_goal_minutes, reminder_enabled, reminder_hour, reminder_minute, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, 300, 0, 20, 0, now]
    );
    settings = { user_id: userId, weekly_goal_minutes: 300, reminder_enabled: 0, reminder_hour: 20, reminder_minute: 0, updated_at: now };
  }
  return settings;
}

export async function updateWeeklyGoal(userId, minutes) {
  const db = await getDb();
  const now = new Date().toISOString();
  // UPDATE (não REPLACE) para preservar as colunas do lembrete diário
  const res = await db.runAsync(
    'UPDATE user_settings SET weekly_goal_minutes = ?, updated_at = ? WHERE user_id = ?',
    [minutes, now, userId]
  );
  if (res.changes === 0) {
    await db.runAsync(
      'INSERT INTO user_settings (user_id, weekly_goal_minutes, reminder_enabled, reminder_hour, reminder_minute, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, minutes, 0, 20, 0, now]
    );
  }
  return { weekly_goal_minutes: minutes };
}

// Lembrete diário (notificações) — persistido no user_settings existente (RF01)
export async function updateReminderSettings(userId, { enabled, hour, minute }) {
  const db = await getDb();
  const now = new Date().toISOString();
  const flag = enabled ? 1 : 0;
  const res = await db.runAsync(
    'UPDATE user_settings SET reminder_enabled = ?, reminder_hour = ?, reminder_minute = ?, updated_at = ? WHERE user_id = ?',
    [flag, hour, minute, now, userId]
  );
  if (res.changes === 0) {
    const cur = await db.getFirstAsync(
      'SELECT weekly_goal_minutes FROM user_settings WHERE user_id = ?',
      [userId]
    );
    await db.runAsync(
      'INSERT INTO user_settings (user_id, weekly_goal_minutes, reminder_enabled, reminder_hour, reminder_minute, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, cur?.weekly_goal_minutes ?? 300, flag, hour, minute, now]
    );
  }
  return { reminder_enabled: flag, reminder_hour: hour, reminder_minute: minute };
}

// Badges
export async function getBadgeDefinitions() {
  const db = await getDb();
  return db.getAllAsync('SELECT * FROM badge_definitions');
}

export async function getUserBadges(userId) {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT ub.*, bd.name, bd.description, bd.icon, bd.color, bd.trigger_type, bd.trigger_value
     FROM user_badges ub
     JOIN badge_definitions bd ON ub.badge_id = bd.id
     WHERE ub.user_id = ?
     ORDER BY ub.unlocked_at DESC`,
    [userId]
  );
}

export async function checkAndAwardBadges(userId) {
  const db = await getDb();
  
  // Busca stats atuais do usuário
  const materias = await carregarMaterias(userId);
  const sessoes = await carregarHistorico(userId);
  
  const totalMinutos = sessoes.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
  const totalTopicos = materias.reduce((acc, m) => acc + (m.topicos?.filter(t => t.estudado).length || 0), 0);
  const totalMaterias = materias.length;
  const totalSessoes = sessoes.length;
  
  // Calcula streak
  const datasUnicas = [...new Set(sessoes.map(s => new Date(s.started_at).toDateString()))]
    .map(d => new Date(d)).sort((a, b) => b - a);
  let streak = 0;
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  for (let i = 0; i < datasUnicas.length; i++) {
    const esperado = new Date(hoje); esperado.setDate(hoje.getDate() - i);
    if (datasUnicas[i].toDateString() === esperado.toDateString()) streak++;
    else break;
  }
  
  // Calcula minutos esta semana
  const inicioSemana = new Date(); 
  inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
  inicioSemana.setHours(0,0,0,0);
  const minutosSemana = sessoes
    .filter(s => new Date(s.started_at) >= inicioSemana)
    .reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
  
  const stats = {
    total_minutes: totalMinutos,
    topics_completed: totalTopicos,
    subjects_count: totalMaterias,
    sessions_count: totalSessoes,
    streak_days: streak,
    weekly_minutes: minutosSemana,
  };
  
  // Busca badges não desbloqueados
  const allBadges = await getBadgeDefinitions();
  const userBadges = await getUserBadges(userId);
  const unlockedIds = new Set(userBadges.map(b => b.badge_id));
  
  const newlyUnlocked = [];
  const now = new Date().toISOString();
  
  for (const badge of allBadges) {
    if (unlockedIds.has(badge.id)) continue;
    
    let earned = false;
    switch (badge.trigger_type) {
      case 'total_minutes': earned = stats.total_minutes >= badge.trigger_value; break;
      case 'topics_completed': earned = stats.topics_completed >= badge.trigger_value; break;
      case 'subjects_count': earned = stats.subjects_count >= badge.trigger_value; break;
      case 'sessions_count': earned = stats.sessions_count >= badge.trigger_value; break;
      case 'streak_days': earned = stats.streak_days >= badge.trigger_value; break;
      case 'weekly_minutes': earned = stats.weekly_minutes >= badge.trigger_value; break;
    }
    
    if (earned) {
      await db.runAsync(
        'INSERT INTO user_badges (user_id, badge_id, unlocked_at) VALUES (?, ?, ?)',
        [userId, badge.id, now]
      );
      newlyUnlocked.push(badge);
    }
  }
  
  return newlyUnlocked;
}

// Métricas para Profile
export async function getProfileStats(userId) {
  const db = await getDb();
  const materias = await carregarMaterias(userId);
  const sessoes = await carregarHistorico(userId);
  
  const totalMinutos = sessoes.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
  const totalHoras = Math.round(totalMinutos / 60 * 10) / 10;
  
  const totalTopicos = materias.reduce((acc, m) => acc + (m.topicos?.length || 0), 0);
  const topicosConcluidos = materias.reduce((acc, m) => acc + (m.topicos?.filter(t => t.estudado).length || 0), 0);
  
  // Matéria mais estudada (por minutos)
  let materiaTop = null;
  let maxMinutos = 0;
  for (const m of materias) {
    const mins = sessoes
      .filter(s => s.subject_id === m.id)
      .reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
    if (mins > maxMinutos) {
      maxMinutos = mins;
      materiaTop = { nome: m.nome, minutos: mins };
    }
  }
  
  // Melhor dia da semana
  const diaMap = { 0: 'Domingo', 1: 'Segunda', 2: 'Terça', 3: 'Quarta', 4: 'Quinta', 5: 'Sexta', 6: 'Sábado' };
  const diaStats = {};
  for (const s of sessoes) {
    const dia = new Date(s.started_at).getDay();
    diaStats[dia] = (diaStats[dia] || 0) + (s.duration_minutes || 0);
  }
  let melhorDia = null;
  let maxDiaMin = 0;
  for (const [dia, mins] of Object.entries(diaStats)) {
    if (mins > maxDiaMin) {
      maxDiaMin = mins;
      melhorDia = diaMap[dia];
    }
  }
  
  // Média por sessão
  const mediaSessao = sessoes.length > 0 
    ? Math.round(totalMinutos / sessoes.length) 
    : 0;
  
  // Streak
  const datasUnicas = [...new Set(sessoes.map(s => new Date(s.started_at).toDateString()))]
    .map(d => new Date(d)).sort((a, b) => b - a);
  let streak = 0;
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  for (let i = 0; i < datasUnicas.length; i++) {
    const esperado = new Date(hoje); esperado.setDate(hoje.getDate() - i);
    if (datasUnicas[i].toDateString() === esperado.toDateString()) streak++;
    else break;
  }
  
  // Minutos esta semana
  const inicioSemana = new Date(); 
  inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
  inicioSemana.setHours(0,0,0,0);
  const minutosSemana = sessoes
    .filter(s => new Date(s.started_at) >= inicioSemana)
    .reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
  
  return {
    totalHoras,
    totalMinutos,
    totalTopicos,
    topicosConcluidos,
    totalMaterias: materias.length,
    totalSessoes: sessoes.length,
    materiaTop,
    melhorDia,
    mediaSessao,
    streak,
    minutosSemana,
  };
}

// Meta semanal progress
export async function getWeeklyGoalProgress(userId) {
  const settings = await getUserSettings(userId);
  const stats = await getProfileStats(userId);
  const goal = settings.weekly_goal_minutes;
  const current = stats.minutosSemana;
  const percent = goal > 0 ? Math.min(Math.round((current / goal) * 100), 100) : 0;
  return {
    goalMinutes: goal,
    currentMinutes: current,
    percent,
    goalHours: Math.round(goal / 60 * 10) / 10,
    currentHours: Math.round(current / 60 * 10) / 10,
  };
}

// ===== Topic Coach Cache (Detail Study Coach) =====
function topicKeyFromName(nome) {
  return (nome || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .slice(0, 80);
}

export async function getTopicCoachCache(userId, subjectId, topicName) {
  const db = await getDb();
  const key = topicKeyFromName(topicName);
  const row = await db.getFirstAsync(
    'SELECT payload FROM topic_coach_cache WHERE user_id = ? AND subject_id = ? AND topic_key = ?',
    [userId, subjectId, key],
  );
  if (!row) return null;
  try {
    return JSON.parse(row.payload);
  } catch {
    return null;
  }
}

export async function saveTopicCoachCache(userId, subjectId, topicName, payload) {
  const db = await getDb();
  const key = topicKeyFromName(topicName);
  const now = new Date().toISOString();
  await db.runAsync(
    'INSERT OR REPLACE INTO topic_coach_cache (user_id, subject_id, topic_key, payload, updated_at) VALUES (?, ?, ?, ?, ?)',
    [userId, subjectId, key, JSON.stringify(payload), now],
  );
  return payload;
}

export async function clearTopicCoachCache(userId, subjectId) {
  const db = await getDb();
  await db.runAsync('DELETE FROM topic_coach_cache WHERE user_id = ? AND subject_id = ?', [userId, subjectId]);
}

function parseRow(row) {
  return {
    id: row.id,
    nome: row.nome,
    topicos: JSON.parse(row.topicos || '[]'),
    fixada: !!row.fixada,
    created_at: row.created_at,
    accessed_at: row.accessed_at,
  };
}
