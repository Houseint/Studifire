import * as SQLite from 'expo-sqlite';

const DB_NAME = 'studify.db';

let dbPromise = null;
let initialized = false;

async function getDb() {
  if (!dbPromise) {
    // Se a abertura falhar, reseta a promise para que a próxima chamada
    // tente novamente (auto-recuperação) em vez de falhar para sempre.
    dbPromise = SQLite.openDatabaseAsync(DB_NAME).catch((error) => {
      dbPromise = null;
      throw error;
    });
  }
  const db = await dbPromise;

  if (!initialized) {
    try {
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS subjects (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome TEXT NOT NULL,
          topicos TEXT NOT NULL DEFAULT '[]',
          fixada INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL,
          accessed_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          subject_id INTEGER NOT NULL,
          started_at TEXT NOT NULL,
          duration_minutes INTEGER NOT NULL DEFAULT 0,
          FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS chat_conversations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          titulo TEXT NOT NULL DEFAULT 'Nova conversa',
          created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS chat_messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          conversation_id INTEGER NOT NULL,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at TEXT NOT NULL,
          FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
        );
        -- Novas tabelas para Profile
        CREATE TABLE IF NOT EXISTS user_settings (
          user_id INTEGER PRIMARY KEY,
          weekly_goal_minutes INTEGER NOT NULL DEFAULT 300, -- 5h default
          updated_at TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS badge_definitions (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          icon TEXT NOT NULL,
          color TEXT NOT NULL,
          trigger_type TEXT NOT NULL, -- 'total_minutes', 'streak_days', 'topics_completed', 'subjects_count', 'sessions_count'
          trigger_value INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS user_badges (
          user_id INTEGER NOT NULL,
          badge_id TEXT NOT NULL,
          unlocked_at TEXT NOT NULL,
          PRIMARY KEY (user_id, badge_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (badge_id) REFERENCES badge_definitions(id) ON DELETE CASCADE
        );
      `);

      const subCols = await db.getAllAsync("PRAGMA table_info(subjects)");
      if (!subCols.some((c) => c.name === 'user_id')) {
        await db.execAsync("ALTER TABLE subjects ADD COLUMN user_id INTEGER DEFAULT 1;");
      }

      const sessCols = await db.getAllAsync("PRAGMA table_info(sessions)");
      if (!sessCols.some((c) => c.name === 'user_id')) {
        await db.execAsync("ALTER TABLE sessions ADD COLUMN user_id INTEGER DEFAULT 1;");
      }

      const chatCols = await db.getAllAsync("PRAGMA table_info(chat_conversations)");
      if (!chatCols.some((c) => c.name === 'user_id')) {
        await db.execAsync("ALTER TABLE chat_conversations ADD COLUMN user_id INTEGER DEFAULT 1;");
      }

      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_subjects_user_accessed ON subjects (user_id, accessed_at DESC);
        CREATE INDEX IF NOT EXISTS idx_sessions_user_started ON sessions (user_id, started_at DESC);
        CREATE INDEX IF NOT EXISTS idx_sessions_subject ON sessions (subject_id);
        CREATE INDEX IF NOT EXISTS idx_chat_conversations_user ON chat_conversations (user_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages (conversation_id, created_at ASC);
        CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges (user_id);
      `);

      // Seed badge definitions
      const badgeCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM badge_definitions');
      if (badgeCount.count === 0) {
        const badges = [
          ['first_session', 'Primeiros Passos', 'Complete sua primeira sessão de estudos', '👣', '#8E97C4', 'sessions_count', 1],
          ['one_hour', 'Uma Hora', 'Acumule 60 minutos de estudo', '⏱', '#6F52FF', 'total_minutes', 60],
          ['week_active', 'Semana Ativa', 'Estude em 7 dias diferentes', '📅', '#4A90E2', 'sessions_count', 7],
          ['streak_7', 'Streak 7 Dias', 'Mantenha 7 dias consecutivos de estudo', '🔥', '#FFAA00', 'streak_days', 7],
          ['streak_30', 'Streak 30 Dias', 'Mantenha 30 dias consecutivos de estudo', '🔥✨', '#FF4444', 'streak_days', 30],
          ['collector', 'Colecionador', 'Crie 10 matérias', '📚', '#6F52FF', 'subjects_count', 10],
          ['topic_master', 'Mestre dos Tópicos', 'Conclua 50 tópicos', '✅', '#4CAF50', 'topics_completed', 50],
          ['marathoner', 'Maratonista', 'Estude 10 horas em uma semana', '🏃', '#FFD700', 'weekly_minutes', 600],
        ];
        for (const b of badges) {
          await db.runAsync(
            'INSERT INTO badge_definitions (id, name, description, icon, color, trigger_type, trigger_value) VALUES (?, ?, ?, ?, ?, ?, ?)',
            b
          );
        }
      }

      // Só marca como inicializado se TODAS as migrações concluírem.
      initialized = true;
    } catch (error) {
      // Migração falhou: reseta para permitir nova tentativa na próxima
      // chamada, sem deixar o schema em estado inconsistente.
      dbPromise = null;
      throw error;
    }
  }

  return db;
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
    // Cria settings padrão
    const now = new Date().toISOString();
    await db.runAsync(
      'INSERT INTO user_settings (user_id, weekly_goal_minutes, updated_at) VALUES (?, ?, ?)',
      [userId, 300, now]
    );
    settings = { user_id: userId, weekly_goal_minutes: 300, updated_at: now };
  }
  return settings;
}

export async function updateWeeklyGoal(userId, minutes) {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.runAsync(
    'INSERT OR REPLACE INTO user_settings (user_id, weekly_goal_minutes, updated_at) VALUES (?, ?, ?)',
    [userId, minutes, now]
  );
  return { weekly_goal_minutes: minutes };
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
