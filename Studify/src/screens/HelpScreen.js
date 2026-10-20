import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking, StatusBar, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HELP_LINKS } from '../constants/helpLinks';
import { useTheme } from '../shared/theme/ThemeContext';
import TutorialModal from '../components/common/TutorialModal';
import { BookOpenIcon, BookIcon, TargetIcon, MapIcon, LinkIcon, ClockIcon, SparklesIcon, RefreshCwIcon, ZapIcon, PencilIcon, SearchIcon, TrendingUpIcon, CalendarIcon } from '../components/common/FeatherIcons';


const CORES_SECAO = ['#4CAF50', '#FF9800', '#2196F3', '#E91E63', '#9C27B0', '#FF5722'];

const ICONE_PADRAO = BookOpenIcon;

const ICON_MAP = {
  bookOpen: BookOpenIcon,
  book: BookIcon,
  target: TargetIcon,
  map: MapIcon,
  link: LinkIcon,
  clock: ClockIcon,
  sparkles: SparklesIcon,
  refresh: RefreshCwIcon,
  zap: ZapIcon,
  pencil: PencilIcon,
  search: SearchIcon,
  trending: TrendingUpIcon,
  calendar: CalendarIcon,
};

function HelpIcon({ name, size = 18, color }) {
  const Cmp = ICON_MAP[name] || ICONE_PADRAO;
  return <Cmp size={size} color={color} />;
}

const SECOES = [
  {
    icon: 'zap',
    titulo: 'O QUE O APP FAZ POR VOCÊ',
    subtitulo: 'Cada recurso e onde ele aparece',
    metodos: [
      { icon: 'clock', nome: 'Timer + Modo foco', desc: 'Na matéria: escolha Livre ou Pomodoro (25/50). O modo foco bloqueia a saída até você parar a sessão; no modo livre a mini bar continua em outras telas. Só sessões com 1 min ou mais são registradas.' },
      { icon: 'pencil', nome: 'Conclusão com prova', desc: 'Para marcar um tópico como concluído: 10 min registrados na matéria + mini quiz com 60% de acerto. É o app te impedindo de "marcar tudo" sem estudar. Desmarcar continua livre.' },
      { icon: 'refresh', nome: 'Revisão espaçada (FSRS)', desc: 'Tópicos concluídos vencem em 1, 3, 7 ou 14 dias, conforme dificuldade e quiz. A tela Revisão (Home ou Progresso) só mostra o que venceu — não faz sentido revisar no mesmo dia em que estudou.' },
      { icon: 'sparkles', nome: 'Próximo passo por conteúdo', desc: 'O card "Próximo passo inteligente" na Home escolhe: revisão vencida, matéria nova, matéria parada ou tópico de hoje. Ele não repete a meta de minutos — quem cuida da meta é o anel "Meta semanal".' },
      { icon: 'calendar', nome: 'Plano da semana', desc: 'A Home distribui os itens da fila (revisões, novos e reforço) pelos 7 dias, com minutos por dia. É uma sugestão de ritmo, não uma cobrança.' },
      { icon: 'target', nome: 'Metas e conquistas', desc: 'Meta semanal de minutos no Perfil/Home, meta por matéria na Detail e 8 conquistas com barra de progresso. Conquistas destravam ao bater streaks, tópicos, sessões, acertos e horas.' },
    ],
  },
  {
    icon: 'bookOpen',
    titulo: 'MÉTODOS — ONDE O APP USA',
    subtitulo: 'Nada de lista solta: veja o método dentro do fluxo',
    metodos: [
      { icon: 'clock', nome: 'Pomodoro', desc: 'Está no timer da matéria: ciclos de 25 ou 50 min, pausa sugerida no fim e sessão salva automaticamente.' },
      { icon: 'sparkles', nome: 'Feynman', desc: 'Está no botão ✦ do tópico (TopicCoachCard): a IA pede para você explicar com suas palavras e aponta o que faltou.' },
      { icon: 'refresh', nome: 'Flashcards + repetição espaçada', desc: 'É o motor da Revisão: quiz curto no vencimento e intervalos que crescem conforme você acerta.' },
      { icon: 'pencil', nome: 'Estudo ativo / SQ3R', desc: 'Vira tópicos + mini quiz: em vez de só ler, você fecha o tópico explicando e respondendo perguntas.' },
      { icon: 'zap', nome: 'Pareto 80/20', desc: 'Não é uma tela separada: é o critério do próximo passo e do plano — primeiro revisões vencidas, depois o que está mais atrasado.' },
      { icon: 'map', nome: 'Mapas mentais', desc: 'Use o botão ✦ do tópico e peça um mapa/analogia à IA; o app não desenha o mapa por você.' },
    ],
  },
  {
    icon: 'link',
    titulo: 'LINKS ÚTEIS',
    subtitulo: 'Aprofunde-se nos temas',
    metodos: HELP_LINKS,
  },
];

function SecaoAccordion({ secao, indice }) {
  const [aberto, setAberto] = useState(false);
  const { colors } = useTheme();
  const s = useMemo(() => getHelpStyles(colors), [colors]);
  const cor = CORES_SECAO[indice % CORES_SECAO.length];
  const isLinks = secao.metodos[0]?.url !== undefined;

  return (
    <View style={s.secaoCard}>
      <TouchableOpacity activeOpacity={0.7} onPress={() => setAberto(!aberto)}>
        <View style={[s.secaoBar, { backgroundColor: cor }]} />
        <View style={s.secaoHeader}>
          <View style={[s.secaoIconContainer, { backgroundColor: cor + '25' }]}>
            <HelpIcon name={secao.icon} size={18} color={cor} />
          </View>
          <View style={s.secaoTitleArea}>
            <Text style={[s.secaoTitulo, { color: cor }]}>{secao.titulo}</Text>
            <Text style={s.secaoSubtitulo}>{secao.subtitulo}</Text>
          </View>
          <Text style={[s.secaoArrow, { color: cor }]}>{aberto ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {aberto && (
        <View style={s.secaoContent}>
          {secao.metodos.map((metodo, i) => (
            isLinks ? (
              <TouchableOpacity
                key={i}
                style={s.linkItem}
                activeOpacity={0.6}
                onPress={() => Linking.openURL(metodo.url).catch(() => {})}
              >
                <View style={s.linkIcon}>
              <HelpIcon name={metodo.icon} size={18} color={cor} />
            </View>
                <View style={s.linkInfo}>
                  <Text style={s.linkNome}>{metodo.nome}</Text>
                  <Text style={[s.linkUrl, { color: colors.textMuted }]} numberOfLines={2}>{metodo.desc}</Text>
                  <Text style={[s.linkUrl, { color: cor }]} numberOfLines={1}>{metodo.url}</Text>
                </View>
                <Text style={s.linkArrow}>→</Text>
              </TouchableOpacity>
            ) : (
              <View key={i} style={s.metodoItem}>
                <View style={s.metodoIcon}>
              <HelpIcon name={metodo.icon} size={18} color={cor} />
            </View>
                <View style={s.metodoInfo}>
                  <Text style={[s.metodoNome, { color: cor }]}>{metodo.nome}</Text>
                  <Text style={s.metodoDesc}>{metodo.desc}</Text>
                </View>
              </View>
            )
          ))}
        </View>
      )}
    </View>
  );
}

export default function HelpScreen({ navigation }) {
  const { colors } = useTheme();
  const s = useMemo(() => getHelpStyles(colors), [colors]);
  const [tutorialVisible, setTutorialVisible] = useState(false);

  return (
    <View style={s.container}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />
      <LinearGradient colors={colors.bgGradient} style={s.gradient} />

      <View style={s.header}>
        <TouchableOpacity style={s.backButton} activeOpacity={0.7} onPress={() => navigation.goBack()}>
          <Text style={s.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Ajuda nos Estudos</Text>
      </View>

      <ScrollView style={s.body} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={s.tutorialCard}
          activeOpacity={0.8}
          onPress={() => setTutorialVisible(true)}
        >
          <Text style={s.tutorialEmoji}>🎓</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.tutorialTitle}>Como usar o Studifire</Text>
            <Text style={s.tutorialSubtitle}>Tour rápido em 6 passos</Text>
          </View>
          <Text style={s.tutorialArrow}>→</Text>
        </TouchableOpacity>

        {SECOES.map((secao, i) => (
          <SecaoAccordion key={i} secao={secao} indice={i} />
        ))}
        <View style={s.bottomSpace} />
      </ScrollView>

      <TutorialModal visible={tutorialVisible} onClose={() => setTutorialVisible(false)} />
    </View>
  );
}

export function getHelpStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    gradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    header: {
      flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
      paddingTop: 50, paddingBottom: 12,
    },
    backButton: {
      width: 40, height: 40, borderRadius: 20,
      borderWidth: 1, borderColor: colors.border,
      backgroundColor: colors.card,
      alignItems: 'center', justifyContent: 'center', marginRight: 14,
    },
    backButtonText: { color: colors.textMuted, fontSize: 22 },
    headerTitle: { color: colors.text, fontSize: 22, fontWeight: '700' },
    body: { flex: 1, paddingHorizontal: 20 },
    tutorialCard: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.card, borderRadius: 14,
      borderWidth: 1, borderColor: colors.accentStrong,
      padding: 16, marginBottom: 12, marginTop: 4,
    },
    tutorialEmoji: { fontSize: 26, marginRight: 12 },
    tutorialTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
    tutorialSubtitle: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
    tutorialArrow: { color: colors.accent, fontSize: 20, fontWeight: '700', marginLeft: 8 },
    bottomSpace: { height: 40 },
    secaoCard: {
      backgroundColor: colors.card, borderRadius: 14,
      borderWidth: 1, borderColor: colors.border,
      marginBottom: 12, overflow: 'hidden',
    },
    secaoBar: { height: 4 },
    secaoHeader: {
      flexDirection: 'row', alignItems: 'center',
      padding: 16,
    },
    secaoIconContainer: {
      width: 40, height: 40, borderRadius: 20,
      alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    secaoTitleArea: { flex: 1 },
    secaoTitulo: { fontSize: 14, fontWeight: '700', letterSpacing: 0.8 },
    secaoSubtitulo: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
    secaoArrow: { fontSize: 12, marginLeft: 8 },
    secaoContent: { paddingHorizontal: 16, paddingBottom: 12 },
    linkItem: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.card2, borderRadius: 12,
      padding: 12, marginTop: 8,
    },
    linkIcon: { fontSize: 18, marginRight: 10 },
    linkInfo: { flex: 1 },
    linkNome: { color: colors.text, fontSize: 14, fontWeight: '600' },
    linkUrl: { fontSize: 12, marginTop: 2 },
    linkArrow: { color: colors.textMuted, fontSize: 16, marginLeft: 8 },
    metodoItem: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.card2, borderRadius: 12,
      padding: 12, marginTop: 8,
    },
    metodoIcon: { fontSize: 18, marginRight: 10 },
    metodoInfo: { flex: 1 },
    metodoNome: { fontSize: 14, fontWeight: '600' },
    metodoDesc: { color: colors.textMuted, fontSize: 13, marginTop: 2, lineHeight: 18 },
  });
}
