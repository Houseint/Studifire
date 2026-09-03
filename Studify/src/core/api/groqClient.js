/**
 * Studify - Core Groq Client (centralizado)
 *
 * Passo 1.0 - FASE 1: centraliza BASE_URL, MODEL, API_KEY e fetch.
 * Passo 1.1b: migra para openai/gpt-oss-20b (llama deprecado 16/08/26)
 *             + rate limiter hard no free tier para nunca cobrar sem querer.
 */

import { canProceed, recordRequest, register429, estimateTokens } from './groqRateLimiter';

// Modelo configurável via .env, fallback para o recomendado pela Groq (free)
export const GROQ_MODEL = process.env.EXPO_PUBLIC_GROQ_MODEL || 'openai/gpt-oss-20b';
export const GROQ_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';

export function getGroqConfig() {
  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
  return {
    apiKey,
    model: GROQ_MODEL,
    baseUrl: GROQ_BASE_URL,
    isConfigured: !!apiKey && !apiKey.startsWith('sua_chave'),
  };
}

export function isGroqConfigured() {
  return getGroqConfig().isConfigured;
}

/**
 * Chamada centralizada ao Groq com rate limiter free tier.
 * @param {Array<{role:string, content:string}>} messages
 * @param {Object} options
 * @returns {Promise<string>}
 */
export async function groqChatCompletion(messages, options = {}) {
  const { apiKey, model, baseUrl, isConfigured } = getGroqConfig();

  if (!isConfigured) {
    return 'Configure sua chave da API Groq no arquivo .env';
  }

  const { temperature = 0.7, max_tokens = 512, response_format, reasoning_effort, max_completion_tokens } = options;

  // gpt-oss consome tokens de raciocínio oculto -> usa low para não estourar max_tokens em JSON mode
  const effectiveReasoning = reasoning_effort || (model.includes('gpt-oss') ? 'low' : undefined);
  const effectiveMax = max_completion_tokens || max_tokens;

  // --- Rate limiter hard (nunca paga) ---
  const estimated = estimateTokens(messages, effectiveMax);
  const check = await canProceed(estimated);
  if (!check.allowed) {
    return `⏳ Limite gratuito da IA atingido. ${check.reason} Se precisar, tente novamente em alguns segundos. Nenhum custo foi gerado.`;
  }

  const body = {
    model,
    messages,
    temperature,
    max_tokens: effectiveMax,
  };
  if (response_format) {
    body.response_format = response_format;
  }
  if (effectiveReasoning) body.reasoning_effort = effectiveReasoning;

  try {
    const resp = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      // 429 = rate limit do servidor -> bloqueia local e avisa sem custo
      if (resp.status === 429) {
        const retryAfter = resp.headers?.get?.('retry-after') || data?.error?.message?.match(/retry.*?(\d+)/i)?.[1] || 60;
        register429(retryAfter);
        console.warn('Groq 429 rate limited, blocking for', retryAfter, 's');
        return `⏳ Muitas requisições agora. Aguarde ${retryAfter}s e tente novamente. (limite gratuito, sem custo)`;
      }
      console.error('Groq error:', data);
      return `Erro na API: ${data.error?.message || 'desconhecido'}`;
    }

    // registra uso real para TPM/RPM/RPD
    const actualTokens = data.usage?.total_tokens || estimated;
    await recordRequest(actualTokens);

    return data.choices?.[0]?.message?.content || 'Sem resposta.';
  } catch (e) {
    console.error('Network error:', e);
    return 'Erro de conexão. Verifique sua internet.';
  }
}
