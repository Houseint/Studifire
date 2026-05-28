import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, SectionList, StatusBar, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserId } from '../hooks/useUserId';
import { carregarMaterias, carregarHistorico } from '../services/subjectsDb';

const FILTROS = [
  { key: 'todos', label: 'Todos' },
  { key: 'hoje', label: 'Hoje' },
  { key: 'semana', label: 'Esta semana' },
  { key: 'mes', label: 'Este mês' },
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
  const [filtro, setFiltro] = useState('todos');
  const [materias, setMaterias] = useState([]);
  const [sessoes, setSessoes] = useState([]);

  useEffect(() => {
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
  }, [userId]);

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

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0f1e" />
      <LinearGradient colors={['#0a0f1e', '#0d1a2e', '#0a1520']} style={s.gradient} />

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

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090E1F' },
  gradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
    paddingTop: 50, paddingBottom: 12,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1, borderColor: '#27315B',
    backgroundColor: '#111832',
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  backButtonText: { color: '#7F8AB7', fontSize: 22 },
  headerTitle: { color: '#F4F6FF', fontSize: 22, fontWeight: '700' },
  statsRow: {
    flexDirection: 'row', paddingHorizontal: 20, marginTop: 8, marginBottom: 16,
  },
  statCard: {
    flex: 1, alignItems: 'center',
    backgroundColor: '#111832',
    borderRadius: 14, borderWidth: 1, borderColor: '#27315B',
    paddingVertical: 14, marginHorizontal: 4,
  },
  statValue: { color: '#F4F6FF', fontSize: 20, fontWeight: '700' },
  statLabel: { color: '#8E97C4', fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 4 },
  filtrosRow: {
    flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12,
  },
  filtroBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 10,
    alignItems: 'center', marginHorizontal: 4,
    backgroundColor: '#111832',
  },
  filtroBtnAtivo: { backgroundColor: 'rgba(111,82,255,0.2)' },
  filtroBtnText: { color: '#7F8AB7', fontSize: 13, fontWeight: '600' },
  filtroBtnTextAtivo: { color: '#8A68FF' },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionHeader: {
    color: '#8F98C2', fontSize: 13, fontWeight: '600', textTransform: 'uppercase',
    letterSpacing: 0.8, marginTop: 16, marginBottom: 8,
  },
  sessionItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#111832', borderRadius: 12,
    padding: 14, marginBottom: 8,
  },
  sessionLeft: { flex: 1 },
  sessionSubject: { color: '#F4F6FF', fontSize: 15, fontWeight: '600' },
  sessionTime: { color: '#7F8AB7', fontSize: 13, marginTop: 2 },
  sessionDuration: { color: '#8A68FF', fontSize: 14, fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#7F8AB7', fontSize: 15 },
});
