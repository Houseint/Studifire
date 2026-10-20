import React, { useState, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, StyleSheet, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserId } from '../hooks/useUserId';
import { carregarMaterias, carregarHistorico } from '../services/subjectsDb';
import { buildHistoryDays } from '../shared/utils/activity';
import { getTopicCompletedAt } from '../shared/utils/fsrs';
import { BookOpenIcon, CheckIcon, CalendarIcon } from '../components/common/FeatherIcons';
import { useTheme } from '../shared/theme/ThemeContext';

const FILTROS = [
  { key: 'todos', label: 'Todos' },
  { key: 'hoje', label: 'Hoje' },
  { key: 'semana', label: 'Esta semana' },
  { key: 'mes', label: 'Este mês' },
];

export default function HistoricScreen({ navigation }) {
  const userId = useUserId();
  const { colors } = useTheme();
  const s = useMemo(() => getHistoricStyles(colors), [colors]);
  const [filtro, setFiltro] = useState('todos');
  const [materias, setMaterias] = useState([]);
  const [sessoes, setSessoes] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedDayKey, setSelectedDayKey] = useState(null);

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

  const historyDays = useMemo(
    () => buildHistoryDays(sessoes, materias, { period: filtro }),
    [sessoes, materias, filtro]
  );
  const sessoesPeriodo = useMemo(
    () => historyDays.flatMap((d) => d.sessions),
    [historyDays]
  );
  const selectedDay = useMemo(
    () =>
      historyDays.find((d) => d.key === selectedDayKey) ||
      historyDays.find((d) => d.isToday) ||
      historyDays[0] ||
      null,
    [historyDays, selectedDayKey]
  );
  const totalSessoes = sessoesPeriodo.length;
  const totalMaterias = new Set(
    [
      ...sessoesPeriodo.map((sess) => sess.subject_nome),
      ...historyDays.flatMap((d) => d.topics.map((t) => t.materiaNome)),
    ].filter(Boolean)
  ).size;
  const totalEstudadoMin = sessoesPeriodo.reduce(
    (acc, sess) => acc + (sess.duration_minutes || 0),
    0
  );
  const diasAtivos = historyDays.filter(
    (d) => d.sessions.length > 0 || d.topics.length > 0
  ).length;

  const renderDayPill = (d, fixed = false) => {
    const selected = selectedDay?.key === d.key;
    const temAtividade = d.sessions.length > 0 || d.topics.length > 0;
    return (
      <TouchableOpacity
        key={d.key}
        style={[
          s.dayPill,
          fixed && s.dayPillFixed,
          historyDays.length === 1 && s.dayPillSingle,
          d.isToday && s.dayPillToday,
          selected && s.dayPillSelected,
        ]}
        activeOpacity={0.7}
        onPress={() => setSelectedDayKey(d.key)}
        accessibilityRole="button"
        accessibilityLabel={`Dia ${d.weekday} ${String(d.day).padStart(2, '0')}`}
        accessibilityState={{ selected }}
      >
        <Text
          style={[
            s.dayPillLabel,
            d.isToday && s.dayPillLabelToday,
            selected && s.dayPillLabelSelected,
          ]}
        >
          {d.weekday}
        </Text>
        <Text style={[s.dayPillNumber, selected && s.dayPillNumberSelected]}>
          {String(d.day).padStart(2, '0')}
        </Text>
        <View
          style={[
            s.dayDot,
            temAtividade && s.dayDotActive,
            selected && s.dayDotSelected,
          ]}
        />
      </TouchableOpacity>
    );
  };

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

      <ScrollView
        style={s.contentScroll}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.historyCard}>
          <View style={s.cardHeader}>
            <View style={s.cardIconWrap}>
              <CalendarIcon size={16} color={colors.accent} />
            </View>
            <View style={s.cardHeaderBody}>
              <Text style={s.cardLabel}>HISTÓRICO</Text>
              <Text style={s.cardText}>
                {totalSessoes} {totalSessoes === 1 ? 'sessão' : 'sessões'} · {formatarTempo(totalEstudadoMin)}
              </Text>
            </View>
          </View>

          {historyDays.length === 0 ? (
            <Text style={s.emptyDayText}>
              Nenhuma sessão registrada nesse período.
            </Text>
          ) : (
            <>
              {historyDays.length <= 7 ? (
                <View style={s.weekStrip}>
                  {historyDays.map((d) => renderDayPill(d))}
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={s.weekStripScroll}
                >
                  {historyDays.map((d) => renderDayPill(d, true))}
                </ScrollView>
              )}

              {selectedDay ? (
                <View style={[s.dayBlock, selectedDay.isToday && s.dayBlockToday]}>
                  <View style={s.dayHeader}>
                    <Text style={s.dayLabel}>
                      {selectedDay.weekday} · {String(selectedDay.day).padStart(2, '0')}
                    </Text>
                    {selectedDay.isToday ? (
                      <Text style={s.todayBadge}>HOJE</Text>
                    ) : null}
                  </View>

                  {selectedDay.sessions.length === 0 && selectedDay.topics.length === 0 ? (
                    <Text style={s.emptyDayText}>
                      Nenhuma sessão registrada nesse dia.
                    </Text>
                  ) : (
                    <>
                      {selectedDay.sessions.map((sess, idx) => (
                        <TouchableOpacity
                          key={`sess-${sess.id ?? idx}`}
                          style={s.itemRow}
                          activeOpacity={0.7}
                          onPress={() => setSelectedSession(sess)}
                          accessibilityRole="button"
                          accessibilityLabel={`Ver sessão de ${sess.subject_nome}`}
                        >
                          <View style={s.itemIcon}>
                            <BookOpenIcon size={14} color={colors.accent} />
                          </View>
                          <View style={s.itemBody}>
                            <Text style={s.itemName} numberOfLines={1}>
                              {sess.subject_nome}
                            </Text>
                            <Text style={s.itemMeta} numberOfLines={1}>
                              {formatHora(sess.started_at)} ·{' '}
                              {sess.duration_minutes > 0
                                ? formatarTempo(sess.duration_minutes)
                                : '—'}
                            </Text>
                          </View>
                          <Text style={s.itemTag}>SESSÃO</Text>
                          <Text style={s.sessionChevron}>›</Text>
                        </TouchableOpacity>
                      ))}

                      {selectedDay.topics.length > 0 ? (
                        <View style={s.topicsBlock}>
                          <Text style={s.topicsLabel}>TÓPICOS CONCLUÍDOS</Text>
                          {selectedDay.topics.map((topico) => (
                            <TouchableOpacity
                              key={topico.key}
                              style={s.itemRow}
                              activeOpacity={0.7}
                              disabled={topico.materiaId == null}
                              onPress={() =>
                                navigation?.navigate('Detail', { id: topico.materiaId })
                              }
                              accessibilityRole="button"
                              accessibilityLabel={`Abrir ${topico.materiaNome}`}
                            >
                              <View style={[s.itemIcon, s.topicIcon]}>
                                <CheckIcon size={14} color={colors.accent} />
                              </View>
                              <View style={s.itemBody}>
                                <Text style={s.itemName} numberOfLines={1}>
                                  {topico.topicoNome}
                                </Text>
                                <Text style={s.itemMeta} numberOfLines={1}>
                                  {topico.materiaNome} · Concluído
                                </Text>
                              </View>
                              <Text style={s.itemTag}>TÓPICO</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      ) : null}
                    </>
                  )}
                </View>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>

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
    contentScroll: { flex: 1 },
    listContent: { paddingHorizontal: 20, paddingBottom: 40 },
    historyCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginBottom: 16,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    cardIconWrap: {
      width: 32, height: 32, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center', marginRight: 10,
      backgroundColor: 'rgba(111,82,255,0.14)',
      borderWidth: 1, borderColor: 'rgba(111,82,255,0.30)',
    },
    cardHeaderBody: { flex: 1 },
    cardLabel: {
      color: colors.textMuted, fontSize: 10, fontWeight: '800',
      textTransform: 'uppercase', letterSpacing: 0.6,
    },
    cardText: { color: colors.textMuted, fontSize: 11, marginTop: 3 },
    weekStrip: { flexDirection: 'row', gap: 4, marginBottom: 10 },
    weekStripScroll: { gap: 6, paddingBottom: 8, marginBottom: 2 },
    dayPill: {
      flex: 1, alignItems: 'center', paddingVertical: 7,
      borderRadius: 10, borderWidth: 1, borderColor: 'transparent',
      backgroundColor: colors.card2,
    },
    dayPillFixed: { flex: 0, width: 54 },
    dayPillSingle: { flex: 0, width: 72 },
    dayPillToday: { borderColor: 'rgba(111,82,255,0.35)' },
    dayPillSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
    dayPillLabel: {
      color: colors.textMuted, fontSize: 9, fontWeight: '800',
      textTransform: 'uppercase', letterSpacing: 0.3,
    },
    dayPillLabelToday: { color: colors.accent },
    dayPillLabelSelected: { color: '#fff' },
    dayPillNumber: { color: colors.text, fontSize: 15, fontWeight: '800', marginTop: 3 },
    dayPillNumberSelected: { color: '#fff' },
    dayDot: {
      width: 4, height: 4, borderRadius: 2, marginTop: 4,
      backgroundColor: colors.textMuted, opacity: 0.25,
    },
    dayDotActive: { backgroundColor: colors.accent, opacity: 1 },
    dayDotSelected: { backgroundColor: '#fff', opacity: 1 },
    dayBlock: {
      borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10,
    },
    dayBlockToday: {},
    dayHeader: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', marginBottom: 8,
    },
    dayLabel: { color: colors.text, fontSize: 12, fontWeight: '800' },
    todayBadge: {
      color: colors.accent, fontSize: 9, fontWeight: '800', letterSpacing: 0.5,
      borderWidth: 1, borderColor: 'rgba(111,82,255,0.35)', borderRadius: 6,
      paddingHorizontal: 6, paddingVertical: 2, overflow: 'hidden',
    },
    emptyDayText: { color: colors.textMuted, fontSize: 12, paddingVertical: 10 },
    itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
    itemIcon: {
      width: 30, height: 30, borderRadius: 9,
      alignItems: 'center', justifyContent: 'center', marginRight: 9,
      backgroundColor: 'rgba(111,82,255,0.12)',
      borderWidth: 1, borderColor: 'rgba(111,82,255,0.25)',
    },
    topicIcon: { backgroundColor: 'rgba(111,82,255,0.08)' },
    itemBody: { flex: 1 },
    itemName: { color: colors.text, fontSize: 13, fontWeight: '600' },
    itemMeta: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
    itemTag: {
      color: colors.accent, fontSize: 9, fontWeight: '800', letterSpacing: 0.4,
      borderWidth: 1, borderColor: 'rgba(111,82,255,0.35)', borderRadius: 7,
      paddingHorizontal: 6, paddingVertical: 3, overflow: 'hidden', marginLeft: 8,
    },
    sessionChevron: { color: colors.textMuted, fontSize: 18, marginLeft: 6, lineHeight: 18 },
    topicsBlock: {
      marginTop: 8, paddingTop: 8,
      borderTopWidth: 1, borderTopColor: colors.border,
    },
    topicsLabel: {
      color: colors.textMuted, fontSize: 9, fontWeight: '800',
      letterSpacing: 0.6, marginBottom: 4,
    },
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
