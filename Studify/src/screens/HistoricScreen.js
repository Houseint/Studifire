import React, { useState, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, TouchableOpacity, SectionList, StatusBar, StyleSheet, Modal, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserId } from '../hooks/useUserId';
import { carregarMaterias, carregarHistorico } from '../services/subjectsDb';
import { buildActivityHeatmap, buildWeeklyActivity } from '../shared/utils/activity';
import { getTopicCompletedAt } from '../shared/utils/fsrs';
import { useTheme } from '../shared/theme/ThemeContext';

const HEATMAP_COLORS_DARK = ['#1B2342', '#2E3A6E', '#4A569E', '#6F52FF', '#9D86FF'];
const HEATMAP_COLORS_LIGHT = ['#E1E6F5', '#C3CBEE', '#9AA4DF', '#6F52FF', '#4B32CC'];

function getHeatmapColors(colors) {
  return colors.mode === 'light' ? HEATMAP_COLORS_LIGHT : HEATMAP_COLORS_DARK;
}

const FILTROS = [
  { key: 'todos', label: 'Todos' },
  { key: 'hoje', label: 'Hoje' },
  { key: 'semana', label: 'Esta semana' },
  { key: 'mes', label: 'Este mês' },
];

// Ordem de exibição da semana (seg → dom).
const DIAS_SEMANA = [
  { dow: 1, label: 'Seg' },
  { dow: 2, label: 'Ter' },
  { dow: 3, label: 'Qua' },
  { dow: 4, label: 'Qui' },
  { dow: 5, label: 'Sex' },
  { dow: 6, label: 'Sáb' },
  { dow: 0, label: 'Dom' },
];

function getFiltroData(filtro) {
  const now = new Date();
  switch (filtro) {
    case 'hoje':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case 'semana': {
      const d = new Date(now);
      d.setDate(d.getDate() - d.getDay());
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case 'mes':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    default:
      return null;
  }
}

export default function HistoricScreen({ navigation }) {
  const userId = useUserId();
  const { colors } = useTheme();
  const s = useMemo(() => getHistoricStyles(colors), [colors]);
  const [filtro, setFiltro] = useState('todos');
  const [materias, setMaterias] = useState([]);
  const [sessoes, setSessoes] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);

  useFocusEffect(
    React.useCallback(() => {
      if (!userId) return;
      (async () => {
        try {
          const m = await carregarMaterias(userId);
          setMaterias(m);
          const s = await carregarHistorico(userId);
          setSessoes(s);
        } catch (e) {
          console.error('Erro ao carregar histórico:', e);
        }
      })();
      return () => {};
    }, [userId])
  );

  const filtroData = getFiltroData(filtro);
  const sessoesFiltradas = filtroData
    ? sessoes.filter((s) => new Date(s.started_at) >= filtroData)
    : sessoes;

  const totalMaterias = materias.length;
  const totalEstudadoMin = sessoes.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
  const diasAtivos = new Set(
    sessoes.map((s) => new Date(s.started_at).toDateString())
  ).size;

  const sections = agruparPorData(sessoesFiltradas);
  const heatmap = buildActivityHeatmap(sessoes);
  const heatmapColors = getHeatmapColors(colors);

  // Atividade da semana atual (seg → dom): sessões + tópicos concluídos.
  const atividadeSemana = useMemo(
    () => buildWeeklyActivity(sessoes, materias),
    [sessoes, materias]
  );

  // Tópicos concluídos no mesmo dia da sessão selecionada.
  const selectedTopics = useMemo(() => {
    if (!selectedSession) return [];
    const materia = materias.find(
      (m) => String(m.id) === String(selectedSession.subject_id)
    );
    if (!materia) return [];
    const sessionDate = new Date(selectedSession.started_at).toDateString();
    const seen = new Set();
    return (Array.isArray(materia.topicos) ? materia.topicos : [])
      .filter((t) => {
        const completedAt = getTopicCompletedAt(t);
        return completedAt && completedAt.toDateString() === sessionDate;
      })
      .map((t) => t?.nome || t?.titulo || 'tópico')
      .filter((nome) => {
        if (seen.has(nome)) return false;
        seen.add(nome);
        return true;
      });
  }, [selectedSession, materias]);

  return (
    <View style={s.container}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />
      <LinearGradient colors={colors.bgGradient} style={s.gradient} />

      <View style={s.header}>
        <TouchableOpacity style={s.backButton} activeOpacity={0.7} onPress={() => navigation.goBack()}>
          <Text style={s.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Histórico</Text>
      </View>

      <View style={s.statsRow}>
        <View style={s.statCard}>
          <Text style={s.statValue}>{totalMaterias}</Text>
          <Text style={s.statLabel}>Matérias</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statValue}>{formatarTempo(totalEstudadoMin)}</Text>
          <Text style={s.statLabel}>Total estudo</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statValue}>{diasAtivos}</Text>
          <Text style={s.statLabel}>Dias ativos</Text>
        </View>
      </View>

      <View style={s.filtrosRow}>
        {FILTROS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[s.filtroBtn, filtro === f.key && s.filtroBtnAtivo]}
            activeOpacity={0.7}
            onPress={() => setFiltro(f.key)}
          >
            <Text style={[s.filtroBtnText, filtro === f.key && s.filtroBtnTextAtivo]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.heatmapCard}>
        <Text style={s.heatmapTitle}>Últimos 7 dias</Text>
        <View style={s.heatmapRow}>
          {heatmap.map((d) => (
            <View key={d.key} style={s.heatmapCell}>
              <View
                style={[
                  s.heatmapDot,
                  { backgroundColor: heatmapColors[d.level] || heatmapColors[0] },
                  d.isToday && s.heatmapDotToday,
                ]}
              />
              <Text style={[s.heatmapWeekday, d.isToday && s.heatmapWeekdayToday]}>
                {d.weekday}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={s.heatmapCard}>
        <Text style={s.heatmapTitle}>Sua semana</Text>
        {DIAS_SEMANA.map(({ dow, label }) => {
          const atividade = atividadeSemana[dow] || { sessoes: [], topicos: [] };
          const isToday = new Date().getDay() === dow;
          const temSessoes = atividade.sessoes.length > 0;
          const temTopicos = atividade.topicos.length > 0;
          return (
            <View
              key={`dia-${dow}`}
              style={[s.weekDayRow, dow !== 1 && s.weekDayRowBorder]}
            >
              <Text style={[s.weekDayLabel, isToday && s.weekDayLabelToday]}>
                {label}
              </Text>
              <View style={s.weekDayContent}>
                {temSessoes ? (
                  <Text style={s.weekDayText} numberOfLines={1}>
                    {atividade.sessoes.join(', ')}
                  </Text>
                ) : null}
                {temTopicos ? (
                  <Text style={s.weekDayTopicText} numberOfLines={2}>
                    ✓ {atividade.topicos.map((t) => `${t.materiaNome} · ${t.topicoNome}`).join(', ')}
                  </Text>
                ) : null}
                {!temSessoes && !temTopicos ? (
                  <Text style={[s.weekDayText, s.weekDayTextEmpty]}>—</Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.sessionItem}
            activeOpacity={0.7}
            onPress={() => setSelectedSession(item)}
            accessibilityRole="button"
            accessibilityLabel={`Ver sessão de ${item.subject_nome}`}
          >
            <View style={s.sessionLeft}>
              <Text style={s.sessionSubject}>{item.subject_nome}</Text>
              <Text style={s.sessionTime}>
                {new Date(item.started_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <View style={s.sessionRight}>
              <Text style={s.sessionDuration}>
                {item.duration_minutes > 0 ? formatarTempo(item.duration_minutes) : '—'}
              </Text>
              <Text style={s.sessionChevron}>›</Text>
            </View>
          </TouchableOpacity>
        )}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={s.sectionHeader}>{title}</Text>
        )}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyText}>Nenhuma sessão encontrada</Text>
          </View>
        }
      />

      <Modal
        visible={!!selectedSession}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedSession(null)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            {selectedSession ? (
              <>
                <View style={s.modalHeader}>
                  <Text style={s.modalTitle} numberOfLines={1}>
                    {selectedSession.subject_nome}
                  </Text>
                  <TouchableOpacity
                    style={s.modalClose}
                    activeOpacity={0.7}
                    onPress={() => setSelectedSession(null)}
                    accessibilityRole="button"
                    accessibilityLabel="Fechar detalhes da sessão"
                  >
                    <Text style={s.modalCloseText}>×</Text>
                  </TouchableOpacity>
                </View>

                <Text style={s.modalDate}>
                  {formatSessionDate(selectedSession.started_at)}
                </Text>

                <View style={s.modalStatsRow}>
                  <View style={s.modalStat}>
                    <Text style={s.modalStatValue}>
                      {formatHora(selectedSession.started_at)}
                    </Text>
                    <Text style={s.modalStatLabel}>Início</Text>
                  </View>
                  <View style={s.modalStat}>
                    <Text style={s.modalStatValue}>
                      {selectedSession.duration_minutes > 0
                        ? formatarTempo(selectedSession.duration_minutes)
                        : '—'}
                    </Text>
                    <Text style={s.modalStatLabel}>Duração</Text>
                  </View>
                </View>

                {selectedTopics.length > 0 ? (
                  <>
                    <Text style={s.modalSectionTitle}>
                      Tópicos concluídos nesse dia
                    </Text>
                    <ScrollView
                      style={s.modalTopicsScroll}
                      showsVerticalScrollIndicator={false}
                    >
                      {selectedTopics.map((topico, idx) => (
                        <Text key={`${topico}-${idx}`} style={s.modalTopic}>
                          ✓ {topico}
                        </Text>
                      ))}
                    </ScrollView>
                  </>
                ) : null}

                <TouchableOpacity
                  style={s.modalButton}
                  activeOpacity={0.8}
                  onPress={() => {
                    const id = selectedSession.subject_id;
                    setSelectedSession(null);
                    navigation?.navigate('Detail', { id });
                  }}
                >
                  <Text style={s.modalButtonText}>Abrir matéria</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function formatarTempo(minutos) {
  if (minutos < 60) return `${minutos}min`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m > 0 ? `${h}h${m}min` : `${h}h`;
}

function agruparPorData(sessoes) {
  const map = {};
  sessoes.forEach((s) => {
    const data = new Date(s.started_at).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
    if (!map[data]) map[data] = [];
    map[data].push(s);
  });
  return Object.entries(map).map(([title, data]) => ({ title, data }));
}

function formatSessionDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);
  const mesmoDia = (a, b) => a.toDateString() === b.toDateString();
  const data = d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    ...(d.getFullYear() !== hoje.getFullYear() ? { year: 'numeric' } : {}),
  });
  if (mesmoDia(d, hoje)) return `Hoje · ${data}`;
  if (mesmoDia(d, ontem)) return `Ontem · ${data}`;
  return data;
}

function formatHora(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function getHistoricStyles(colors) {
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
    statsRow: {
      flexDirection: 'row', paddingHorizontal: 20, marginTop: 8, marginBottom: 16,
    },
    statCard: {
      flex: 1, alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 14, borderWidth: 1, borderColor: colors.border,
      paddingVertical: 14, marginHorizontal: 4,
    },
    statValue: { color: colors.text, fontSize: 20, fontWeight: '700' },
    statLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 4 },
    filtrosRow: {
      flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12,
    },
    filtroBtn: {
      flex: 1, paddingVertical: 8, borderRadius: 10,
      alignItems: 'center', marginHorizontal: 4,
      backgroundColor: colors.card,
    },
    filtroBtnAtivo: { backgroundColor: 'rgba(111,82,255,0.2)' },
    filtroBtnText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
    filtroBtnTextAtivo: { color: colors.accent },
    heatmapCard: {
      backgroundColor: colors.card, borderRadius: 14,
      borderWidth: 1, borderColor: colors.border,
      paddingVertical: 12, paddingHorizontal: 16,
      marginHorizontal: 20, marginBottom: 12,
    },
    heatmapTitle: { color: colors.textMuted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 },
    heatmapRow: { flexDirection: 'row', justifyContent: 'space-between' },
    heatmapCell: { alignItems: 'center' },
    heatmapDot: { width: 26, height: 26, borderRadius: 8, marginBottom: 6 },
    heatmapDotToday: { borderWidth: 2, borderColor: colors.text },
    heatmapWeekday: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
    heatmapWeekdayToday: { color: colors.text },
    weekDayRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 5 },
    weekDayRowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
    weekDayLabel: { width: 36, fontSize: 11, fontWeight: '800', color: colors.textMuted, paddingTop: 1 },
    weekDayLabelToday: { color: colors.accent },
    weekDayContent: { flex: 1 },
    weekDayText: { fontSize: 12, color: colors.text },
    weekDayTextEmpty: { color: colors.textMuted },
    weekDayTopicText: { fontSize: 11, color: colors.accent, marginTop: 3, lineHeight: 15 },
    listContent: { paddingHorizontal: 20, paddingBottom: 40 },
    sectionHeader: {
      color: colors.textMuted, fontSize: 13, fontWeight: '600', textTransform: 'uppercase',
      letterSpacing: 0.8, marginTop: 16, marginBottom: 8,
    },
    sessionItem: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: colors.card, borderRadius: 12,
      padding: 14, marginBottom: 8,
    },
    sessionLeft: { flex: 1 },
    sessionSubject: { color: colors.text, fontSize: 15, fontWeight: '600' },
    sessionTime: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
    sessionRight: { flexDirection: 'row', alignItems: 'center', marginLeft: 10 },
    sessionDuration: { color: colors.accent, fontSize: 14, fontWeight: '600' },
    sessionChevron: { color: colors.textMuted, fontSize: 20, marginLeft: 6, lineHeight: 20 },
    empty: { alignItems: 'center', marginTop: 60 },
    emptyText: { color: colors.textMuted, fontSize: 15 },
    modalOverlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'center', paddingHorizontal: 24,
    },
    modalCard: {
      backgroundColor: colors.card, borderRadius: 18,
      borderWidth: 1, borderColor: colors.border,
      padding: 20,
    },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    modalTitle: { flex: 1, color: colors.text, fontSize: 18, fontWeight: '700', marginRight: 12 },
    modalClose: {
      width: 32, height: 32, borderRadius: 16,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.card2, borderWidth: 1, borderColor: colors.border,
    },
    modalCloseText: { color: colors.textMuted, fontSize: 20, lineHeight: 22 },
    modalDate: { color: colors.textMuted, fontSize: 13, marginTop: 4, marginBottom: 16 },
    modalStatsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    modalStat: {
      flex: 1, backgroundColor: colors.card2, borderRadius: 12,
      borderWidth: 1, borderColor: colors.border, padding: 12,
    },
    modalStatValue: { color: colors.text, fontSize: 16, fontWeight: '700' },
    modalStatLabel: {
      color: colors.textMuted, fontSize: 10, fontWeight: '600',
      textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4,
    },
    modalSectionTitle: {
      color: colors.textMuted, fontSize: 11, fontWeight: '700',
      textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8,
    },
    modalTopicsScroll: { maxHeight: 140 },
    modalTopic: { color: colors.text, fontSize: 13, marginBottom: 6, lineHeight: 18 },
    modalButton: {
      backgroundColor: colors.accent, borderRadius: 12,
      paddingVertical: 12, alignItems: 'center', marginTop: 16,
    },
    modalButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  });
}
