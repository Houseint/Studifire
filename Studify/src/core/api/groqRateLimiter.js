/**
 * Studify - Groq Rate Limiter (free tier guard)
 *
 * Objetivo: NUNCA deixar o usuário pagar sem querer.
 * Usa limites do free tier como teto duro local. Mesmo se o usuário
 * colocar cartão na Groq, o app bloqueia antes de estourar.
 *
 * Limites oficiais (docs 08/2026) para openai/gpt-oss-20b:
 *   Free: 30 RPM / 8K TPM / 1K RPD
 *   Developer (com cartão): 250K TPM / 1K RPM -> mas bloqueamos no free mesmo.
 *
 * Estratégia:
 *   - RPM/TPM: sliding window em memória (60s)
 *   - RPD: persistido em AsyncStorage por dia (sobrevive a reload)
 *   - 429 do servidor: respeita Retry-After e bloqueia local
 *   - threshold 80% = aviso, 100% = bloqueio duro com mensagem amigável
 */

let AsyncStorage = null;
try {
  // eslint-disable-next-line global-require
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (_) {
  AsyncStorage = null;
}

export const LIMITS = {
  RPM: 30,
  TPM: 8000,
  RPD: 1000,
  WARN_PCT: 80,
};

const WINDOW_MS = 60_000;
let requestTimestamps = []; // number[]
let tokenEntries = []; // { ts:number, tokens:number }[]
let blockedUntil = 0;
let rpdCache = null; // { date:string, count:number }

function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

async function loadRpd() {
  if (rpdCache && rpdCache.date === todayKey()) return rpdCache;
  if (!AsyncStorage) {
    rpdCache = { date: todayKey(), count: 0 };
    return rpdCache;
  }
  try {
    const raw = await AsyncStorage.getItem('@studify/groq_rpd');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === todayKey()) {
        rpdCache = parsed;
        return parsed;
      }
    }
  } catch (_) {}
  rpdCache = { date: todayKey(), count: 0 };
  return rpdCache;
}

async function saveRpd() {
  if (!AsyncStorage || !rpdCache) return;
  try {
    await AsyncStorage.setItem('@studify/groq_rpd', JSON.stringify(rpdCache));
  } catch (_) {}
}

function prune() {
  const now = Date.now();
  requestTimestamps = requestTimestamps.filter((t) => now - t < WINDOW_MS);
  tokenEntries = tokenEntries.filter((e) => now - e.ts < WINDOW_MS);
}

export function estimateTokens(messages, maxTokens = 512) {
  if (!Array.isArray(messages)) return maxTokens;
  const chars = messages.reduce((acc, m) => acc + (m.content?.length || 0), 0);
  // ~4 chars por token (heurística OpenAI)
  const promptTokens = Math.ceil(chars / 4);
  return promptTokens + (maxTokens || 0);
}

export function getCurrentUsage() {
  prune();
  const now = Date.now();
  const rpm = requestTimestamps.length;
  const tpm = tokenEntries.reduce((acc, e) => acc + e.tokens, 0);
  const rpd = rpdCache ? rpdCache.count : 0;
  const blockedMs = Math.max(0, blockedUntil - now);
  return { rpm, tpm, rpd, blockedMs };
}

export function isNearLimit() {
  const { rpm, tpm, rpd } = getCurrentUsage();
  const pct = Math.max((rpm / LIMITS.RPM) * 100, (tpm / LIMITS.TPM) * 100, (rpd / LIMITS.RPD) * 100);
  return pct >= LIMITS.WARN_PCT;
}

/**
 * Verifica se pode fazer a requisição.
 * @param {number} estimatedTokens - tokens estimados da próxima chamada
 * @returns {Promise<{allowed:boolean, reason?:string, retryAfterMs?:number}>}
 */
export async function canProceed(estimatedTokens = 800) {
  const now = Date.now();
  if (blockedUntil > now) {
    const retryAfterMs = blockedUntil - now;
    return {
      allowed: false,
      reason: `Aguarde ${Math.ceil(retryAfterMs / 1000)}s (rate limit temporário).`,
      retryAfterMs,
    };
  }
  prune();
  await loadRpd();
  const { rpm, tpm, rpd } = getCurrentUsage();

  if (rpd >= LIMITS.RPD) {
    return {
      allowed: false,
      reason: `Limite diário gratuito atingido (${LIMITS.RPD} req/dia). Volta amanhã — sem custo.`,
      retryAfterMs: 0,
    };
  }
  if (rpm >= LIMITS.RPM) {
    const oldest = requestTimestamps[0] || now;
    const retryAfterMs = WINDOW_MS - (now - oldest) + 500;
    return {
      allowed: false,
      reason: `Muitas mensagens por minuto (${rpm}/${LIMITS.RPM}). Aguarde ${Math.ceil(retryAfterMs / 1000)}s.`,
      retryAfterMs,
    };
  }
  if (tpm + estimatedTokens > LIMITS.TPM) {
    const oldest = tokenEntries[0]?.ts || now;
    const retryAfterMs = WINDOW_MS - (now - oldest) + 500;
    return {
      allowed: false,
      reason: `Limite de tokens por minuto quase estourado (${tpm}/${LIMITS.TPM}). Aguarde ${Math.ceil(retryAfterMs / 1000)}s.`,
      retryAfterMs,
    };
  }
  return { allowed: true };
}

export async function recordRequest(actualTokens) {
  const now = Date.now();
  requestTimestamps.push(now);
  tokenEntries.push({ ts: now, tokens: actualTokens || 0 });
  await loadRpd();
  rpdCache.count += 1;
  await saveRpd();
}

export function register429(retryAfterSeconds) {
  const secs = Number(retryAfterSeconds) || 60;
  blockedUntil = Date.now() + secs * 1000;
}

export function getLimitsInfo() {
  return { ...LIMITS };
}

// Helpers para testes
export function __resetForTests() {
  requestTimestamps = [];
  tokenEntries = [];
  blockedUntil = 0;
  rpdCache = { date: todayKey(), count: 0 };
}
export function __setRpdForTests(count) {
  rpdCache = { date: todayKey(), count };
}
