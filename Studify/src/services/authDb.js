import * as SQLite from "expo-sqlite";
import * as Crypto from "expo-crypto";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DB_NAME = process.env.EXPO_PUBLIC_DB_NAME || "studify.db";
const SESSION_KEY = process.env.EXPO_PUBLIC_SESSION_KEY || "studify_session";

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
        'SELECT id, senha FROM users WHERE senha_hash IS NULL OR senha_hash = \"\";',
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

    initialized = true;
  }

  return db;
}

async function hashPassword(senha) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, senha);
}

export async function registerUser(email, senha) {
  const db = await getDb();
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await db.getFirstAsync(
    "SELECT id FROM users WHERE email = ? LIMIT 1;",
    [normalizedEmail],
  );

  if (existing) {
    throw new Error("EMAIL_EXISTS");
  }

  const senhaHash = await hashPassword(senha);

  await db.runAsync(
    "INSERT INTO users (email, senha_hash, created_at) VALUES (?, ?, ?);",
    [normalizedEmail, senhaHash, new Date().toISOString()],
  );
}

export async function loginUser(email, senha) {
  const db = await getDb();
  const normalizedEmail = email.trim().toLowerCase();
  const senhaHash = await hashPassword(senha);

  const user = await db.getFirstAsync(
    "SELECT id, email FROM users WHERE email = ? AND senha_hash = ? LIMIT 1;",
    [normalizedEmail, senhaHash],
  );

  if (!user) {
    return null;
  }

  await setSessionUser(user);
  return user;
}

export async function setSessionUser(user) {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export async function getSessionUser() {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    await AsyncStorage.removeItem(SESSION_KEY);
    return null;
  }
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
