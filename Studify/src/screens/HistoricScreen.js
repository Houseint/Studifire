import React, { useState, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, TouchableOpacity, SectionList, StatusBar, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserId } from '../hooks/useUserId';
import { carregarMaterias, carregarHistorico } from '../services/subjectsDb';
import { buildActivityHeatmap } from '../shared/utils/activity';
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

  // Matérias estudadas em cada dia da semana atual — responde "o que eu
  // estudo sábado/domingo?" sem precisar caçar sessão por sessão.
  const materiasPorDia = useMemo(() => {
    const inicio = new Date();
    inicio.setHours(0, 0, 0, 0);
    inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));
    const byDay = {};
    sessoes.forEach((sess) => {
      const d = new Date(sess.started_at);
      if (Number.isNaN(d.getTime()) || d < inicio) return;
      const dow = d.getDay();
      if (!byDay[dow]) byDay[dow] = [];
      if (sess.subject_nome && !byDay[dow].includes(sess.subject_nome)) {
        byDay[dow].push(sess.subject_nome);
      }
    });
    return byDay;
  }, [sessoes]);

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
        <Text style={s.heatmapTitle}>Matérias da semana</Text>
        {DIAS_SEMANA.map(({ dow, label }) => {
          const nomes = materiasPorDia[dow] || [];
          const isToday = new Date().getDay() === dow;
          return (
                <View
                  key={`dia-${dow}`}
                  style={[s.weekDayRow, dow !== 1 && s.weekDayRowBorder]}
                >
                  <Text style={[s.weekDayLabel, isToday && s.weekDayLabelToday]}>
                    {label}
                  </Text>
                  <Text
                    style={[s.weekDayText, !nomes.length && s.weekDayTextEmpty]}
                    numberOfLines={1}
                  >
                {nomes.length ? nomes.join(', ') : '—'}
              </Text>
            </View>
          );
        })}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={s.sessionItem}>
            <View style={s.sessionLeft}>
              <Text style={s.sessionSubject}>{item.subject_nome}</Text>
              <Text style={s.sessionTime}>
                {new Date(item.started_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <Text style={s.sessionDuration}>
              {item.duration_minutes > 0 ? formatarTempo(item.duration_minutes) : '—'}
            </Text>
          </View>
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
    weekDayRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
    weekDayRowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
    weekDayLabel: { width: 36, fontSize: 11, fontWeight: '800', color: colors.textMuted },
    weekDayLabelToday: { color: colors.accent },
    weekDayText: { flex: 1, fontSize: 12, color: colors.text },
    weekDayTextEmpty: { color: colors.textMuted },
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
    sessionDuration: { color: colors.accent, fontSize: 14, fontWeight: '600' },
    empty: { alignItems: 'center', marginTop: 60 },
    emptyText: { color: colors.textMuted, fontSize: 15 },
  });
}
