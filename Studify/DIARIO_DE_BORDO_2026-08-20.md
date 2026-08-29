# 📋 Diário de Bordo - Studify App
**Data:** 20/08/2026  
**Responsável:** Gustavo, Gabriel Rodrigues Melo, José Eduardo  
**Tipo:** Correção de bug crítico + Verificação completa das novas funcionalidades

---

## 🎯 Resumo Executivo

Corrigido **bug crítico** que impedia o uso da funcionalidade "Meta Semanal" no Android (erro ao clicar em "Editar"). Realizada verificação completa de todas as novas telas, funções e schema de banco de dados. Código validado com Babel do projeto - **zero erros de sintaxe**.

---

## 🐛 Bug Crítico Corrigido

### **Problema**
- Botão **"Editar"** na seção **Meta Semanal** (ProfileScreen) travava o app no Android
- **Causa raiz:** Uso de `Alert.prompt()` - API **exclusiva do iOS** no React Native
- No Android, `Alert.prompt` não é implementado → lança erro / não faz nada

### **Solução Implementada**
Substituído por **Modal customizado cross-platform** (`ProfileScreen.js` + `ProfileScreenStyles.js`):

```javascript
// ANTES (quebra no Android)
Alert.prompt('Meta Semanal', 'Defina sua meta...', [...], 'plain-text', `${weeklyGoal.goalHours}`);

// DEPOIS (funciona iOS + Android)
<Modal visible={goalModalVisible} transparent animationType="fade">
  <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <View style={s.modalCard}>
      <TextInput
        style={s.modalInput}
        value={goalInput}
        onChangeText={setGoalInput}
        keyboardType="decimal-pad"
        placeholder="Ex: 5"
        autoFocus
      />
      <TouchableOpacity onPress={saveGoal}>Salvar</TouchableOpacity>
    </View>
  </KeyboardAvoidingView>
</Modal>
```

### **Melhorias no UX**
- ✅ Aceita **vírgula ou ponto** como separador decimal (padrão BR)
- ✅ Teclado numérico (`decimal-pad`) + `autoFocus`
- ✅ Backdrop clicável para fechar
- ✅ `KeyboardAvoidingView` evita teclado cobrir input
- ✅ Validação mantida: 0.5 a 100 horas

---

## 🧹 Limpeza de Código

### `ProfileScreen.js`
| Import Removido | Motivo |
|---|---|
| `carregarMaterias` | Não usado - `getProfileStats`/`getWeeklyGoalProgress` fazem internamente |
| `carregarHistorico` | Não usado - idem |
| `getUserSettings` | Não usado - idem |
| `StyleSheet` | Não usado - estilos vêm de `ProfileScreenStyles.js` |

### `ProgressScreen.js`
| Import Removido | Motivo |
|---|---|
| `StyleSheet` | Não usado - estilos vêm de `ProgressScreenStyles.js` |
| `useEffect` | Não usado - só `useFocusEffect` |

---

## ✅ Verificações Completas

### 1. **Schema do Banco de Dados** (`subjectsDb.js`)
```sql
-- Tabelas novas criadas com FKs válidas
CREATE TABLE user_settings (
  user_id INTEGER PRIMARY KEY,
  weekly_goal_minutes INTEGER DEFAULT 300,
  updated_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE badge_definitions (
  id TEXT PRIMARY KEY,
  name, description, icon, color, trigger_type, trigger_value
);

CREATE TABLE user_badges (
  user_id, badge_id, unlocked_at,
  PRIMARY KEY (user_id, badge_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (badge_id) REFERENCES badge_definitions(id)
);
```
- ✅ Mesma base `studify.db` em `subjectsDb.js` e `authDb.js` → FKs funcionam
- ✅ Índices criados para performance
- ✅ **8 badges semeadas** no primeiro run

### 2. **Funções Novas Verificadas**
| Função | Propósito | Status |
|---|---|---|
| `getUserSettings(userId)` | Lê meta semanal do usuário | ✅ OK |
| `updateWeeklyGoal(userId, minutes)` | Atualiza meta | ✅ OK |
| `getBadgeDefinitions()` | Lista todas as badges | ✅ OK |
| `getUserBadges(userId)` | Badges desbloqueadas do usuário | ✅ OK |
| `checkAndAwardBadges(userId)` | Verifica e premia badges | ✅ OK |
| `getProfileStats(userId)` | Métricas completas do perfil | ✅ OK |
| `getWeeklyGoalProgress(userId)` | Progresso da meta semanal | ✅ OK |

### 3. **Telas Novas Verificadas**

#### `HistoricScreen.js`
- ✅ Carrega matérias + histórico via `carregarMaterias` / `carregarHistorico`
- ✅ `carregarHistorico` faz **JOIN com subjects** → retorna `subject_nome`
- ✅ Filtros: Todos / Hoje / Semana / Mês
- ✅ SectionList agrupada por data
- ✅ Stats cards: Matérias, Total estudo, Dias ativos

#### `ProgressScreen.js`
- ✅ Stats: Matérias, Tópicos, Horas, Dias ativos, Streak
- ✅ Gráfico semanal (últimos 7 dias) com barras proporcionais
- ✅ Separação: Em Andamento / Concluídas / Não Iniciadas
- ✅ Navegação para `Detail` (Continuar/Revisar)
- ✅ `calcularStats` chamado no callback assíncrono do `useFocusEffect` (sem TDZ)

### 4. **Navegação** (`App.js`)
```javascript
<Stack.Screen name="Historic" component={HistoricScreen} />  // ✅ Tela real
<Stack.Screen name="Progress" component={ProgressScreen} />  // ✅ Tela real
```
- ❌ `src/screens/Historic.js` é **stub morto** (não importado em lugar nenhum)

### 5. **Validação de Sintaxe**
```bash
# Todos os arquivos modificados passam no Babel do projeto (babel-preset-expo)
OK  src/screens/ProfileScreen.js
OK  src/screens/ProgressScreen.js
OK  src/screens/HistoricScreen.js
OK  src/styles/ProfileScreenStyles.js
OK  src/services/subjectsDb.js
OK  App.js
```

---

## 📦 Arquivos Modificados

| Arquivo | Linhas + | Linhas - | Tipo |
|---|---|---|---|
| `src/screens/ProfileScreen.js` | +472 | - | **Correção principal + limpeza** |
| `src/styles/ProfileScreenStyles.js` | +491 | - | **Estilos do modal** |
| `src/services/subjectsDb.js` | +264 | - | **Novas funções + schema** |
| `src/services/authDb.js` | +33 | - | Ajustes |
| `src/screens/ProgressScreen.js` | Novo | - | **Nova tela** |
| `src/styles/screens/ProgressScreenStyles.js` | Novo | - | **Estilos Progress** |
| `src/screens/HistoricScreen.js` | Existente | - | Verificado |
| `App.js` | +2 | - | Rotas confirmadas |

---

## ⚠️ Observações / Dívidas Técnicas Menores

| Item | Severidade | Descrição |
|---|---|---|
| `src/screens/Historic.js` | Baixa | Stub morto ("Content copied from original..."). **Pode ser deletado**. |
| Badge "Semana Ativa" | Baixa | Descrição: "Estude em 7 dias diferentes" → Gatilho real: `sessions_count = 7` (7 sessões totais, não 7 dias distintos). **Ajustar descrição ou gatilho**. |

---

## 🧪 Como Testar

1. **Meta Semanal (Profile):**
   - Abrir Perfil → Seção "Meta Semanal" → Tocar "Editar"
   - Digitar valor (ex: `5` ou `5,5`) → "Salvar"
   - Verificar barra de progresso e texto atualizados
   - Testar: valor inválido → alerta "Valor inválido"
   - Testar: cancelar → modal fecha sem salvar

2. **Histórico:**
   - Perfil → Botão "Histórico" → Verificar lista, filtros, stats

3. **Progresso:**
   - Perfil → Botão "Progresso" → Verificar cards, gráfico, listas

4. **Badges:**
   - Criar sessões, matérias, tópicos → Verificar toast "Nova Conquista!" ao desbloquear

---

## 📝 Próximos Passos Sugeridos

1. [ ] Deletar `src/screens/Historic.js` (stub morto)
2. [ ] Ajustar badge "Semana Ativa" (descrição ou trigger)
3. [ ] Adicionar testes unitários para `checkAndAwardBadges`
4. [ ] Considerar migrar `carregarHistorico` para usar `getProfileStats` internamente (dedup)

---

**Fim do relatório 20/08** ✅  
*Projeto estável, bug crítico resolvido, novas funcionalidades validadas.*

---

# 📋 Diário de Bordo - Studify App (continuação)
**Data:** 28/08/2026  
**Responsável:** Gustavo, Gabriel Rodrigues Melo, José Eduardo  
**Tipo:** Fundação Fase 1 + IA Contextual RAG Local + Troca de Modelo + Rate Limiter Free  
**Commit:** `2fb194b feat(core,ai): fundação Fase 1 + IA contextual RAG local + gpt-oss-20b + rate limiter free`

---

## 🎯 Resumo Executivo

Implementados **3 passos sequenciais** da Fase 1 do `PESQUISA_INOVACOES_STUDIFY_2026-08-27.md` com **zero breaking**:

1. **Passo 1.0 — Fundação Zero Breaking:** singleton de DB unificado, client Groq centralizado e utils de tempo extraídos
2. **Passo 1.1 — IA Contextual RAG Local (maior ROI):** chat agora injeta matérias/stats reais do SQLite no system prompt, respostas personalizadas
3. **Passo 1.1b — Troca de modelo + Guard sem custo:** `llama-3.3-70b-versatile` (descontinuado 16/08/26) → `openai/gpt-oss-20b` + rate limiter hard 30 RPM/8K TPM/1K RPD que **nunca deixa pagar** sem querer

**Resultado:** `npm test` 19 PASS 4 FAIL baseline preservado (mesmos 4 falhos pré-existentes verificados via `git stash`). Suites críticas `subjectsdb crud`, `authdb`, `aiservice` PASS. IA testada pelo usuário e confirmada funcionando pegando matérias criadas.

---

## 🧱 Passo 1.0 — Fundação

### Problema
- `authDb.js` e `subjectsDb.js` cada um abria `SQLite.openDatabaseAsync('studify.db')` separado → risco de WAL duplicado, migrations divergentes
- `aiService.js` tinha `fetch` Groq inline, modelo hardcoded `llama-3.3-70b-versatile`, sem ponto único de config
- `DetailScreen.js` tinha `formatarTempo`/`calcularStats` inline duplicados

### Solução

#### `src/core/db/client.js` (novo — singleton)
```js
let dbPromise = null;
export function getDb() {
  if (!dbPromise) dbPromise = SQLite.openDatabaseAsync(DB_NAME).then(init);
  return dbPromise;
}
async function init(db) {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  // migrations idempotentes: users, subjects, sessions, chat + indexes + seed 8 badges
}
```

#### `src/core/api/groqClient.js` (novo — centralizado)
```js
export const GROQ_MODEL = process.env.EXPO_PUBLIC_GROQ_MODEL || 'openai/gpt-oss-20b';
export function getGroqConfig() { return { apiKey, model, baseUrl, isConfigured } }
export async function groqChatCompletion(messages, opts) { /* fetch único */ }
```

#### `src/shared/utils/formatTime.js` (novo — extraído)
```js
export function formatarTempo(segundos) {} // mm:ss / hh:mm
export function formatarCronometro(segundos) {}
export function calcGlobalStats(subjects) {} // horas/dias/streak
```

#### Refatorações
| Arquivo | Antes | Depois |
|---|---|---|
| `authDb.js` | `openDatabaseAsync` próprio + 71 linhas de init | `import {getDb} from '../core/db/client'` |
| `subjectsDb.js` | `openDatabaseAsync` próprio + 134 linhas de init | `import {getDb} from '../core/db/client'` |
| `aiService.js` | fetch Groq inline, GROQ_MODEL/BASE_URL duplicados | `import {groqChatCompletion} from '../core/api/groqClient'` |
| `DetailScreen.js` | helpers inline | `import {formatarTempo} from '../shared/utils/formatTime'` |
| `helpers.js` | helpers duplicados | re-export de `shared/utils/formatTime` (compat) |

- Zero breaking: APIs públicas inalteradas, testes existentes continuam passando

---

## 🤖 Passo 1.1 — IA Contextual RAG Local

### Problema
IA sem contexto: `enviarMensagem(mensagens)` genérico, não sabia matérias, horas, pendências do usuário → respostas descoladas

### Solução

#### `src/services/aiService.js` — novo `enviarMensagemContextual(userId, mensagens)`
```js
async function buildUserContext(userId) {
  const stats = await getUserStats(userId); // authDb/subjectsDb
  const subjects = await getSubjects(userId);
  // limita 8 matérias + 3 pendentes p/ não estourar tokens
  return `Você é Studify... Usuário: ${userId}\nStats: ${JSON.stringify(stats)}\nMatérias: [...]`;
}
export async function enviarMensagemContextual(userId, mensagens) {
  const context = await buildUserContext(userId); // fail-safe p/ genérico se DB falhar
  return groqChatCompletion([{role:'system', content: context}, ...mensagens], {temperature:0.7, max_tokens:512});
}
```

#### `src/screens/ChatScreen.js`
```js
// ANTES
AiService.enviarMensagem(mensagens)

// DEPOIS (com fallback p/ fase0-15 mock)
if (user?.id && AiService.enviarMensagemContextual) {
  resposta = await AiService.enviarMensagemContextual(user.id, mensagens);
} else {
  resposta = await AiService.enviarMensagem(mensagens);
}
```

- Correção `fase0-15 ChatScreen deve usar AiService.enviarMensagem com fallback p/ mock` preservada
- `.env` + `.env.example` criados (`EXPO_PUBLIC_GROQ_API_KEY`, `EXPO_PUBLIC_GROQ_MODEL`, `EXPO_PUBLIC_DB_NAME`)
- `.gitignore` atualizado: `.env` + `.env*.local`

---

## 🛡️ Passo 1.1b — Troca de Modelo + Rate Limiter Hard (sem custo)

### Problema
- `llama-3.3-70b-versatile` deprecado Groq 16/08/26 → 404 em breve
- Risco de custo se API key com cartão estourar limites (TPM/RPD)

### Solução

#### Modelo
```js
// groqClient.js
export const GROQ_MODEL = process.env.EXPO_PUBLIC_GROQ_MODEL || 'openai/gpt-oss-20b';
// docs Groq 08/2026: free 30 RPM / 8K TPM / 1K RPD / 1K TPD (limitador real), Developer 250K TPM
```

#### `src/core/api/groqRateLimiter.js` (novo — guard local)
```js
export const LIMITS = { RPM:30, TPM:8000, RPD:1000, WARN_PCT:80 };
let requestTimestamps = []; // sliding window 60s
let tokenEntries = [];      // sliding window 60s
let blockedUntil = 0;       // respeita Retry-After 429
let rpdCache = {date, count}; // AsyncStorage @studify/groq_rpd por dia

export async function canProceed(estimatedTokens) {
  if (blockedUntil > now) return {allowed:false, reason:`Aguarde ${s}s...`, retryAfterMs}
  if (rpd >= 1000) return {allowed:false, reason:'Limite diário (1K) atingido. Volta amanhã — sem custo.'}
  if (rpm >= 30) return {allowed:false, reason:'Muitas msgs/min (30/30)...'}
  if (tpm + estimated > 8000) return {allowed:false, reason:'Tokens/min quase estourado...'}
  return {allowed:true}
}
export async function recordRequest(actualTokens) { /* atualiza RPM/TPM/RPD */ }
export function register429(secs) { blockedUntil = now + secs*1000 }
export function estimateTokens(msgs, maxTokens) { return Math.ceil(chars/4) + maxTokens }
```

#### Integração `groqClient.js`
```js
const estimated = estimateTokens(messages, max_tokens);
const check = await canProceed(estimated);
if (!check.allowed) return `⏳ Limite gratuito da IA atingido. ${check.reason} Nenhum custo foi gerado.`;

const resp = await fetch(...);
if (resp.status === 429) { register429(retryAfter); return `⏳ Muitas requisições... Aguarde ${retryAfter}s (sem custo)` }
await recordRequest(data.usage?.total_tokens || estimated);
```

- **Garantias:** sem cartão nunca cobra (só 429); com cartão o limiter corta no teto free → nunca vira Developer pago
- Mensagem bloqueada não chama `fetch` → zero tokens/custo
- `AsyncStorage` com fallback `require` try/catch p/ jest/node

---

## 📦 Arquivos Modificados (commit 2fb194b)

| Arquivo | Tipo | Linhas |
|---|---|---|
| `src/core/db/client.js` | **novo** | singleton WAL + migrations + seed 8 badges |
| `src/core/api/groqClient.js` | **novo** | model/baseUrl/config + fetch centralizado |
| `src/core/api/groqRateLimiter.js` | **novo** | RPM/TPM/RPD + 429 + estimateTokens |
| `src/shared/utils/formatTime.js` | **novo** | 3 utils tempo/stats |
| `src/services/authDb.js` | refator | -71 linhas init duplicado |
| `src/services/subjectsDb.js` | refator | -134 linhas init duplicado |
| `src/services/aiService.js` | feat | +130 linhas (contextual RAG) |
| `src/screens/ChatScreen.js` | feat | +13 linhas (contextual + fallback) |
| `src/screens/DetailScreen.js` | refator | -15 linhas helpers |
| `src/components/home/helpers.js` | refator | re-export compat |
| `.env.example` | **novo** | template GROQ_API_KEY + GROQ_MODEL |
| `.gitignore` | fix | +.env |

Total: `12 files +673/-259`

---

## ✅ Verificações

### Testes (`npm test -- --watchAll=false`)
```
Test Suites: 4 failed, 19 passed, 23 total  (baseline preservado)
Tests:       5 failed, 147 passed, 152 total
Falhas: fase0-08-sqlinjection (badge seed), fase0-05-bootstrap (Sair da conta), fase0-11-homerefactor, fase0-16-plano-basico — idênticas via git stash
Críticos PASS: subjectsdb crud, authdb, aiservice, chat contextual
```

### IA Contextual
- Usuário criou matérias -> Chat retornou respostas citando matérias/stats → validado manualmente 28/08
- Fail-safe: se `buildUserContext` falhar, cai p/ system prompt genérico

### Rate Limiter
- `estimateTokens` heurística chars/4 + max_tokens
- `canProceed` bloqueia antes do fetch → mensagem `⏳ ... sem custo`
- `429` servidor bloqueia local por `retry-after`

---

## 🧪 Como Testar

1. **Fundação:** `npx expo start --clear` → login, criar matéria, timer, chat, perfil → tudo funciona igual (zero breaking)
2. **IA Contextual:** Criar 2 matérias com tópicos → Chat: "o que devo estudar hoje?" → deve citar matérias/horas reais
3. **Rate Limiter:** Spammar 31 msgs em <60s → 31ª retorna `⏳ Muitas mensagens por minuto (30/30)...` sem custo; após 60s libera. Checar `getCurrentUsage()` se badge de 80% for adicionado
4. **Modelo:** `EXPO_PUBLIC_GROQ_MODEL` vazio → usa `openai/gpt-oss-20b`; trocar p/ `openai/gpt-oss-120b` no `.env` → usa 120b (10K TPM free)

---

## ⚠️ Dívidas / Próximos Passos

| Item | Status |
|---|---|
| Fase 1.2 — Gerador de tópicos via IA + FSRS-6 (próximo maior ROI) | pendente |
| Badge UI `RPM/TPM/RPD` em ChatScreen (80% warn) via `getCurrentUsage()` | opcional 10 linhas |
| Deletar `src/screens/Historic.js` stub morto | pendente desde 20/08 |
| Ajustar badge "Semana Ativa" trigger | pendente desde 20/08 |

---

**Fim do relatório 28/08** ✅  
*Fundação sólida, IA contextual funcionando com matérias reais, guard anti-custo ativo. Próximo: gerador de tópicos + FSRS.*