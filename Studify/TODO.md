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

## Em andamento

_Nada — fila vazia._

## Backlog

_Nada pendente (os 3 itens sugeridos — quiz automático, heatmap, metas por matéria — foram feitos acima). Sugestões futuras: sons/vibração no timer, exportar progresso em PDF p/ anexar no TCC._
