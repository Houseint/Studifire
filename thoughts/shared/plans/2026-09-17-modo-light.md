# Plano — Modo Light (dark atual = padrão)

Data: 2026-09-17 · Branch: `Teste/correçoes` · Status: **T1-T5 + Chat/Progresso (T6 parcial, 39 suites/237 verdes); restam Historic/Help (T6 resto), T7-T8**

## 1. Decisões

- Toggle na tela **Perfil**, em nova seção "🎨 Aparência", seguindo o padrão visual da seção "🔔 Lembrete diário" (sectionContainer + botão Ativar/Trocar à direita).
- Persistência em `user_settings.theme_mode` (`'dark'` default) — mesmo padrão de `reminder_*`.
- Dark continua o default: quem já tem o app não vê nada mudar.
- Migração **incremental por tela** (uma mudança por vez, `npm test` verde). Telas não migradas seguem dark até sua vez.

## 2. Arquitetura do tema

**Novo: `src/shared/theme/`**
- `colors.js` — puro: `dark = {...}`, `light = {...}`, `getColors(mode)`. Chaves: `bg`, `bgGradient[3]`, `card`, `card2`, `border`, `borderStrong`, `text`, `textSecondary`, `textMuted`, `accent`, `accentStrong`, `danger`, `success`, `warn`, `statusBar` (`'light-content'`/`'dark-content'`).
- `ThemeContext.jsx` — Provider + `useTheme()` → `{ mode, colors, toggleMode, ready }`. No boot lê `getUserSettings(userId).theme_mode`; antes de carregar, `ready=false` e telas rendem dark (zero flash, pois dark = default).
- `toggleMode` = `setState` imediato + `updateThemeMode(userId, mode)` (persiste; falha de banco não reverte a UI, só loga — mesmo espírito do reminder).

**Como lidar com StyleSheet estático + inline (a regra de migração por tela):**
1. O arquivo `XxxStyles.js` exporta `getXxxStyles(colors)` (função que retorna `StyleSheet.create(...)`) **mantendo as mesmas keys** — diff mínimo, zero rename.
2. A tela chama `const s = useMemo(() => getXxxStyles(colors), [colors])` e troca `StatusBar` + `LinearGradient colors` para `colors.*`.
3. Inline `{{ color: '#...' }}` da tela viram `colors.*` no mesmo commit.
4. Telas não migradas continuam importando o objeto estático antigo (nada quebra no meio do caminho).

## 3. Paleta light (mantém identidade roxo/laranja)

| Uso | Dark | Light |
|---|---|---|
| Fundo | `#0a0f1e` / `#090E1F` | `#F2F4FA` |
| Gradiente (3) | `#0a0f1e #0d1a2e #0a1520` | `#FFFFFF #E9EDF7 #DDE4F2` |
| Card | `#111832` | `#FFFFFF` |
| Card 2 | `#1B2545` / `#0E1530` | `#E9EDF7` |
| Borda | `#27315B` | `#D4DBEC` |
| Borda forte | `#303E70` | `#B9C3DA` |
| Texto | `#F4F6FF` / `#E6EAFF` | `#141B33` |
| Texto secundário | `#C0CAE8` / `#8F98C2` | `#3D4A6B` |
| Muted | `#7F8AB7` / `#5E6994` | `#6B7694` |
| Accent (mantém) | `#8A68FF` / `#6F52FF` | `#6F52FF` |
| Danger / Success / Warn | `#EF4444` / `#4CAF50` / `#FFAA00` | mantém (legíveis nos dois) |

## 4. Micro-tarefas (ordem)

- **T1 — Infra do tema:** `shared/theme/colors.js` + `getColors` + suite pura (dark/light têm as mesmas keys, default dark). Provider + `useTheme` montado na árvore (App.js ou acima do Stack) + teste de toggle.
- **T2 — Persistência:** `ALTER TABLE user_settings ADD COLUMN theme_mode TEXT DEFAULT 'dark'` em `core/db/client.js` (precedente: `reminder_*`, linhas ~227-235) + `getThemeMode`/`updateThemeMode` em `subjectsDb.js` + testes. `getUserSettings` passa a incluir `theme_mode`.
- **T3 — Toggle no Perfil:** seção "🎨 Aparência" em `features/profile/ProfileScreen.js` (lê `settings.theme_mode` no `useFocusEffect` junto do reminder) + migração total do Perfil para `getProfileStyles(colors)` (é a vitrine do toggle — precisa reagir na hora).
- **T4 — Home** (FEITO 17/09): 8 styles em factory `getXStyles(colors)` + export estático dark (HomeHeader, Secao, CardMateria, ProgressCards, BottomNav, MateriaSections, Create/EditMateriaModal; `getHomeStyles` com default dark mantido). 12 consumidores no `useTheme`+`useMemo` (Header, Secao, CardMateria com THEMES id%4 mantidos, ProgressCards light = card branco + borda accent/warn, BottomNav, MateriaSections, WeeklyGoalRing/SmartNextSteps/StudyPlanCard com inline `s` virado em factory, modais com bloco IA inline → tokens). `renderTopicoInput` aceita `placeholderTextColor`/`selectionColor` opcionais. HomeScreen: StatusBar + busca por `colors`. Trilhas/rgba com condicional `colors.mode`. Teste `fase0-27-home-light` (4).
- **T5 — Detail + QuizModal + TopicCoachCard** (FEITO 17/09): `getDetailStyles(colors)` exportada no fim do DetailScreen (StyleSheet módulo-local virado em factory, sem teste que o importasse); StatusBar/Gradient/toggle Livre-Pomodoro/durações/botão quiz/✦/Expandir-IA/Importar/picker/sugestões → tokens (trilhas e tint rgba com condicional `colors.mode`; Stop `#D23A3A` literal mantido). QuizModal canônico: `getQuizModalStyles(colors)` exportada + `useTheme` (fallback dark mantém fase2-03 sem provider; overlay dim literal nos dois modos; reviewHit/Miss com condicional dark `#86EFAC`/`#FCA5A5` : success/danger). TopicCoachCard (só inline): `useTheme` + tokens, quiz selecionado com texto roxo no light (branco ilegível no tint claro), hit/miss condicionais. Teste `fase0-28-detail-light` (4: factories dark/light + smoke QuizModal e TopicCoachCard no provider light).
- **T6 — Chat ✅, Progresso ✅ (17/09), Historic/Help (pendentes).**
- **T7 — Auth (Login/Register)** + splash/loading.
- **T8 — TODO.md + commit por tela** (um commit por T, como manda o guia).

## 5. Aceite (Expo Go + Jest)

- Perfil → Aparência → alternar muda a tela **na hora**; fecha e reabre o app → mantém a escolha.
- `npm test` verde após cada T (atenção a `fase0-05`, que procura `Sair` no Perfil, e a testes que mockam `getUserSettings` — precisarão incluir `theme_mode`).
- Nenhuma tela migrada com texto ilegível (contraste texto/fundo nos dois modos).

## 6. Riscos e limitações assumidas

- **Splash nativo + StatusBar de telas não migradas seguem dark** até sua vez — aceitável no meio da migração; T7 fecha a conta.
- `BADGE_COLORS` (Perfil) e cores de dificuldade do futuro são por-badge, não por tema — fora do escopo.
- Gráficos do Progress (barras coloridas fixas) — avaliar em T6 se precisam de ajuste; accent funciona nos dois fundos.
- Testes que fazem `toHaveBeenCalledWith` em estilos exatos podem quebrar ao virar função — corrigir o teste na mesma T (precedente: fase0-13 no modo segurança).
