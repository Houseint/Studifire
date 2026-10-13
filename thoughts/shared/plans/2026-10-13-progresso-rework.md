# Plano — Rework VISUAL da tela Progresso (Studify)

Data: 2026-10-13 · Branch: `Teste/correçoes` · Tipo: só aparência, **zero mudança de comportamento**

Fontes lidas: `Studify/prompt-agente-tela-progresso.md` (spec), `Studify/src/screens/ProgressScreen.js` (lógica),
`Studify/src/styles/screens/ProgressScreenStyles.js` (estilos), `Studify/src/shared/theme/colors.js` +
`Studify/src/shared/theme/ThemeContext.jsx` (tema), `GUIA_VELOCIDADE_STUDIFY.md`, `Studify/TODO.md`,
`Studify/test/fase0-29-chat-progress-light.test.js` (contrato a não quebrar), `package.json`, `src/components/common/Icon.js`.

## 0. Decisões travadas (não rediscutir na execução)

1. **Cores via ThemeContext** — estender `colors.js` nas duas paletas; dark = valores do md; **sem** `theme.ts` separado, **sem** chapar dark-only.
2. **Fonte atual do app** — sem `@expo-google-fonts`; respeitar pesos/tamanhos do md (título tela 28/700, seção 20→18/700*, stat 26/700, streak 38/800, eyebrow 10.5–11/600 + letterSpacing ~1.4–1.8, secundário 13–14).
   \* `sectionTitle` atual é 18/700 — o plano mantém 18 (só sobe p/ 20 se couber sem quebrar layout; não é obrigatório).
3. **Instalar `react-native-svg`** (anel 116px + ícones estilo lucide/feather no lugar dos emojis; funciona no Expo Go).
4. **Header direita = botão Perfil atual** (navega p/ `Profile`; não trocar pelo refresh do mockup).
5. **Sem `react-native-reanimated`** — pular animações do md.

## 1. Lógica existente — INVENTÁRIO DO QUE NÃO PODE MUDAR

Tudo abaixo fica byte-identico em comportamento (pode só mover de lugar dentro do arquivo):

- `useFocusEffect` → `Promise.all([carregarMaterias(userId), carregarHistorico(userId)])` → `setMaterias/setSessoes/calcularStats`; guard `mounted`; `catch` com `console.error`.
- `calcularStats`: `totalTopicos/topicosConcluidos` (reduce em `m.topicos[].estudado`), `totalHoras` (`Math.round(min/60*10)/10`), `diasAtivos` (Set de `toDateString`), `sequencia` (streak: ordena desc, compara com hoje−i).
- Filtros: `materiasEmAndamento` (0 < concl < total), `materiasConcluidas` (concl === total > 0), `materiasNaoIniciadas` (sem tópicos OU todos `!estudado`).
- `getDadosGraficoSemanal()`: 7 dias a partir de hoje−6, `{dia, minutos, horas, isHoje}`; `maxMinutos = max(...,1)`.
- `formatarTempo`, `getProgressoMateria`, `handleContinuarEstudo` (→ `Detail {materia}`), `handleRevisar` (→ `Detail {materia, revisar:true}`).
- Early return `!userId` ("Carregando...").
- Textos PT-BR atuais, empty states, `slice(0,3)` + `"+N mais na tela Início"`, `"Concluída em {dd/mm}"`, `SafeArea`/scroll, alvos ≥44px, `accessibilityLabel` nos botões só-ícone.
- Botão "Manter vivo" **sem handler** (mantém sem handler — só visual novo).
- `expo-linear-gradient` já instalado (`~14.1.5`) — reutilizar.

## 2. Contrato de testes a preservar (fase0-29 — vai quebrar se renomear/remover)

`getProgressScreenStyles(colors)` **deve continuar exportando** com a mesma semântica:

- `statCard.backgroundColor === colors.card` (dark e light)
- `headerTitle.color === colors.text`
- `streakValue.color === colors.warn`
- `progressBarContainer.backgroundColor` **diferente** entre dark e light
- Render: `getByText('Progresso')` deve existir (título mantido)

Regra: **adicionar** novas keys ao factory, **nunca remover/renomear** as antigas. Mesmo que a tela nova não use alguma key antiga, ela continua exportada (custo zero, suite verde).
Suítes a rodar a cada micro-tarefa: `npm test -- fase0-29` rápido + `npm test` completo antes de fechar cada tarefa.

## 3. Arquivos a criar / editar

| # | Arquivo | Ação |
|---|---------|------|
| 1 | `Studify/src/shared/theme/colors.js` | EDIT — novos tokens nas 2 paletas |
| 2 | `Studify/src/components/progress/ProgressIcons.js` | NEW — ícones SVG estilo feather (BookOpen, Check, Clock, Flame, Sprout, Trophy, Pencil, ArrowLeft, ArrowRight, Plus) via `react-native-svg` (`Path` com stroke, `strokeWidth 2`, `strokeLinecap/Linejoin round`) |
| 3 | `Studify/src/components/progress/SectionHeader.js` | NEW — quadrado tintado 32px + título + pill de contagem |
| 4 | `Studify/src/components/progress/EmptyState.js` | NEW — borda tracejada, glow radial, ícone 52px, título + descrição (recebe textos atuais por props) |
| 5 | `Studify/src/components/progress/StatCard.js` | NEW — tint 40px raio 14 + número 26/700 + label uppercase |
| 6 | `Studify/src/components/progress/ProgressRing.js` | NEW — anel SVG 116px, trilho `track`, arco gradiente `primaryLight→primaryDark`, `strokeWidth 10`, topo como início, `%` central + legenda "GERAL"; **guard `total=0 → 0%`** |
| 7 | `Studify/src/components/progress/StreakCard.js` | NEW — gradiente âmbar, chama 34px em quadrado 64px, número 38/800, botão "Manter vivo" (sem handler), **7 bolinhas 26px derivadas das sessões** (ver §5) |
| 8 | `Studify/src/components/progress/WeeklyChart.js` | NEW — total semana + chip fixo "Meta: 30min/dia", área 120px, linha tracejada da meta, barras larg. 30 topo arredondado, altura mín. 8px (12px hoje), labels dia+minutos, legenda Hoje/Outros |
| 9 | `Studify/src/components/progress/SubjectCard.js` | NEW — gradiente `cardAlt→card`, quadrado 48px raio 16, nome 19/700, `%` em `primaryLight`, barra 8px (trilho `#1F2456`/token, mín. 3% visível), botão full-width 52px raio 16; variante `completed` ("Revisar" + linha "Concluída em {data}") |
| 10 | `Studify/src/components/progress/index.js` | NEW — barrel (`export` dos 8 acima) |
| 11 | `Studify/src/styles/screens/ProgressScreenStyles.js` | EDIT — **só adiciona** keys novas (hero, ring, dots, chart-novo, subject-novo); keys antigas intactas (§2) |
| 12 | `Studify/src/screens/ProgressScreen.js` | EDIT — mesma lógica (§1), JSX remontado com os componentes 2–9; header mantém voltar + **Perfil** (§6) |
| 13 | `Studify/package.json` | via install (§4) |

Nada em `ThemeContext.jsx` (usa `getColors` existente). Nada em `Icon.js` (ícones novos são SVG locais, escopo só-Progresso).

## 4. Passo 0 — Instalação + baseline (primeira micro-tarefa)

```bash
cd Studify
npx expo install react-native-svg
npm test -- fase0-29
```

Por que `npx expo install`: fixa a versão compatível com Expo ~53 / RN 0.79 e funciona no Expo Go.
Nota Jest: `transformIgnorePatterns` do `package.json` **já inclui** `react-native-svg` na allowlist — nenhum ajuste esperado. Se algum teste quebrar no import do svg, adicionar mock pontual **no próprio teste** (não no `jest.setup.js` global), e só se necessário.
Baseline: `npm test` completo verde antes de começar (esperado: 40 suítes, 241 testes — 2 falhas pré-existentes conhecidas: fase2-04 data fixa 'Qui' e fase2-10; documentado no TODO).

## 5. Tokens — mapeamento `colors.js` (semântica por modo)

Dark = valores literais do md. Light = mesmos papéis, adaptados p/ fundo claro (cards brancos, texto marinho — seguir o padrão do light existente):

| Token novo | Dark (md literal) | Light (proposta) |
|---|---|---|
| `bgEnd` | `#0A1220` | `#DDE4F2` (fecha `bgGradient` claro existente) |
| `cardAlt` | `#171A47` | `#EFE9FF` (lilás bem claro, cf. `pickTheme` light de CardMateria) |
| `borderDashed` | `#34398A` | `#B9C3DA` (= `borderStrong` light) |
| `textFaint` | `#7F88B8` | `#6B7694` (= `textMuted` light) |
| `primary` | `#7C5CFA` | `#6F52FF` (= `accent` light) |
| `primaryLight` | `#A78BFA` | `#6F52FF` (contraste sobre branco; lavanda `#A78BFA` não lê no light) |
| `primaryDark` | `#5B3FE0` | `#5B3FE0` (igual, lê bem nos dois) |
| `amber` | `#F5A00B` | `#B45309` (âmbar escuro legível no claro) |
| `amberLight` | `#FBBF24` | `#B45309` (número do streak precisa contraste no light) |
| `amberBorder` | `#6B4E1C` | `#E5C07B` |
| `amberBg` | `#2E2113` | `#FEF3E2` |
| `info` | `#60A5FA` | `#2563EB` |
| `barIdle` | `#3A3F94` | `#C9D2E8` |
| `track` | `#232857` | `#E2E6F3` |
| `success` existente | `#4CAF50` | manter (fase0-29 não checa; Detail usa verde legível — se precisar, `#15803D` no light; checar `getDetailStyles` antes) |
| `warn` existente | `#FFAA00` | manter (fase0-29 exige `streakValue === warn` nos dois modos) |

Detalhe: `success`/`warn` **não mudam de valor** — só ganham companhia. `streakValue` continua `colors.warn` (contrato de teste).

## 6. Header (decisão 4)

Manter: botão voltar circular 44px → `navigation.goBack()` + botão **Perfil** atual → `navigation.navigate('Profile')` (com `accessibilityLabel`s).
Adicionar (só visual): subtítulo com a data em `textFaint`, ex. "Terça, 13 de outubro" via
`new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })` — display puro, zero lógica de dados. Tamanho do botão sobe 40→44px (spec exige ≥44px; visual, sem impacto em teste).
**Não** incluir botão refresh do mockup.

## 7. Regras visuais por componente (resumo fiel ao md, com adaptações das decisões)

- **Fundo**: `LinearGradient bg→bgEnd` (usa `colors.bgGradient` adaptado: dark `[bg, bgEnd, …]` — estender o array existente; light mantém o trio claro) + glow roxo superior-esquerdo (~360px, `primary` ~0.28) + glow âmbar meio-direita (~0.10) via `View` absoluta com `borderRadius` grande e opacidade baixa (mais simples que `RadialGradient`; sem reanimated não há animação de entrada).
- **Hero (novo)**: raio 28, gradiente diagonal `#1A1B4B → card → #10142F` (no light: `#FFFFFF → cardAlt → #E9EDF7`); esquerda `ProgressRing` 116px; direita eyebrow "SUA JORNADA" (`primaryLight`), frase de incentivo (19/600, fonte atual), "X de Y tópicos concluídos" (reusa `stats.topicosConcluidos/totalTopicos`). `%` do anel = `total===0 ? 0 : round(concl/total*100)` — **guard divisão por zero**.
- **Stats 3 colunas**: raio 22, tint 40px raio 14 (`primary`/`success`/`info` a ~15–18%), ícones BookOpen/Check/Clock 20px; número 26/700; "/total" em tom apagado (`textFaint`).
- **Streak**: raio 26, gradiente `amberBg → #1D1A22 → #141830` (light: `amberBg → #FFF7EA → #FFFFFF`), borda `amberBorder`; chama em quadrado 64px; número `amberLight` 38/800; botão "Manter vivo" gradiente âmbar + texto escuro (altura ≥44px, sem handler — igual hoje). **Bolinhas 7 dias**: derivar em `useMemo` das `sessoes` já em estado — `Set` de `toDateString` (mesma expressão do `calcularStats`, sem nova fonte de dados); círculos 26px: estudou = preenchido + check, não estudou = apagado/tracejado, hoje = anel âmbar + glow.
- **WeeklyChart**: título + "Últimos 7 dias" via `SectionHeader`; card raio 26 com "{total} esta semana" (`formatarTempo` existente sobre soma dos 7 dias) + chip fixo **"Meta: 30min/dia"** (valor fixo conforme md permite; tela atual não tem meta — constante `META_DIARIA_MIN = 30` local ao componente, usada só p/ linha tracejada e chip); área 120px; barras larg. 30 topo arredondado (`barIdle`; hoje gradiente `#B8A2FF → primary` + glow); altura mín. 8px (12px hoje) quando 0min; labels dia + minutos (hoje em `primaryLight` 700); legenda centralizada.
- **Seções de matérias**: `SectionHeader` (ícone tintado 32px + título + pill "N matérias" — texto de contagem com singular/plural mantido) para as 3 seções. `EmptyState` (borda tracejada `borderDashed`, fundo `card` ~60%, glow 84px, ícone 52px Sprout/Trophy, **textos atuais mantidos**) p/ Em andamento e Concluídas. `SubjectCard` p/ Em andamento e Não iniciadas (botões "Continuar estudando →" / "Começar →"), variante completed p/ Concluídas ("Revisar →" + "Concluída em {data}" — cálculo da `ultimaSessao` por `subject_id` mantido). Limite 3 + "+N mais na tela Início" mantido. Botão pressionado: `opacity 0.9 + scale 0.98` (via `activeOpacity`/`pressable` — sem reanimated).
- **Sombras**: `shadowColor` da cor do elemento + `elevation` no Android (padrão já usado no app).

## 8. Ordem de execução (uma mudança por vez, `npm test` verde em cada)

1. `npx expo install react-native-svg` + `npm test -- fase0-29` (baseline).
2. `colors.js`: adiciona tokens (§5) → `npm test -- fase0-24 fase0-25 fase0-26 fase0-27 fase0-28 fase0-29`.
3. `ProgressIcons.js` (sem dependentes — teste manual via Expo Go; Jest: smoke render se trivial).
4. `SectionHeader.js` → usa em nada ainda; `npm test`.
5. `EmptyState.js` → idem.
6. `StatCard.js` → idem.
7. `ProgressRing.js` (inclui guard total=0; teste unitário do cálculo `%` — puro, sem nativo) → `npm test`.
8. `StreakCard.js` (bolinhas derivadas de prop `sessoes`, default `[]`) → `npm test`.
9. `WeeklyChart.js` (props `dados`, `maxMinutos`, `formatarTempo`; constante meta fixa) → `npm test`.
10. `SubjectCard.js` (props + `onPress`; variante `completed` + `dataConclusao` string pronta) → `npm test`.
11. `index.js` barrel → `npm test`.
12. `ProgressScreenStyles.js`: **só append** de keys novas → `npm test -- fase0-29` (contrato §2) + full.
13. `ProgressScreen.js`: remontar JSX (lógica intacta §1; header com Perfil + data; hero+stats+streak+chart+3 seções) → `npm test` full.
14. Validação Expo Go (§9) + atualizar `Studify/TODO.md` (marcar item) + fechar.

Cada passo: implementar → `npm test` (full ao menos nos passos 2, 12, 13, 14; `-- fase0-29` nos demais p/ velocidade) → corrigir antes de seguir (GUIA §3).

## 9. Validação no Expo Go

```bash
cd Studify
npx expo start -c   # -c na primeira vez pós-install do svg (limpa cache do bundle)
```

Checklist (dark + light — alternar em Perfil → Aparência):
- [ ] Progresso abre sem erro; título "Progresso" + data; voltar volta; Perfil abre o Perfil.
- [ ] Hero: anel 116px com % correta; conta zerada (usuário novo) mostra 0% sem crash.
- [ ] Stats, streak (número + 7 bolinhas coerentes com dias estudados), "Manter vivo" visível.
- [ ] Gráfico 7 dias: barras, linha da meta, chip "Meta: 30min/dia", total da semana.
- [ ] Em andamento / Concluídas / Não iniciadas: cards, pills de contagem, empty states com textos atuais, "+N mais" quando >3, "Concluída em {data}".
- [ ] Tocar card → Detail (continuar/revisar/começar); light legível (sem texto claro sobre branco).
- [ ] `npm test` verde (exceto as 2 falhas pré-existentes fase2-04/fase2-10, se ainda existirem).

## 10. Riscos e mitigações

- **fase0-29 quebrar** (rename de key/valor) → mitigado pelo §2 (append-only + tabela de valores preservados); rodar `-- fase0-29` a cada passo.
- **`react-native-svg` no Jest** → `transformIgnorePatterns` já permite; fallback: mock pontual no teste.
- **Glow/gradiente no light** (roxo sobre branco) → opacidades menores no light via `colors.mode === 'light'` (padrão já usado em `progressBarContainer`).
- **Escopo** — sem reanimated, sem fontes, sem refresh, sem handler novo: qualquer pedido extra vai p/ backlog, não entra nesta tarefa (GUIA regra 7: um problema por mudança).
