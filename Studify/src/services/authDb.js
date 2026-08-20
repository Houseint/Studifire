import * as SQLite from "expo-sqlite";
import * as Crypto from "expo-crypto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createServiceError } from "./errors";

const DB_NAME = process.env.EXPO_PUBLIC_DB_NAME || "studify.db";
const SESSION_KEY = process.env.EXPO_PUBLIC_SESSION_KEY || "studify_session";

let dbPromise = null;
let initialized = false;

// Base64 encoding helper (expo-crypto doesn't provide this in SDK 53+)
function base64Encode(bytes) {
  // Convert Uint8Array to binary string then to base64
  const binary = String.fromCharCode(...bytes);
  // Use btoa if available (web), otherwise implement manually
  if (typeof btoa !== 'undefined') {
    return btoa(binary);
  }
  // Manual base64 encoding for React Native
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  for (let i = 0; i < binary.length; i += 3) {
    const b1 = binary.charCodeAt(i);
    const b2 = binary.charCodeAt(i + 1) || 0;
    const b3 = binary.charCodeAt(i + 2) || 0;
    const triplet = (b1 << 16) | (b2 << 8) | b3;
    result += chars[(triplet >> 18) & 0x3F];
    result += chars[(triplet >> 12) & 0x3F];
    result += chars[(triplet >> 6) & 0x3F];
    result += chars[triplet & 0x3F];
  }
  // Handle padding
  const mod = binary.length % 3;
  if (mod === 1) {
    return result.slice(0, -2) + '==';
  } else if (mod === 2) {
    return result.slice(0, -1) + '=';
  }
  return result;
}

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
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL UNIQUE,
          senha_hash TEXT NOT NULL,
          created_at TEXT NOT NULL,
          avatar TEXT
        );
      `);

      const columns = await db.getAllAsync("PRAGMA table_info(users);");
      const hasSenhaHash = columns.some((c) => c.name === "senha_hash");
      const hasSenhaPlain = columns.some((c) => c.name === "senha");
      const hasAvatar = columns.some((c) => c.name === "avatar");

      if (!hasSenhaHash) {
        await db.execAsync("ALTER TABLE users ADD COLUMN senha_hash TEXT;");
      }

      if (hasSenhaPlain) {
        const users = await db.getAllAsync(
          'SELECT id, senha FROM users WHERE senha_hash IS NULL OR senha_hash = \'\';',
        );
        for (const user of users) {
          if (user.senha) {
            const hash = await hashPassword(user.senha);
            await db.runAsync("UPDATE users SET senha_hash = ? WHERE id = ?;", [
              hash,
              user.id,
            ]);
          }
        }
      }

      if (!hasAvatar) {
        await db.execAsync("ALTER TABLE users ADD COLUMN avatar TEXT;");
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

export async function hashPassword(senha) {
  const salt = await gerarSalt();
  return createHashComSalt(salt, senha);
}

export async function verifyPassword(senha, storedHash) {
  if (!storedHash) return false;
  if (storedHash.includes(':')) {
    const [salt, hash] = storedHash.split(':');
    const candidate = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${salt}${senha}`,
    );
    return candidate === hash;
  }
  const legacy = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    senha,
  );
  return legacy === storedHash;
}

export function isLegacyHash(storedHash) {
  return !!storedHash && !storedHash.includes(':');
}

export async function registerUser(email, senha) {
  let db;
  try {
    db = await getDb();
  } catch (error) {
    throw createServiceError(
      'DB_UNAVAILABLE',
      'Não foi possível conectar ao banco de dados.',
      error,
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Fast-path: evita hashear a senha quando o e-mail já existe.
  const existing = await db.getFirstAsync(
    "SELECT id FROM users WHERE email = ? LIMIT 1;",
    [normalizedEmail],
  );
  if (existing) {
    throw createServiceError('EMAIL_EXISTS', 'Este e-mail já está cadastrado.');
  }

  const senhaHash = await hashPassword(senha);

  // INSERT OR IGNORE garante atomicidade: mesmo com duas requisições
  // simultâneas do mesmo e-mail, apenas uma insere. Se `changes` for 0,
  // a constraint UNIQUE impediu a inserção (e-mail duplicado).
  let result;
  try {
    result = await db.runAsync(
      "INSERT OR IGNORE INTO users (email, senha_hash, created_at) VALUES (?, ?, ?);",
      [normalizedEmail, senhaHash, new Date().toISOString()],
    );
  } catch (error) {
    throw createServiceError(
      'DB_ERROR',
      'Não foi possível salvar o usuário no banco de dados.',
      error,
    );
  }

  if (!result.changes) {
    throw createServiceError('EMAIL_EXISTS', 'Este e-mail já está cadastrado.');
  }
}

export async function loginUser(email, senha) {
  let db;
  try {
    db = await getDb();
  } catch (error) {
    throw createServiceError(
      'DB_UNAVAILABLE',
      'Não foi possível conectar ao banco de dados.',
      error,
    );
  }
  const normalizedEmail = email.trim().toLowerCase();

  const user = await db.getFirstAsync(
    "SELECT id, email, senha_hash FROM users WHERE email = ? LIMIT 1;",
    [normalizedEmail],
  );

  if (!user) {
    return null;
  }

  const ok = await verifyPassword(senha, user.senha_hash);
  if (!ok) {
    return null;
  }

  if (isLegacyHash(user.senha_hash)) {
    const novoHash = await hashPassword(senha);
    await db.runAsync("UPDATE users SET senha_hash = ? WHERE id = ?;", [
      novoHash,
      user.id,
    ]);
  }

  const sessionUser = { id: user.id, email: user.email };
  await setSessionUser(sessionUser);
  return sessionUser;
}

export async function setSessionUser(user) {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export async function getSessionUser() {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    await AsyncStorage.removeItem(SESSION_KEY);
    return null;
  }

  const shapeOk = parsed !== null &&
    typeof parsed === 'object' &&
    !Array.isArray(parsed) &&
    typeof parsed.id === 'number' &&
    typeof parsed.email === 'string';

  if (!shapeOk) {
    await AsyncStorage.removeItem(SESSION_KEY);
    return null;
  }

  return parsed;
}

export async function atualizarAvatar(userId, avatarBase64) {
  const db = await getDb();
  await db.runAsync("UPDATE users SET avatar = ? WHERE id = ?", [avatarBase64, userId]);
}

export async function getUserById(userId) {
  const db = await getDb();
  const row = await db.getFirstAsync("SELECT id, email, avatar FROM users WHERE id = ?", [userId]);
  return row;
}

export async function logoutUser() {
  await AsyncStorage.removeItem(SESSION_KEY);
}
