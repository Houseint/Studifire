# Segundo cérebro (Obsidian) — Studify

Vault = raiz `Studifire/`. Eu (assistente) leio e escrevo aqui pelo filesystem.

## Pastas
- `00-Inbox/` → dump rápido. Eu organizo depois.
- `01-Studify/` → NÃO duplicar. Fonte real é `Studify/TODO.md`.
- `02-Decisoes/` → 1 arquivo por decisão (template `templates/decision.md`).
- `thoughts/shared/designs/` → designs de features.
- `thoughts/shared/plans/` → planos aprovados que eu executo.
- `thoughts/ledgers/` → continuidade (`CONTINUITY_*.md`).
- `05-Refs/` → resumos `.md` (eu leio `.md` bem, `.pdf` mal).
- `templates/` → decision/design/plan/ledger/daily.
- `img/attachments/` → anexos do Obsidian.

## Regras
1. Uma mudança por vez; `npm test` verde em `Studify/`.
2. Nunca commitar `.env` (tem `EXPO_PUBLIC_GROQ_API_KEY`).
3. Ignorar no Obsidian (Excluded files): `node_modules, .expo, .git, *.log`.
4. Links relativos, anexos em `img/attachments`.

## Plugins sugeridos
Templater (aponta p/ `templates/`), Tasks, Git (auto-commit de `thoughts/`).
