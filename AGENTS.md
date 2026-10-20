# AGENTS.md — Studify (TCC)

Stack: Expo ~53 · React 19 · RN 0.79 · React Navigation 7 · expo-sqlite · Jest.
Código do app em `Studify/`. Branch de trabalho: `Teste/correçoes`.

## Antes de qualquer tarefa, leia nesta ordem

1. `GUIA_VELOCIDADE_STUDIFY.md` (playbook oficial — prioridades P0→P2, regras duras, fluxo de sessão)
2. `Studify/TODO.md` (o que está feito / em andamento)

## Regras inegociáveis

- Siga o guia acima; não reordene prioridades sem motivo explícito do usuário.
- Uma mudança por vez; mantenha `npm test` verde dentro de `Studify/`.
- Não migre para boilerplates, não adicione pagamentos/analytics, não edite `node_modules/`, `.expo/` ou `fix-*.patch`.
- Responda em português, curto: o que mudou, arquivo(s), como testar no Expo Go.

## Modo de correção direta (preferência do usuário)

- Trabalhe somente no problema que o usuário indicar. Não corrija, refatore nem investigue outras áreas por iniciativa própria.
- Primeiro encontre a causa e aplique a correção. Não rode testes antes de corrigir.
- Depois da correção, rode no máximo os testes diretamente afetados. Rode a suíte completa apenas se o usuário pedir ou antes de publicar um OTA.
- Não publique OTA, não faça commit e não amplie o escopo sem pedido explícito.
- Resposta final curta: causa, correção, arquivos e como validar.
