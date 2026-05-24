import Constants from 'expo-constants';

const API_KEY = Constants.expoConfig?.extra?.GROQ_API_KEY || '';
const MODEL = 'llama-3.3-70b-versatile';
const BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `Você é um assistente de estudos do app Studify.
Responda APENAS sobre: matérias escolares, métodos de estudo,
planejamento de estudos, dicas de aprendizado e motivação educacional.
Se o usuário perguntar algo fora disso, responda:
"Meu propósito é ajudar com seus estudos 📚. Pergunte-me sobre matérias, métodos de estudo ou dicas educacionais!"
Sempre responda em português brasileiro, de forma clara e amigável.
Seja conciso — no máximo 4 parágrafos.`;

export async function enviarMensagem(mensagens) {
  if (!API_KEY || API_KEY.startsWith('sua_chave')) {
    return 'Configure sua chave da API Groq no arquivo .env';
  }

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...mensagens.map((m) => ({
      role: m.role,
      content: m.text,
    })),
  ];

  try {
    const resp = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 512,
      }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      console.error('Groq error:', data);
      return `Erro na API: ${data.error?.message || 'desconhecido'}`;
    }

    return data.choices?.[0]?.message?.content || 'Sem resposta.';
  } catch (e) {
    console.error('Network error:', e);
    return 'Erro de conexão. Verifique sua internet.';
  }
}
