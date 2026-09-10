/**
 * Studify - Core DB Client (singleton)
 *
 * Passo 1.0 - FASE 1: elimina race condition de `getDb()` duplicado.
 * Antes: authDb.js e subjectsDb.js abriam `studify.db` separados com
 * `SQLite.openDatabaseAsync` cada um + `initialized` flag duplicada.
 * Agora: singleton único com inicialização idempotente e auto-recuperação.
 *
 * Zero breaking: mantém mesmo DB_NAME, WAL e todas as migrations.
 * Futuro: aqui vivem todas as `execAsync` + seed + PRAGMAs.
 */
import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';

const DB_NAME = process.env.EXPO_PUBLIC_DB_NAME || 'studify.db';

let dbPromise = null;
let initialized = false;

// --- Helpers para migração de senha legada (copiado de authDb, sem dependência circular) ---
function base64Encode(bytes) {
  const binary = String.fromCharCode(...bytes);
  if (typeof btoa !== 'undefined') {
    return btoa(binary);
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  for (let i = 0; i < binary.length; i += 3) {
    const b1 = binary.charCodeAt(i);
    const b2 = binary.charCodeAt(i + 1) || 0;
    const b3 = binary.charCodeAt(i + 2) || 0;
    const triplet = (b1 << 16) | (b2 << 8) | b3;
    result += chars[(triplet >> 18) & 0x3f];
    result += chars[(triplet >> 12) & 0x3f];
    result += chars[(triplet >> 6) & 0x3f];
    result += chars[triplet & 0x3f];
  }
  const mod = binary.length % 3;
  if (mod === 1) return result.slice(0, -2) + '==';
  if (mod === 2) return result.slice(0, -1) + '=';
  return result;
}

const SALT_BYTES = 16;
async function gerarSalt() {
  const bytes = await Crypto.getRandomBytesAsync(SALT_BYTES);
  return base64Encode(bytes);
}
async function createHashComSalt(salt, senha) {
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}${senha}`,
  );
  return `${salt}:${hash}`;
}
async function hashPassword(senha) {
  const salt = await gerarSalt();
  return createHashComSalt(salt, senha);
}

/**
 * Retorna a instância singleton do SQLite.
 * Idempotente: múltiplas chamadas concorrentes compartilham a mesma promise.
 * Auto-recuperação: se open ou migrations falharem, reseta para próxima tentativa.
 */
export async function getDb() {
  if (!dbPromise) {
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

        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL UNIQUE,
          senha_hash TEXT NOT NULL,
          created_at TEXT NOT NULL,
          avatar TEXT
        );

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

        CREATE TABLE IF NOT EXISTS user_settings (
          user_id INTEGER PRIMARY KEY,
          weekly_goal_minutes INTEGER NOT NULL DEFAULT 300,
          reminder_enabled INTEGER NOT NULL DEFAULT 0,
          reminder_hour INTEGER NOT NULL DEFAULT 20,
          reminder_minute INTEGER NOT NULL DEFAULT 0,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS badge_definitions (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          icon TEXT NOT NULL,
          color TEXT NOT NULL,
          trigger_type TEXT NOT NULL,
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

        CREATE TABLE IF NOT EXISTS topic_coach_cache (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          subject_id INTEGER NOT NULL,
          topic_key TEXT NOT NULL,
          payload TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          UNIQUE(user_id, subject_id, topic_key),
          FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS quiz_attempts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          subject_id INTEGER NOT NULL,
          topic_index INTEGER,
          topic_nome TEXT,
          questions_total INTEGER NOT NULL DEFAULT 0,
          questions_correct INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL,
          FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS subject_goals (
          user_id INTEGER NOT NULL,
          subject_id INTEGER NOT NULL,
          weekly_minutes INTEGER NOT NULL DEFAULT 0,
          updated_at TEXT NOT NULL,
          PRIMARY KEY (user_id, subject_id),
          FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `);

      // --- Migrações users ---
      const columns = await db.getAllAsync('PRAGMA table_info(users);');
      const hasSenhaHash = columns.some((c) => c.name === 'senha_hash');
      const hasSenhaPlain = columns.some((c) => c.name === 'senha');
      const hasAvatar = columns.some((c) => c.name === 'avatar');

      if (!hasSenhaHash) {
        await db.execAsync('ALTER TABLE users ADD COLUMN senha_hash TEXT;');
      }
      if (hasSenhaPlain) {
        const users = await db.getAllAsync(
          "SELECT id, senha FROM users WHERE senha_hash IS NULL OR senha_hash = '';",
        );
        for (const user of users) {
          if (user.senha) {
            const hash = await hashPassword(user.senha);
            await db.runAsync('UPDATE users SET senha_hash = ? WHERE id = ?;', [
              hash,
              user.id,
            ]);
          }
        }
      }
      if (!hasAvatar) {
        await db.execAsync('ALTER TABLE users ADD COLUMN avatar TEXT;');
      }

      // --- Migrações subjects/sessions/chat ---
      const subCols = await db.getAllAsync('PRAGMA table_info(subjects)');
      if (!subCols.some((c) => c.name === 'user_id')) {
        await db.execAsync('ALTER TABLE subjects ADD COLUMN user_id INTEGER DEFAULT 1;');
      }
      const sessCols = await db.getAllAsync('PRAGMA table_info(sessions)');
      if (!sessCols.some((c) => c.name === 'user_id')) {
        await db.execAsync('ALTER TABLE sessions ADD COLUMN user_id INTEGER DEFAULT 1;');
      }
      const chatCols = await db.getAllAsync('PRAGMA table_info(chat_conversations)');
      if (!chatCols.some((c) => c.name === 'user_id')) {
        await db.execAsync('ALTER TABLE chat_conversations ADD COLUMN user_id INTEGER DEFAULT 1;');
      }

      // --- Migração user_settings (lembrete diário) ---
      const setCols = await db.getAllAsync('PRAGMA table_info(user_settings)');
      if (!setCols.some((c) => c.name === 'reminder_enabled')) {
        await db.execAsync('ALTER TABLE user_settings ADD COLUMN reminder_enabled INTEGER NOT NULL DEFAULT 0;');
      }
      if (!setCols.some((c) => c.name === 'reminder_hour')) {
        await db.execAsync('ALTER TABLE user_settings ADD COLUMN reminder_hour INTEGER NOT NULL DEFAULT 20;');
      }
      if (!setCols.some((c) => c.name === 'reminder_minute')) {
        await db.execAsync('ALTER TABLE user_settings ADD COLUMN reminder_minute INTEGER NOT NULL DEFAULT 0;');
      }

      // --- Índices ---
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_subjects_user_accessed ON subjects (user_id, accessed_at DESC);
        CREATE INDEX IF NOT EXISTS idx_sessions_user_started ON sessions (user_id, started_at DESC);
        CREATE INDEX IF NOT EXISTS idx_sessions_subject ON sessions (subject_id);
        CREATE INDEX IF NOT EXISTS idx_chat_conversations_user ON chat_conversations (user_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages (conversation_id, created_at ASC);
        CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges (user_id);
        CREATE INDEX IF NOT EXISTS idx_topic_coach_cache_user_subject ON topic_coach_cache (user_id, subject_id, topic_key);
        CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_subject ON quiz_attempts (user_id, subject_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_subject_goals_user ON subject_goals (user_id);
      `);

      // --- Seed badges (idempotente) ---
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
            b,
          );
        }
      }

      initialized = true;
    } catch (error) {
      dbPromise = null;
      throw error;
    }
  }

  return db;
}

/**
 * Reset do singleton - USO APENAS EM TESTES.
 * Permite isolar testes que precisam simular falha de openDatabaseAsync.
 */
export function __resetDbForTests() {
  dbPromise = null;
  initialized = false;
}

export const DB_NAME_EXPORT = DB_NAME;
