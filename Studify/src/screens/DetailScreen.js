import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StatusBar, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getMateriaById, atualizarMateria, registrarSessao, carregarSessoesPorMateria } from '../services/subjectsDb';
import { useUserId } from '../hooks/useUserId';

export default function DetailScreen({ route, navigation }) {
  const userId = useUserId();
  const id = route?.params?.id;
  const [materia, setMateria] = useState(null);
  const [sessoes, setSessoes] = useState([]);
  const [studying, setStudying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!id || !userId) {
      if (!id) navigation.goBack();
      return;
    }
    (async () => {
      try {
        const m = await getMateriaById(userId, id);
        setMateria(m);
        const s = await carregarSessoesPorMateria(userId, id);
        setSessoes(s);
      } catch (e) {
        console.error('Erro ao carregar detalhes:', e);
      }
    })();
  }, [id, userId]);

  useEffect(() => {
    if (studying && !paused) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [studying, paused]);

  const toggleTopico = async (index) => {
    if (!materia) return;
    const novosTopicos = materia.topicos.map((t, i) =>
      i === index ? { ...t, estudado: !t.estudado } : t
    );
    await atualizarMateria(userId, id, { topicos: novosTopicos });
    setMateria({ ...materia, topicos: novosTopicos });
  };

  const startStudy = () => {
    setElapsedSeconds(0);
    setPaused(false);
    setStudying(true);
  };

  const stopStudy = async () => {
    const minutos = Math.round(elapsedSeconds / 60);
    if (minutos > 0) {
      await registrarSessao(userId, id, minutos);
      const s = await carregarSessoesPorMateria(userId, id);
      setSessoes(s);
    }
    setStudying(false);
    setPaused(false);
    setElapsedSeconds(0);
  };

  const pauseStudy = () => {
    setPaused(true);
  };

  const resumeStudy = () => {
    setPaused(false);
  };

  const handleBack = () => {
    if (studying) {
      Alert.alert(
        'Estudo em andamento',
        'Você tem uma sessão ativa. Deseja salvar o tempo parcial antes de sair?',
        [
          { text: 'Sair sem salvar', style: 'destructive', onPress: () => navigation.goBack() },
          { text: 'Salvar e sair', onPress: async () => { await stopStudy(); navigation.goBack(); } },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  if (!materia) {
    return (
      <View style={s.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0f1e" />
        <Text style={s.loadingText}>Carregando...</Text>
      </View>
    );
  }

  const concluidos = materia.topicos.filter((t) => t.estudado).length;
  const total = materia.topicos.length;
  const progresso = total > 0 ? concluidos / total : 0;
  const totalEstudadoMin = sessoes.reduce((acc, sess) => acc + (sess.duration_minutes || 0), 0);

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0f1e" />
      <LinearGradient colors={['#0a0f1e', '#0d1a2e', '#0a1520']} style={s.gradient} />

      <View style={s.header}>
        <TouchableOpacity style={s.backButton} activeOpacity={0.7} onPress={handleBack}>
          <Text style={s.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{materia.nome}</Text>
      </View>

      <ScrollView style={s.body} showsVerticalScrollIndicator={false}>
        <View style={s.progressCard}>
          <View style={s.progressCircle}>
            <Text style={s.progressCircleText}>{Math.round(progresso * 100)}%</Text>
            <Text style={s.progressCircleLabel}>concluído</Text>
          </View>
          <View style={s.progressInfo}>
            <Text style={s.progressInfoText}>{concluidos}/{total} tópicos</Text>
            <Text style={s.progressInfoSub}>Tempo total: {formatarTempo(totalEstudadoMin)}</Text>
          </View>
        </View>

        {studying ? (
          <View style={s.timerCard}>
            <Text style={s.timerLabel}>
              {paused ? 'Pausado' : 'Estudando'}
            </Text>
            <Text style={s.timerDisplay}>
              {formatarCronometro(elapsedSeconds)}
            </Text>
            <View style={s.timerRow}>
              {paused ? (
                <TouchableOpacity style={s.timerBtnResume} activeOpacity={0.8} onPress={resumeStudy}>
                  <Text style={s.timerBtnResumeText}>▶ Retomar</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={s.timerBtnPause} activeOpacity={0.8} onPress={pauseStudy}>
                  <Text style={s.timerBtnPauseText}>⏸ Pausar</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={s.timerBtnStop} activeOpacity={0.8} onPress={stopStudy}>
                <Text style={s.timerBtnStopText}>⏹ Parar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={s.startButton} activeOpacity={0.8} onPress={startStudy}>
            <Text style={s.startButtonText}>▶ Iniciar Estudos</Text>
          </TouchableOpacity>
        )}

        <Text style={s.sectionTitle}>Tópicos</Text>
        {materia.topicos.map((topico, index) => (
          <TouchableOpacity
            key={index}
            style={[s.topicoRow, topico.estudado && s.topicoRowDone]}
            activeOpacity={0.7}
            onPress={() => toggleTopico(index)}
          >
            <View style={[s.checkbox, topico.estudado && s.checkboxChecked]}>
              {topico.estudado && <Text style={s.checkboxIcon}>✓</Text>}
            </View>
            <Text style={[s.topicoLabel, topico.estudado && s.topicoLabelDone]}>
              {topico.nome}
            </Text>
          </TouchableOpacity>
        ))}

        {sessoes.length > 0 && (
          <>
            <Text style={s.sectionTitle}>SESSÕES DE ESTUDO</Text>
            {sessoes.slice(0, 20).map((sessao) => (
              <View key={sessao.id} style={s.sessionRow}>
                <Text style={s.sessionDate}>
                  {new Date(sessao.started_at).toLocaleDateString('pt-BR', {
                    day: '2-digit', month: '2-digit',
                  })} · {new Date(sessao.started_at).toLocaleTimeString('pt-BR', {
                    hour: '2-digit', minute: '2-digit',
                  })}
                </Text>
                <Text style={s.sessionDuration}>
                  {sessao.duration_minutes > 0 ? formatarTempo(sessao.duration_minutes) : '—'}
                </Text>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function formatarTempo(minutos) {
  if (minutos < 60) return `${minutos} min`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function formatarCronometro(segundos) {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090E1F' },
  gradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  loadingText: { color: '#7F8AB7', fontSize: 16, textAlign: 'center', marginTop: 100 },
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
  headerTitle: { color: '#F4F6FF', fontSize: 20, fontWeight: '700', flex: 1 },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  progressCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111832',
    borderRadius: 16, borderWidth: 1, borderColor: '#27315B',
    padding: 20, marginBottom: 24,
  },
  progressCircle: {
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 3, borderColor: '#8A68FF',
    alignItems: 'center', justifyContent: 'center', marginRight: 20,
  },
  progressCircleText: { color: '#F4F6FF', fontSize: 22, fontWeight: '700' },
  progressCircleLabel: { color: '#7F8AB7', fontSize: 11, marginTop: 2 },
  progressInfo: { flex: 1 },
  progressInfoText: { color: '#F4F6FF', fontSize: 16, fontWeight: '600' },
  progressInfoSub: { color: '#7F8AB7', fontSize: 13, marginTop: 4 },
  sectionTitle: {
    color: '#8F98C2', fontSize: 14, fontWeight: '600', textTransform: 'uppercase',
    letterSpacing: 1, marginBottom: 12,
  },
  topicoRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111832',
    borderRadius: 12, padding: 14, marginBottom: 8,
  },
  topicoRowDone: { backgroundColor: 'rgba(111,82,255,0.08)' },
  checkbox: {
    width: 24, height: 24, borderRadius: 6,
    borderWidth: 2, borderColor: '#27315B',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  checkboxChecked: { backgroundColor: '#6F52FF', borderColor: '#6F52FF' },
  checkboxIcon: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  topicoLabel: { color: '#F4F6FF', fontSize: 15, flex: 1 },
  topicoLabelDone: { color: '#7F8AB7', textDecorationLine: 'line-through' },

  startButton: {
    backgroundColor: '#6F52FF', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginBottom: 24,
  },
  startButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  timerCard: {
    backgroundColor: 'rgba(111,82,255,0.1)',
    borderRadius: 16, borderWidth: 1, borderColor: '#6F52FF',
    padding: 20, alignItems: 'center', marginBottom: 24,
  },
  timerLabel: { color: '#8A68FF', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  timerDisplay: { color: '#F4F6FF', fontSize: 48, fontWeight: '200', fontVariant: ['tabular-nums'], marginVertical: 12 },
  timerRow: { flexDirection: 'row', gap: 12 },
  timerBtnPause: {
    backgroundColor: '#111832', borderRadius: 10, borderWidth: 1, borderColor: '#27315B',
    paddingVertical: 10, paddingHorizontal: 24,
  },
  timerBtnPauseText: { color: '#F4F6FF', fontSize: 15, fontWeight: '600' },
  timerBtnResume: {
    backgroundColor: '#6F52FF', borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 24,
  },
  timerBtnResumeText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  timerBtnStop: {
    backgroundColor: '#D23A3A', borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 24,
  },
  timerBtnStopText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  sessionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#111832', borderRadius: 12,
    padding: 14, marginBottom: 8,
  },
  sessionDate: { color: '#7F8AB7', fontSize: 14 },
  sessionDuration: { color: '#8A68FF', fontSize: 14, fontWeight: '600' },
});
