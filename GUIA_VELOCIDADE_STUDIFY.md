# Guia de Velocidade — Studify (TCC)

> **Para o agente (OpenCode): este é o playbook oficial desta branch.**
> Ao iniciar qualquer tarefa neste repo, leia este arquivo primeiro e siga as
> prioridades abaixo. Não reinvente decisões que já estão tomadas aqui.

## 0. Contexto rápido

- **App:** Studify — app de estudos com IA (React Native + Expo, JavaScript, **não** TypeScript).
- **Stack real:** Expo `~53.0.22` · React `19.0.0` · RN `0.79.6` · React Navigation 7
  (stack: Login, Register, Home, Profile, Historic, Help) · `expo-sqlite ~15.2.14`
  com SQL manual · Jest + `jest-expo` configurado (`Studify/test/`).
- **Código fica em:** `Studify/` (raiz do repo tem só patches, roteiro e configs).
- **Problemas conhecidos:** telas duplicadas `src/screens/*` vs `src/components/*`
  (a canônica é `src/screens/`, a outra deve virar re-export ou ser removida —
  ver `Studify/TODO.md`); StyleSheets manuais gigantes; `useState` espalhado na Home.
- **Comando de teste:** `npm test` dentro de `Studify/`. Toda mudança deve manter o Jest verde.

## 1. Ordem de ataque (não pule a fila)

### P0 — Drizzle ORM + expo-sqlite (corrige o bug de cadastro)
- Instalar: `drizzle-orm`, `drizzle-kit`, `babel-plugin-inline-import`.
- Criar `Studify/db/schema.ts` (users, materias, historico) e gerar migrations
  com `drizzle-kit generate`; aplicar em runtime com `useMigrations` do migrator
  `drizzle-orm/expo-sqlite/migrator`.
- Metro: adicionar extensão `.sql` (`config.resolver.sourceExts.push('sql')`);
  Babel: plugin `inline-import` com extensão `.sql`.
- Trocar o SQL manual pelos métodos do Drizzle; usar `useLiveQuery` nas listas
  (Home/Historic atualizam sozinhas quando o banco muda).
- Debug visual: `expo-drizzle-studio-plugin` (`useDrizzleStudio(db)` + `shift+M`).
- Referências: `drizzle-team/drizzle-orm` (docs `connect-expo-sqlite`),
  `emmanuelchucks/drizzle-expo-sqlite`, `israataha/expo-sqlite-drizzle`.
- **Aceite:** cadastro/login funcionam, `npm test` verde, sem SQL string solta no código novo.

### P0 — React Hook Form + Zod nas telas de auth
- Instalar: `react-hook-form`, `zod`, `@hookform/resolvers`.
- Reescrever validação de `RegisterScreen` e `LoginScreen` com schema Zod
  (email, senha mínima, confirmação de senha) em vez de `if` manual.
- Padrão de teste/mock: `Dusttoo/react-native-expo-supabase-starter`
  (`tests/helpers/supabase-chain-mock.ts` — ideia vale pra qualquer query builder).
- **Aceite:** erro de campo aparece na tela, sem `Alert` genérico; teste cobre senha inválida.

### P1 — NativeWind + componentes prontos (só telas novas ou em refactor)
- Instalar: `nativewind`, `tailwindcss` (+ `global.css`, plugin no `babel.config.js`).
- Usar kits copia-e-cola: `roninoss/nativewindui`, `nativeui-org/ui` ou
  `tailwiinder/nativecn` (Button, Input, Card, BottomSheet).
- **NÃO migre todas as telas de uma vez.** Use nas telas em refactor
  (Profile/Historic/Help, hoje placeholders) e nas novas.
- **Aceite:** nenhuma StyleSheet nova com mais de ~50 linhas.

### P1 — Zustand + TanStack Query (desinchar a Home)
- Instalar: `zustand`, `@tanstack/react-query`.
- Regra: Zustand = estado de UI local; TanStack Query = dado que vem do banco
  (fetch, cache, invalidação). Separar `services/` (acesso a dados) de
  `store/` (UI) de `hooks/` (queries). Estrutura-modelo no starter do Dusttoo.
- **Aceite:** `HomeScreen` sem `useState` para dados persistidos; tudo via query/store.

### P2 — IA com Vercel AI SDK (guia Expo)
- Seguir `ai-sdk.dev/docs/getting-started/expo`.
- **OBRIGATÓRIO no RN:** `import { fetch } from 'expo/fetch'` no client —
  sem isso dá `response body is empty` (issue `vercel/ai#7817`).
- Template: `aaronksaunders/expo-supabase-ai-template`.
- Referência de produto (chat + categorização automática — trocar "humor" por
  "matéria"): `sonnysangha/journal-ai-app-react-native-expo-sanity-clerk-billing-openai-vercel-ai-tamagui`.
- **Aceite:** chat com streaming funcionando no Expo Go antes de qualquer RAG.

## 2. Regras duras (o que NÃO fazer)

1. **Não migrar para boilerplate** (`ignite`, `rnr-starter`, etc.) — usa como consulta, nunca como base.
2. **Não instalar CodeGraph/indexadores** — projeto pequeno, overhead maior que ganho (decisão registrada).
3. **Não adicionar** pagamento, analytics ou telemetria — fora do escopo do TCC.
4. **Não editar** `node_modules/`, `.expo/`, patches `fix-*.patch` (histórico).
5. **Não criar StyleSheet nova gigante** — ver P1.
6. Manter JavaScript (sem converter o projeto para TS) salvo em `db/schema` do Drizzle.
7. Todo fix segue o padrão dos patches existentes: um problema por mudança,
   atualizando `Studify/TODO.md` (checklist) ao concluir.

## 3. Fluxo de cada sessão

1. Ler `Studify/TODO.md` e pegar **um** item.
2. Implementar seguindo a prioridade da seção 1.
3. Rodar `npm test` em `Studify/`; se quebrar, corrigir antes de seguir.
4. Marcar o item como feito no `TODO.md`.
5. Responder ao usuário em português, curto: o que mudou, arquivo(s), como testar no Expo Go.
