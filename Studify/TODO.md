# TODO — Studify (TCC)

Playbook oficial: `../GUIA_VELOCIDADE_STUDIFY.md`. Uma mudança por vez, `npm test` verde.

## Feito

- [x] FASE 1 — IA contextual RAG (`buildUserContext`), gerador híbrido de tópicos + coach, anel de meta + SmartNextSteps, core/db singleton, permissões câmera/galeria + lembrete diário
- [x] FASE 2.1 — FSRS-lite: `difficulty` + `due_date` no JSON de tópicos (`src/shared/utils/fsrs.js`), toggle agenda revisão, Próximo passo prioriza vencido, lembrete diário cita vencidos, IA recebe vencidos no contexto
- [x] FASE 2.2 — Quiz pós-sessão: tabela `quiz_attempts`, `gerarQuiz` (IA), botão "🧠 Quiz rápido" na Detail, acerto/erro ajusta `difficulty` via `aplicarResultadoQuiz` (`fase2-02` + `fase2-03` verdes)
- [x] Quiz automático pós-sessão (10/09): ao salvar sessão ≥1min (livre ou pomodoro), Alert "Sessão salva! 🎉" oferece o quiz (1 oferta por sessão via ref; `fase2-05` verde)
- [x] Splash escura no loading: `expo-splash-screen` instalado, fundo `#0a0f1e` no `app.json` + plugin, `App.js` segura o splash até o bootstrap terminar (lazy-require p/ não quebrar o jest)
- [x] Loading com identidade: logo Studifire (`img/LogoStudifirWithDesc.png`) no splash nativo + tela de loading com logo pulsando (escala+brilho em loop) e spinner roxo `#8A68FF`
- [x] Notifications SDK 53: trocado `shouldShowAlert` deprecado por `shouldShowBanner`/`shouldShowList` (push remoto nunca foi usado — só lembrete local, que funciona no Expo Go)
- [x] FASE 2.3 — Planner semanal como **card na Home**: `buildWeeklyPlan`/`buildStudyQueue` puros (`src/shared/utils/studyPlan.js`, fila vencido→novo→reforço, 7 dias, meta restante dividida), `StudyPlanCard` (`fase2-04` verde, some quando vazio)

- [x] FASE 2.4 — Modular `features/study`: `QuizModal` movido p/ `src/features/study/` + barrel `index.js` (re-exporta quiz/FSRS/planner); shim de compatibilidade no path antigo; DetailScreen e fase2-03 no path canônico, suíte verde
- [x] Análise de escalabilidade (só análise, sem mudar — 10/09): candidatos `features/auth` (Login/Register + authDb + sessão), `features/subjects` (CRUD matérias + Home/Detail + subjectsDb), `features/chat` (ChatScreen + conversas IA do aiService/subjectsDb), `features/reminders` (reminderService + modal + settings), `features/profile` (Profile/Historic/Progress/Help + stats); `shared/` vira base genérica (formatTime) e `core/` infra (db/api). Ordem sugerida: auth → subjects → chat → reminders → profile; cada um com barrel + shim como feito em study
- [x] Baseline zerado (10/09): fase0-08 (assert filtra calls c/ `/subjects/i` — seeds do getDb geravam 8 INSERTs no spy), ProfileScreen (3 `style={{}}` viraram keys `loadingCenter`/`loadingText`/`bottomSpacer`, valores idênticos), `ProfileScreenStyles` (criadas `flameEmoji`/`buttonEmoji` = estilos existentes, visual no-op), fase0-11 (espera `Progress`), fase0-05 (procura `Sair`)
- [x] Modularização completa (10/09, padrão study — `git mv` + shim `export*` no path antigo + barrel `index.js`): `features/subjects` (subjectsDb), `features/auth` (authDb + useUserId; fase0-02 apontado p/ canônico), `features/chat` (aiService; telas mantidas no shim = zero churn), `features/study` (+ studyCoachService, re-exporta gerarQuiz), `features/reminders` (reminderService), `features/profile` (ProfileScreen + Styles; App.js no canônico). Regra: mocar o módulo-folha canônico nos testes (mock no barrel/shim não alcança quem importa direto — fase0-05/20 no `features/auth/authDb`). Suíte: **28 suítes, 181 testes, 100% verde**
- [x] Heatmap de atividade (10/09): `buildActivityHeatmap` puro (`src/shared/utils/activity.js`, níveis 0-4 por minutos/dia) + strip "Últimos 7 dias" na HistoricScreen (dado `sessoes` já carregado; `fase2-06` verde)
- [x] Últimos quizzes na Detail (10/09): seção "ÚLTIMOS QUIZZES" (últimos 3, placar + data) via `carregarQuizAttempts` existente; recarrega após salvar (`fase2-07` verde)
- [x] Metas por matéria (10/09): tabela `subject_goals` (PK user+matéria, `weekly_minutes`) + `get/setSubjectGoal` (upsert, ≤0 desliga) + `getSubjectWeekMinutes` (regra domingo-00:00); seção "META SEMANAL" na Detail com presets 30-300min (`fase2-08` verde). Suíte: **31 suítes, 190 testes, 100% verde**
- [x] Quiz rápido sempre abre (17/09): `gerarQuiz` ganhou fallback local `gerarQuizLocal` (autoavaliação por tópico, `local: true`) quando IA indisponível — sem `.env`, sem internet, limite free ou JSON vazio; antes o botão morria num Alert. Detail repassa `local` p/ badge "⚡ offline" no QuizModal (fase2-02 +3 testes)
- [x] Revisão pós-quiz (17/09): QuizModal mostra seção REVISÃO após "Ver resultado" — cada questão com "✓/✗ Sua: X" e "Resposta certa: Y" quando erra; `onFinish` segue `{total, correct}` (fase2-03 +2 testes). Suíte: **31 suítes, 195 testes, 100% verde**
- [x] Limpeza (17/09): removido `src/screens/Historic.js` morto (zero referências) + desinstalado `@react-navigation/native-stack` (App usa `@react-navigation/stack`). Suíte segue **31 suítes, 195 testes, 100% verde**
- [x] Modo light T1+T2+T3 (17/09): `src/shared/theme/` (paletas dark/light + `ThemeProvider`/`useTheme`, dark default); `theme_mode` em `user_settings` (migration + `updateThemeMode`, valor inválido cai em dark); seção "🎨 Aparência" no Perfil (troca imediata + persiste; `ProfileScreenStyles` virou `getProfileStyles(colors)` com compat dark); App carrega tema no bootstrap sem flash + Login recarrega em login fresco. Suíte: **36 suítes, 224 testes, 100% verde**. Restam T5-T8 do plano (Detail+Quiz, Chat/Progress/Historic/Help, Auth).
- [x] Modo light T4 — Home (17/09): 8 styles em factory + 12 componentes/telas no `useTheme` (Header, cards coloridos mantidos, anel, next steps, planner, busca, modais criar/editar com bloco IA). Teste `fase0-27` (4).
- [x] Modo light T5 — Detail + Quiz (17/09): `getDetailStyles(colors)` (timer, metas, importação, quizzes, sessões), `getQuizModalStyles(colors)` + TopicCoachCard no `useTheme` (acertos com verde legível no light). Teste `fase0-28` (4). Suíte: **38 suítes, 232 testes, 100% verde**.
- [x] Cards lilás no light (17/09): `pickTheme(materia, mode)` exportado em `CardMateria.js` — light usa 4 tons de lilás claro (texto marinho legível; antes herdava fundo escuro do dark), dark intacto; `fase0-27` +1 teste.
- [x] Modo light T6 parcial — Chat + Progresso (17/09): `getChatStyles(colors)` in-file (bolhas, input, histórico, StatusBar/gradiente por tema) + `getProgressScreenStyles(colors)` (stat/streak/chart/subject cards, trilha condicional no light). Teste `fase0-29` (4, factories + render light com NavigationContainer). Suíte: **39 suítes, 237 testes, 100% verde**. Restam: Historic/Help (T6 resto), Auth+splash (T7), commits (T8).
- [x] FASE 3.1 — Material → tópicos (17/09): botão "📷 Importar material" na Detail (câmera/galeria via `expo-image-picker`, arquivo via `expo-document-picker`); `gerarTopicosDeMaterial` com Groq Vision (`llama-4-scout`, override `options.model` no groqClient) reaproveitando parse/dedup via helper `extrairTopicosDoJson`; `.pdf` orienta a fotografar (sem extrator de PDF no Expo Go); erros viram mensagem clara, nunca botão morto. Suíte: **32 suítes, 203 testes, 100% verde**

## Em andamento

_Nada — fila vazia._

## Backlog

_Nada pendente (os 3 itens sugeridos — quiz automático, heatmap, metas por matéria — foram feitos acima). Sugestões futuras: sons/vibração no timer, exportar progresso em PDF p/ anexar no TCC._
- [ ] **Sessão extraordinária — Guia de primeiro uso (ANTES do passo 3 da FASE 3 do PDF):** carrossel 4 telas pós-login + botão "Ver guia novamente" na Ajuda. Só executar quando o visual estabilizar (sem mudança notória pendente), p/ os prints não desatualizarem. Detalhe em `thoughts/shared/designs/2026-09-17-guia-primeiro-uso-design.md`.
