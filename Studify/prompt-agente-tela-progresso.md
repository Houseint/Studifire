# Prompt: redesign visual da tela "Progresso" (React Native / Expo)

Você vai reformular **apenas a camada visual** da tela "Progresso" do app. Não altere lógica, dados, navegação, rotas nem nomes de props/estados. Mantenha todos os textos em português e todas as seções existentes. Use `StyleSheet`, sem libs novas além de `expo-linear-gradient` e `react-native-svg` (instale se ainda não existirem).

## Princípio
Manter a identidade atual (tema escuro azul-marinho com roxo/índigo como cor principal e âmbar para a sequência) e elevar a qualidade com: hierarquia mais clara, profundidade (gradientes sutis + glow), cantos mais arredondados, ícones vetoriais no lugar de emojis e empty states mais cuidados.

## Tokens de cor
```ts
export const colors = {
  bg: '#0A0F1E',
  bgEnd: '#0A1220',
  card: '#111635',
  cardAlt: '#171A47',
  border: '#2B2F6B',
  borderStrong: '#33377F',
  borderDashed: '#34398A',
  text: '#F2F4FF',
  textMuted: '#8F98C9',
  textFaint: '#7F88B8',
  primary: '#7C5CFA',
  primaryLight: '#A78BFA',
  primaryDark: '#5B3FE0',
  amber: '#F5A00B',
  amberLight: '#FBBF24',
  amberBorder: '#6B4E1C',
  amberBg: '#2E2113',
  success: '#34D399',
  info: '#60A5FA',
  barIdle: '#3A3F94',
  track: '#232857',
};
```
Ajuste para os valores reais que o app já usa se forem ligeiramente diferentes; o importante é manter a proporção e a relação entre eles.

## Tipografia
- Títulos e números grandes: **Sora** (600–800) via `@expo-google-fonts/sora`.
- Texto corrido e legendas: **DM Sans** (400–700) via `@expo-google-fonts/dm-sans`.
- Se preferir não adicionar fontes, mantenha a atual mas respeite os pesos e tamanhos abaixo.

Tamanhos: título da tela 28/700, título de seção 20/700, número de stat 26/700, número do streak 38/800, rótulos em caixa-alta 10.5–11/600 com `letterSpacing` ~1.4–1.8, texto secundário 13–14.

## Layout (de cima para baixo)
Fundo da tela: `LinearGradient` vertical `bg → bgEnd` + um glow radial roxo suave no canto superior esquerdo (círculo ~360px, `primary` com opacidade ~0.28, desfocado) e um glow âmbar discreto no meio-direita (opacidade ~0.10). Padding horizontal 20, gap vertical 20.

1. **Header**: botão voltar circular 44px (fundo `card`, borda `border`, ícone seta `primaryLight`), título "Progresso" + subtítulo com a data (ex.: "Terça, 13 de outubro") em `textFaint`, botão de atualizar circular 44px à direita com ícone de refresh.
2. **Card hero (novo)**: raio 28, gradiente diagonal `#1A1B4B → card → #10142F`, borda `borderStrong`, sombra roxa. À esquerda um **anel de progresso** 116px (SVG, trilho `track`, arco com gradiente `primaryLight → primaryDark`, strokeWidth 10, `strokeLinecap: round`, ponto de início no topo) com a porcentagem geral no centro e a legenda "GERAL". À direita: eyebrow "SUA JORNADA" em `primaryLight`, frase de incentivo (Sora 19/600) e "X de Y tópicos concluídos". Use os dados que a tela já calcula (tópicos concluídos / total).
3. **Stats (3 colunas)**: matérias, tópicos, horas. Cada card raio 22, borda `border`, fundo `card`. No topo um quadrado arredondado 40px (raio 14) com tint da cor do ícone (primary / success / info a ~15–18% de opacidade) e ícone vetorial 20px (livros, check, relógio). Número grande, rótulo em caixa-alta embaixo. O "/9" dos tópicos em tom mais apagado.
4. **Sequência atual**: raio 26, gradiente `amberBg → #1D1A22 → #141830`, borda `amberBorder`, glow âmbar no canto. Ícone de chama 34px com gradiente laranja→amarelo dentro de um quadrado 64px com borda âmbar e sombra âmbar. Número em `amberLight` Sora 38/800 + "dias seguidos". Botão "Manter vivo" com gradiente âmbar e texto escuro, sombra âmbar. Abaixo, uma linha com as **7 bolinhas dos últimos dias** (círculos 26px: tracejados/apagados se não estudou, preenchidos com check se estudou, hoje com anel âmbar e glow).
5. **Evolução semanal**: título + "Últimos 7 dias". Card raio 26 com total da semana (ex.: "0min esta semana"), chip "Meta: 30min/dia" (o valor da meta pode ser fixo ou vir de config), área do gráfico 120px de altura com linha tracejada da meta, barras de largura 30 com topo arredondado (`barIdle`; **hoje** com gradiente `#B8A2FF → primary` e glow). Barras com 0min mantêm altura mínima de 8px (12px hoje) para nunca sumirem. Rótulos do dia e minutos embaixo (hoje destacado em `primaryLight`, peso 700). Legenda "Hoje / Outros dias" centralizada com bolinhas.
6. **Em andamento / Concluídas / Não iniciadas**: cada seção tem header com ícone em quadrado tintado 32px + título + pill com contagem ("0 matérias") em vez de texto solto.
   - **Empty state** (Em andamento e Concluídas): card com borda **tracejada** `borderDashed`, fundo `card` a ~60%, centralizado, ícone vetorial 52px (broto verde / troféu âmbar) sobre um glow radial da mesma cor (84px), título Sora 17/600 e descrição `textMuted` 14 com largura máxima ~260. Mantenha os textos atuais.
   - **Card de matéria** (Não iniciadas, e reaproveite o mesmo componente para Em andamento): raio 26, gradiente `cardAlt → card`, borda `borderStrong`, sombra roxa leve. Linha superior: quadrado 48px (raio 16) com gradiente `primaryLight → primaryDark` e ícone, nome da matéria Sora 19/700 + "9 tópicos para estudar", porcentagem à direita em `primaryLight`. Barra de progresso 8px (trilho `#1F2456`, preenchimento com gradiente, mínimo 3% visível quando 0%). Botão "Começar →" full-width, altura 52, raio 16, gradiente `primaryLight → primaryDark`, texto branco 16/700, sombra roxa e highlight interno no topo. Estado pressionado: `opacity 0.9` + `scale 0.98`.

## Detalhes de acabamento
- Substitua todos os emojis das seções por ícones SVG (lucide / feather): `BookOpen`, `Check`, `Clock`, `Flame`, `Sprout`, `Trophy`, `Pencil`, `ArrowLeft`, `RefreshCw`, `Plus`, `ArrowRight`.
- Sombras: use `shadowColor` com a cor do elemento (roxo/âmbar) + `elevation` no Android.
- Glows radiais: `react-native-svg` com `RadialGradient`, ou `View` absoluto com borderRadius grande e opacidade baixa.
- Alvos de toque ≥ 44px, `accessibilityLabel` nos botões só com ícone.
- Animações discretas (opcional, `react-native-reanimated`): anel e barras animam de 0 até o valor em ~600ms ease-out ao montar; chama do streak pulsa de leve (scale 1 → 1.06) quando o streak > 0.
- Mantenha `SafeAreaView` e o scroll atual; deixe ~40px de respiro no fim da lista.

## Referência visual
Mockup renderizado desta especificação: https://claude.ai/artifact/PK7kTtJL4eVNneSwmcmvrU (privado; peça ao usuário para compartilhar a imagem ou o link se você não tiver acesso).

## Entrega esperada
Código da tela atualizado + componentes reutilizáveis (`StatCard`, `StreakCard`, `WeeklyChart`, `SubjectCard`, `EmptyState`, `SectionHeader`) + arquivo `theme.ts` com os tokens acima. Não mude comportamento: só aparência.
