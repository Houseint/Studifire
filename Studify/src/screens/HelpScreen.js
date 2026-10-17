import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking, StatusBar, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HELP_LINKS } from '../constants/helpLinks';
import { useTheme } from '../shared/theme/ThemeContext';
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
    icon: 'bookOpen',
    titulo: 'MÉTODOS DE ESTUDO',
    subtitulo: 'Técnicas para aprender melhor',
    metodos: [
      { icon: 'clock', nome: 'Pomodoro', desc: 'Ciclos de 25 min de foco com pausas de 5 min. Após 4 ciclos, pausa de 15-30 min.' },
      { icon: 'sparkles', nome: 'Feynman', desc: 'Explique o conteúdo com suas próprias palavras, como se estivesse ensinando alguém.' },
      { icon: 'book', nome: 'SQ3R', desc: 'Survey, Question, Read, Recite, Review — leitura ativa em 5 etapas.' },
      { icon: 'map', nome: 'Mapas Mentais', desc: 'Diagramas visuais com o tema central e ramificações de ideias conectadas.' },
      { icon: 'refresh', nome: 'Flashcards + Espaçada', desc: 'Cartas de pergunta/resposta revisadas em intervalos crescentes de tempo.' },
      { icon: 'zap', nome: 'Pareto 80/20', desc: 'Foque nos 20% do conteúdo que geram 80% dos resultados.' },
      { icon: 'pencil', nome: 'Estudo Ativo', desc: 'Interaja com o material: resolva exercícios, questione e aplique o que aprendeu.' },
    ],
  },
  {
    icon: 'target',
    titulo: 'AUTONOMIA & AUTODIDATISMO',
    subtitulo: 'Estratégias para aprender sozinho',
    metodos: [
      { icon: 'zap', nome: 'Aprendizado por Projetos', desc: 'Defina um projeto concreto e aprenda o necessário para realizá-lo (PBL).' },
      { icon: 'bookOpen', nome: 'Cursos Online', desc: 'Consumo estratégico: defina objetivos, evite acumular cursos inacabados.' },
      { icon: 'search', nome: 'Resolução de Problemas', desc: 'Aprenda enfrentando desafios reais — exercícios, casos e simulações.' },
      { icon: 'trending', nome: 'Autoavaliação', desc: 'Reflita sobre seu progresso, ajuste métodos e ritmo continuamente.' },
      { icon: 'calendar', nome: 'Roteiro de Estudos', desc: 'Planejamento que define o que, quando e como estudar — reduz ansiedade.' },
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
        {SECOES.map((secao, i) => (
          <SecaoAccordion key={i} secao={secao} indice={i} />
        ))}
        <View style={s.bottomSpace} />
      </ScrollView>
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
