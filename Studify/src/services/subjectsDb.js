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
    initialized = true;
  }

  return db;
}

export async function carregarMaterias() {
  const db = await getDb();
  const rows = await db.getAllAsync(
    'SELECT * FROM subjects ORDER BY accessed_at DESC'
  );
  return rows.map(parseRow);
}

export async function getMateriaById(id) {
  const db = await getDb();
  const row = await db.getFirstAsync('SELECT * FROM subjects WHERE id = ?', [id]);
  return row ? parseRow(row) : null;
}

export async function criarMateria(nome, topicos) {
  const db = await getDb();
  const now = new Date().toISOString();
  const result = await db.runAsync(
    'INSERT INTO subjects (nome, topicos, fixada, created_at, accessed_at) VALUES (?, ?, 0, ?, ?)',
    [nome.trim(), JSON.stringify(topicos), now, now]
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

export async function atualizarMateria(id, updates) {
  const db = await getDb();
  const sets = [];
  const vals = [];
  if (updates.nome !== undefined) {
    sets.push('nome = ?');
    vals.push(updates.nome);
  }
  if (updates.topicos !== undefined) {
    sets.push('topicos = ?');
    vals.push(JSON.stringify(updates.topicos));
  }
  if (updates.fixada !== undefined) {
    sets.push('fixada = ?');
    vals.push(updates.fixada ? 1 : 0);
  }
  if (updates.accessed_at !== undefined) {
    sets.push('accessed_at = ?');
    vals.push(updates.accessed_at);
  }
  if (sets.length === 0) return;
  vals.push(id);
  await db.runAsync(
    `UPDATE subjects SET ${sets.join(', ')} WHERE id = ?`,
    vals
  );
}

export async function deletarMateria(id) {
  const db = await getDb();
  await db.runAsync('DELETE FROM sessions WHERE subject_id = ?', [id]);
  await db.runAsync('DELETE FROM subjects WHERE id = ?', [id]);
}

export async function registrarSessao(subjectId, durationMinutes) {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.runAsync(
    'INSERT INTO sessions (subject_id, started_at, duration_minutes) VALUES (?, ?, ?)',
    [subjectId, now, durationMinutes]
  );
  await atualizarMateria(subjectId, { accessed_at: now });
}

export async function toggleFixada(id, atualmenteFixada) {
  return atualizarMateria(id, { fixada: !atualmenteFixada });
}

export async function carregarHistorico() {
  const db = await getDb();
  const rows = await db.getAllAsync(
    'SELECT s.*, sub.nome AS subject_nome FROM sessions s JOIN subjects sub ON s.subject_id = sub.id ORDER BY s.started_at DESC'
  );
  return rows;
}

export async function carregarSessoesPorMateria(subjectId) {
  const db = await getDb();
  return db.getAllAsync(
    'SELECT * FROM sessions WHERE subject_id = ? ORDER BY started_at DESC',
    [subjectId]
  );
}

export async function criarConversa() {
  const db = await getDb();
  const now = new Date().toISOString();
  const result = await db.runAsync(
    'INSERT INTO chat_conversations (titulo, created_at) VALUES (?, ?)',
    ['Nova conversa', now]
  );
  return { id: result.lastInsertRowId, titulo: 'Nova conversa', created_at: now };
}

export async function listarConversas() {
  const db = await getDb();
  return db.getAllAsync(
    'SELECT c.*, (SELECT content FROM chat_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS ultima_msg FROM chat_conversations c ORDER BY c.created_at DESC'
  );
}

export async function getConversa(id) {
  const db = await getDb();
  return db.getFirstAsync('SELECT * FROM chat_conversations WHERE id = ?', [id]);
}

export async function atualizarTituloConversa(id, titulo) {
  const db = await getDb();
  await db.runAsync('UPDATE chat_conversations SET titulo = ? WHERE id = ?', [titulo, id]);
}

export async function deletarConversa(id) {
  const db = await getDb();
  await db.runAsync('DELETE FROM chat_messages WHERE conversation_id = ?', [id]);
  await db.runAsync('DELETE FROM chat_conversations WHERE id = ?', [id]);
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

export async function carregarMensagens(conversationId) {
  const db = await getDb();
  return db.getAllAsync(
    'SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC',
    [conversationId]
  );
}

export async function limparConversasAntigas(limite = 20) {
  const db = await getDb();
  const todas = await db.getAllAsync('SELECT id FROM chat_conversations ORDER BY created_at DESC');
  if (todas.length > limite) {
    for (let i = limite; i < todas.length; i++) {
      await deletarConversa(todas[i].id);
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
