import * as SQLite from 'expo-sqlite';

const DB_NAME = 'studify.db';

let dbPromise = null;
let initialized = false;

async function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  const db = await dbPromise;

  if (!initialized) {
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
    `);

    initialized = true;
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
  await db.runAsync(
    'DELETE FROM sessions WHERE subject_id = ? AND subject_id IN (SELECT id FROM subjects WHERE user_id = ?)',
    [id, userId]
  );
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

export async function salvarMensagem(conversationId, role, content) {
  const db = await getDb();
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
