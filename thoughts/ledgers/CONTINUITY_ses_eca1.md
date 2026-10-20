---
session: ses_eca1
updated: 2026-10-20T01:45:12.092Z
---

# Session Summary

## Goal
Fazer os itens **Estudar/Revisar** do plano da semana serem clicáveis e abrirem a matéria correspondente no `DetailScreen`, mantendo o card compacto e os testes verdes.

## Constraints & Preferences
- Projeto: `C:\Users\gupau\Desktop\Studifire-2\Studify`; branch `Teste/correçoes`; Windows bash.
- Preferência do usuário: modo de correção direta — mexer só no problema indicado, corrigir primeiro, rodar no máximo testes afetados depois.
- Não fazer commit nem publicar OTA sem pedido explícito.
- Resposta final curta, em português: causa, alteração, arquivos e como validar.
- Não editar `node_modules`, `.expo`, `fix-*.patch`; sem novas dependências.
- Usar `showAlert({ title, message, buttons: [{ text: 'OK', style: 'cancel' }] })` quando ThemedAlert for necessário.
- `rg` não existe no shell; usar ferramentas `read`/`grep` ou `bash` com caminhos entre aspas.

## Progress
### Done
- [x] Correções anteriores do Part 4 implementadas e testadas:
  - Chat: teclado Android visível, botão **Histórico**, botão **Excluir** explícito, mensagens com `MarkdownText`.
  - Busca filtra **Últimos acessados**, **Para revisar** e **Fixados**.
  - Saudação dinâmica (`Bom dia`/`Boa tarde`/`Boa noite`) com sol/lua.
  - Ícone SVG de perfil no Progresso.
  - Conquistas com `ScrollView` horizontal; removida fileira duplicada de dias do Estudante Pro.
- [x] `StudyPlanCard` alterado para:
  - manter os 7 dias visíveis;
  - permitir selecionar o dia via `TouchableOpacity`;
  - mostrar somente a agenda do dia selecionado;
  - exibir “Dia livre — descanse ou adiante um tópico.” quando vazio;
  - esconder o card apenas se `plan.totalItems === 0`.
- [x] Teste novo/atualizado em `test/fase2-04-studyplan.test.js` para seleção de dia.
- [x] Suíte completa verde: **42 suítes, 252 testes**.
- [x] OTA publicado com o plano por dia:
  - branch `preview`, runtime `1.0.0`, commit `9f4d05d`;
  - grupo `149e41aa-a4c9-4009-9e1a-b6034646befb`.
- [x] OTA anterior do Part 4:
  - grupo `e23cf5b0-4aa5-432f-abaf-42418f3bb22e`, commit `ef31176`.

### In Progress
- [ ] Tornar as linhas do plano semanal clicáveis para abrir a matéria no `DetailScreen`.
- [ ] Ainda sem edições para esta nova solicitação; apenas investigação inicial.

### Blocked
- (none)

## Key Decisions
- **Manter o modelo atual do card, sem modal novo**: o usuário quer o mesmo layout, só mostrando o dia selecionado.
- **Mostrar todos os 7 dias**: dias vazios continuam na trilha; o card só desaparece se a semana inteira não tiver itens.
- **Adicionar IDs na fila de estudo em vez de casar por nome**: navegação confiável exige `materiaId` e, se possível, `topicoIndex`.
- **Navegação provável para `Detail` usando `{ id: materiaId }`**: `DetailScreen` lê `route?.params?.id`; não foi encontrado suporte confirmado a `topicoIndex`.
- **Não alterar lembretes, dias do histórico, bottom nav global ou “Manter vivo”**: ficaram fora do escopo aprovado.

## Next Steps
1. Ler o restante de `src/shared/utils/studyPlan.js` e confirmar como `buildWeeklyPlan` propaga os itens.
2. Verificar no `DetailScreen` se há algum suporte a tópico inicial; hoje só foi confirmado `const id = route?.params?.id;`.
3. Em `buildStudyQueue`, adicionar `materiaId` e `topicoIndex` aos itens de `revisao`, `novo` e `reforco`.
4. Em `StudyPlanCard`, aceitar `onItemPress` e envolver a linha do item em `TouchableOpacity` com `onPress={() => onItemPress?.(it)}`.
5. Em `HomeScreen`, passar `onItemPress={(item) => navigation?.navigate('Detail', { id: item.materiaId, topicoIndex: item.topicoIndex })}`; se `Detail` ignorar o índice, enviar só `id`.
6. Atualizar `test/fase2-04-studyplan.test.js` para verificar IDs e clique; se necessário, ajustar testes da Home.
7. Rodar apenas as suítes afetadas:
   `npx jest test/fase2-04-studyplan.test.js test/fase0-11-homerefactor.test.js test/fase0-13-homescreen-flows.test.js --runInBand --silent`.
8. Só publicar novo OTA se o usuário pedir; nesse caso rodar suíte completa e `npx eas update --branch preview --message "..." --non-interactive`.

## Critical Context
- `src/shared/utils/studyPlan.js`:
  - `buildStudyQueue` gera itens `{ topicoNome, materiaNome, kind }`.
  - Revisões vêm de `getDueTopics`, que já tem `materiaId` e `topicoIndex`, mas esses campos não são incluídos no item da fila.
  - Tópicos novos usam `m.id` e `idx`, mas também não incluem IDs no item final.
  - `buildWeeklyPlan` retorna `days[{ date, weekday, minutes, items }]`.
- `src/components/home/StudyPlanCard.jsx`:
  - Já usa `useState(0)` para `selectedIndex`.
  - Os dias são `TouchableOpacity` com `accessibilityLabel={`Dia ${d.weekday} ${dayNumber(d.date)}`}`.
  - A agenda renderiza `selectedDay.items.map(...)`; atualmente a linha do item é um `View`, não clicável.
  - Tags visuais: `revisao` → `REVISAR`, `novo` → `ESTUDAR`, `reforco` → `REFORÇAR`.
- `src/screens/HomeScreen.js`:
  - `<StudyPlanCard materias={[...revisados, ...fixados]} goalMinutes={...} currentMinutes={...} />` está sem `onItemPress`.
  - Já existe padrão de navegação: `onPress={(materiaId) => navigation?.navigate('Detail', { id: materiaId })}` em outra parte da Home.
- `src/screens/DetailScreen.js`:
  - `export default function DetailScreen({ route, navigation })`.
  - `const id = route?.params?.id;` na linha ~24.
  - Não foi encontrado uso confirmado de `route.params.topicoIndex`.
- `src/screens/ProgressScreen.js` também navega para `Detail` usando `id`.
- OTA/EAS:
  - Branch correta: `preview`.
  - `app.json`: versão `1.0.0`, runtimeVersion `appVersion`, `checkAutomatically: ON_LOAD`.
  - `eas.json`: perfil `preview` com `channel: "preview"`, distribuição interna, APK Android.
  - EAS CLI instalado globalmente.
- Testes:
  - Comando: `npm test -- --runInBand --silent`.
  - `test/fase2-04-studyplan.test.js` tem 6 testes passando.
  - `test/fase0-11-homerefactor.test.js` e `test/fase0-13-homescreen-flows.test.js` passaram após as mudanças do card.
- Estado do git: HEAD `9f4d05d`; árvore limpa antes desta nova solicitação. Nenhuma edição feita ainda para os botões clicáveis.

## File Operations
### Read
- `C:\Users\gupau\Desktop\Studifire-2\AGENTS.md`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\App.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\app.json`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\package.json`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\components\ErrorBoundary.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\components\common\FeatherIcons.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\components\common\ThemedAlert.jsx`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\components\home\BottomNav.jsx`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\components\home\CardMateria.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\components\home\HomeHeader.jsx`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\components\home\MateriaSections.jsx`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\components\home\ProgressCards.jsx`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\components\home\Secao.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\components\home\StudyPlanCard.jsx`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\components\home\helpers.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\components\home\index.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\components\home\modals\CreateMateriaModal.jsx`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\components\home\modals\EditMateriaModal.jsx`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\components\progress\ProgressRing.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\components\progress\StreakCard.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\components\progress\SubjectCard.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\components\progress\WeeklyChart.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\core\db\client.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\features\auth\authDb.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\features\auth\useUserId.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\features\profile\ProfileScreen.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\features\profile\ProfileScreenStyles.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\features\reminders\reminderService.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\features\subjects\subjectsDb.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\hooks\useThemedAlert.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\hooks\useUserId.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\screens\ChatScreen.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\screens\DetailScreen.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\screens\HistoricScreen.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\screens\HomeScreen.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\screens\LoginScreen.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\screens\ProgressScreen.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\screens\RegisterScreen.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\services\authDb.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\services\reminderService.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\services\subjectsDb.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\shared\theme\ThemeContext.jsx`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\shared\utils\formatTime.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\shared\utils\fsrs.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\shared\utils\studyPlan.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\shared\utils\validacao.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\styles\ProfileScreenStyles.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\styles\components\home\BottomNavStyles.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\styles\screens\ProgressScreenStyles.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\test\fase0-05-bootstrap.test.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\test\fase0-10-chatrace.test.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\test\fase0-11-homerefactor.test.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\test\fase0-13-homescreen-flows.test.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\test\fase0-14-detail-timer-extra.test.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\test\fase0-15-chat-enviar.test.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\test\fase0-18-subjectsdb-crud.test.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\test\fase0-20-auth-screens.test.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\test\fase0-27-home-light.test.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\test\fase0-29-chat-progress-light.test.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\test\fase2-04-studyplan.test.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\test\fase2-05-quizauto.test.js`

### Modified
- `C:\Users\gupau\Desktop\Studifire-2\AGENTS.md`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\components\common\MarkdownText.js` (novo)
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\components\common\ThemedAlert.jsx`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\components\home\HomeHeader.jsx`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\components\home\MateriaSections.jsx`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\components\home\Secao.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\components\home\StudyPlanCard.jsx`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\components\home\helpers.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\features\profile\ProfileScreen.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\features\profile\ProfileScreenStyles.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\hooks\useThemedAlert.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\screens\ChatScreen.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\screens\HomeScreen.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\screens\ProgressScreen.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\screens\ReviewScreen.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\src\shared\utils\studyPlan.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\test\fase0-11-homerefactor.test.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\test\fase0-13-homescreen-flows.test.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\test\fase0-14-detail-timer-extra.test.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\test\fase0-20-auth-screens.test.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\test\fase0-27-home-light.test.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\test\fase0-30-markdown-text.test.js` (novo)
- `C:\Users\gupau\Desktop\Studifire-2\Studify\test\fase2-04-studyplan.test.js`
- `C:\Users\gupau\Desktop\Studifire-2\Studify\test\fase2-05-quizauto.test.js`
