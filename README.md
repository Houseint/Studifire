# 📱 Studify — App de Gestão de Estudos com IA

![Expo](https://img.shields.io/badge/Expo-%7E53-000020?logo=expo)
![React Native](https://img.shields.io/badge/React_Native-0.79-61DAFB?logo=react)
![Jest](https://img.shields.io/badge/Testes-Jest_Cobertura_100%25-C21325?logo=jest)
![SQLite](https://img.shields.io/badge/Offline-SQLite_local-003B57?logo=sqlite)

O **Studify** é um app mobile de estudos com ajuda de Inteligência Artificial: organize matérias e tópicos, cronometre sessões (livre/Pomodoro), receba lembretes diários, gere quizzes de revisão e acompanhe streak, metas e conquistas — **tudo offline-first**.

## ✨ Funcionalidades

| Área | O que faz |
|---|---|
| 📚 Matérias e tópicos | Criar, fixar, concluir tópicos; gerador de tópicos com IA (Groq) |
| ⏱️ Timer de estudo | Cronômetro livre + Pomodoro 25/50, com registro automático da sessão |
| 🤖 Chat IA contextual | Tutor que conhece suas matérias, horas e streak (RAG local via SQLite) |
| 🧠 Revisão inteligente | FSRS-lite (dificuldade + vencimento), quiz pós-sessão e planner na Home |
| 🔔 Lembrete diário | Notificação local recorrente com horário configurável (08h/12h/19h/20h) |
| 📷 Avatar | Foto da **câmera** ou **galeria**, com tratamento completo de permissões |
| 🏆 Gamificação | Streak, meta semanal (anel de progresso), 8 badges, heatmap e histórico |
| 💾 Offline | Tudo persiste em SQLite no aparelho — funciona sem internet |

## 🛠️ Tecnologias

- **Expo ~53** · React Native 0.79 · React 19 · React Navigation (Stack)
- **expo-sqlite** (persistência) · **expo-notifications** (lembretes) · **expo-image-picker** (câmera/galeria)
- **Groq** (`openai/gpt-oss-20b`) para IA, quiz e tópicos · **Jest** (31 suites · 190 testes)

## ✅ Pré-requisitos

- **Node.js 20+** (recomendado LTS) e npm
- Celular Android/iOS com o app **[Expo Go](https://expo.dev/go)** instalado (mesma rede Wi-Fi do PC), **ou** emulador Android
- Opcional: chave da Groq (`EXPO_PUBLIC_GROQ_API_KEY`) para os recursos de IA — sem ela, o app abre normal e o chat usa respostas locais de fallback

## 🚀 Como executar

```bash
# 1. Clonar e entrar na pasta do app
git clone <url-do-repositorio>
cd Studifire-2/Studify

# 2. Instalar dependências
npm install

# 3. (Opcional) configurar a chave de IA
cp .env.example .env
# edite o .env e preencha EXPO_PUBLIC_GROQ_API_KEY

# 4. Rodar
npx expo start
```

- 📲 **No celular:** escaneie o QR Code com o **Expo Go**
- 🤖 **No emulador:** pressione `a` no terminal (Android) ou `i` (iOS, só macOS)
- 🧹 **Se o bundle reclamar após atualizar o código:** `npx expo start -c` (limpa o cache)

> 💡 **Demo de notificações:** ative o 🔔 no Perfil, ajuste o relógio do aparelho para 1 min antes do horário e deixe o app em 2º plano — o aviso *"📚 Hora de estudar!"* chega pelo sistema. Depois volte o relógio para automático.

## 🧪 Testes

```bash
npm test          # roda tudo (31 suites · 190 testes, 100% verde)
npm run test:watch
```

## 🗂️ Estrutura

```
Studify/
├── App.js                  # bootstrap de sessão + restore do lembrete
├── src/
│   ├── features/           # módulos por domínio (study, chat, reminders, profile, auth, subjects)
│   │   └── .../index.js    # barrels públicos de cada feature
│   ├── screens/            # shells finos (reexportam features — compatibilidade)
│   ├── services/           # shims de compatibilidade
│   ├── core/db/client.js   # SQLite singleton (getDb único + migrações)
│   └── components/         # UI reutilizável (QuizModal, TopicCoachCard, anel de meta…)
└── test/                   # suites fase0-* (base) + fase2-* (FSRS/quiz/planner)
```

## 📲 Recursos nativos utilizados

| Recurso | Onde |
|---|---|
| Câmera + Galeria (`expo-image-picker`) | Avatar no Perfil, com guia para Configurações se bloqueado (`canAskAgain: false` → `Linking.openSettings()`) |
| Notificações (`expo-notifications`) | Lembrete diário recorrente, reagendado no boot a partir do SQLite |
| Banco local (`expo-sqlite`) | Matérias, sessões, quizzes, planner, settings e histórico — 100% offline |

## 👥 Integrantes

Gustavo · Gabriel Rodrigues Melo · José Eduardo

- 🎬 Vídeo (Gabriel): https://youtu.be/W5O-ZwsB1UQ
- 🎬 Vídeo (Gustavo): https://youtu.be/Pf_40fCNKCY?feature=shared
