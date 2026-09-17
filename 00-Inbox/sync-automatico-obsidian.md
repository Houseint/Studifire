# Sync automático do vault (Obsidian Git)

Fazer **uma vez em cada PC** (escola e casa). Depois disso, as notas sincronizam sozinhas via GitHub.

## 1. Instalar o plugin

1. No Obsidian, abra este vault (a pasta `Studifire`)
2. ⚙️ Configurações → **Community plugins** → **Turn on community plugins**
3. **Browse** → buscar `Git` → **Obsidian Git** (autor: Vinzent) → **Install** → **Enable**

## 2. Ligar o automático

Em ⚙️ → **Git** (na lista lateral), ajuste:

| Opção | Valor |
|---|---|
| Pull updates on startup | ✅ ON |
| Push after commit | ✅ ON |
| Commit-and-sync interval (minutes) | `10` |
| Auto pull interval (minutes) | `10` |
| Commit message on auto backup | qualquer texto, ex. `vault backup` |

## 3. Primeiro sync manual

1. `Ctrl+P` → `Obsidian Git: Commit all changes` → Enter
2. `Ctrl+P` → `Obsidian Git: Push` → Enter
3. No outro PC: `Ctrl+P` → `Obsidian Git: Pull`

## Observações

- O Obsidian salva sozinho a cada tecla; o plugin só **transporta** via git a cada 10 min.
- Se der conflito (editou a mesma nota nos 2 PCs sem sync no meio), o plugin cria cópia `[[nota (conflito)]]` — é só juntar na mão.
- A pasta `.obsidian/` (config local) **não** vai pro git de propósito — cada PC configura o plugin uma vez e pronto.
- `TCC/` e `.env` nunca entram no git.
