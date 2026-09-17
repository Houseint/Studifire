# Plano — Material (Foto/PDF) → Tópicos (FASE 3, item 1)

Data: 2026-09-17 · Branch: `Teste/correçoes` · Status: **aguardando aprovação**

## 1. Objetivo

Na Detail da matéria, botão "📷 Importar material": usuário fotografa (câmera/galeria) ou anexa arquivo — a IA lê e sugere tópicos no mesmo formato do gerador atual, com preview antes de salvar.

## 2. Decisões (com trade-off honesto)

| # | Decisão | Motivo |
|---|---|---|
| 1 | **Foto = fluxo completo; PDF = picker com orientação** | `gpt-oss-20b` (modelo atual) é só-texto; visão exige `meta-llama/llama-4-scout-17b-16e-instruct` (free Groq). E **não existe extrator de texto de PDF em JS puro no Expo Go** (precisaria lib nativa fora do Go). Então: foto funciona de ponta a ponta; PDF abre o picker, se for imagem segue o fluxo, se for `.pdf` explica e oferece a câmera (nunca botão morto). Extração real de PDF fica como "futuro" no TODO. |
| 2 | Entry point na **DetailScreen** (seção de tópicos) | É onde o usuário já gerencia tópicos e onde está o botão "🧠 Quiz rápido"; CreateMateriaModal exige matéria nova, Detail cobre os dois casos. |
| 3 | Nova função `gerarTopicosDeMaterial(nome, imagemBase64, existentes)` em `features/chat/aiService.js` | Reaproveita parse JSON + dedup + filtros de `gerarTopicosComplementares`, mas **sem** a trava `PRECISA_1_TOPICO` (quem importa material pode ter zero tópicos digitados). |
| 4 | Override de modelo no `groqClient` via `options.model` | Menor mudança possível: `groqChatCompletion(msgs, {model: VISION_MODEL, ...})`; texto continua no `gpt-oss-20b`. Estimativa de tokens p/ imagem: valor fixo (docs Groq: 2048 tokens/imagem) em vez de `estimateTokens` no base64 — senão o rate limiter bloqueia tudo. Modelo vision atual: `qwen/qwen3.6-27b` (Llama 4 Scout foi descontinuado pela Groq em 2026). |

## 3. Passo a passo (1 arquivo por passo)

1. **`src/core/api/groqClient.js`** — aceitar `options.model` (override) + `options.tokenEstimate` (p/ imagem). Puro, testável.
2. **`src/features/chat/aiService.js`** — `gerarTopicosDeMaterial(nomeMateria, base64, existentes, opts)`: monta `content: [{type:'text',...},{image_url:{url:'data:image/jpeg;base64,...'}}]`, chama com model vision, reaproveita parse/dedup; erros viram throw amigável (sem chave/sem internet/limite → mensagem clara, como o quiz faz).
3. **`src/screens/DetailScreen.js`** — botão "📷 Importar material" → ActionSheet (Câmera / Galeria / Arquivo): câmera+galeria via `expo-image-picker` (mesmo padrão de permissão do Perfil, `quality: 0.5`, `base64: true`); arquivo via `expo-document-picker` (**novo**: `npx expo install expo-document-picker`; jpg/png seguem fluxo foto, `.pdf` → Alert orientando fotografar + atalho câmera).
4. **Preview antes de salvar** — reaproveitar o padrão de preview editável já usado no fluxo de tópicos (mostrar lista sugerida, usuário confirma/adiciona).
5. **`test/fase2-09-material.test.js`** — parse/dedup de tópicos vindos de material, trava sem tópicos liberada, erros amigáveis (mock no `groqChatCompletion`, como fase2-02 faz).
6. **`Studify/TODO.md`** — marcar feito; suíte deve seguir 100% verde (`npm test` em `Studify/`).

## 4. Riscos

- **Limite free do Vision**: llama-4-scout no free tem TPM menor que texto — `quality: 0.5` + máx ~1 imagem/chamada mitiga; erro 429 já é tratado com `⏳`.
- **Foto ruim/ilegível**: IA retorna vazio → mensagem "não consegui ler, tente foto mais nítida" (nunca tela vazia).
- **`expo-document-picker` no jest**: precisa entrar no `transformIgnorePatterns` do `package.json` (como `expo-image-picker` já está).
- **Sem `.env`**: botão continua abrindo o picker, mas ao processar avisa "configure a chave" — igual espírito do quiz (fluxo nunca morre em silêncio). Futuro: OCR 100% local (fora deste plano).

## 5. Aceite

- [ ] Foto (câmera e galeria) gera tópicos que entram na matéria após preview
- [ ] PDF/imagem via picker: imagem processa, `.pdf` orienta sem travar
- [ ] Sem chave/sem internet: mensagem clara, sem crash nem botão morto
- [ ] `npm test` verde (31 suítes + fase2-09)
- [ ] TODO.md atualizado

## 6. Fora de escopo (vai p/ backlog)

Extração real de texto de PDF (exige lib nativa / build próprio fora do Expo Go); OCR offline; múltiplas páginas por vez.
