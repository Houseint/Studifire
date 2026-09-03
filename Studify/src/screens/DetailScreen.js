import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StatusBar, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getMateriaById, atualizarMateria, registrarSessao, carregarSessoesPorMateria } from '../services/subjectsDb';
import { useUserId } from '../hooks/useUserId';
import { formatarTempo, formatarCronometro } from '../shared/utils/formatTime';
import { gerarTopicosComplementares } from '../services/aiService';
import TopicCoachCard from '../components/TopicCoachCard';

export default function DetailScreen({ route, navigation }) {
  const userId = useUserId();
  const id = route?.params?.id;
  const [materia, setMateria] = useState(null);
  const [sessoes, setSessoes] = useState([]);
  const [studying, setStudying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef(null);
  // IA expand (C híbrido - Detail)
  const [iaGenLoading, setIaGenLoading] = useState(false);
  const [iaGenError, setIaGenError] = useState('');
  const [iaGenSugestoes, setIaGenSugestoes] = useState([]);
  const [iaGenSelected, setIaGenSelected] = useState({});
  // Coach per-topico
  const [expandedIdx, setExpandedIdx] = useState(null);
  // Timer revitalizado: Pomodoro
  const [timerMode, setTimerMode] = useState('free'); // free | pomodoro
  const [pomodoroDuration, setPomodoroDuration] = useState(25);
  const [pomodoroLeft, setPomodoroLeft] = useState(25 * 60);

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

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

  // Timer interval: free = count up, pomodoro = count down
  useEffect(() => {
    if (studying && !paused) {
      intervalRef.current = setInterval(() => {
        if (timerMode === 'pomodoro') {
          setPomodoroLeft((prev) => {
            if (prev <= 1) {
              clearTimer();
              // fim do bloco
              Alert.alert('Pomodoro concluído! 🎉', `Bloco de ${pomodoroDuration} min finalizado. Faça uma pausa de ${pomodoroDuration === 25 ? 5 : 10} min.`, [
                { text: 'Continuar livre', onPress: () => { setTimerMode('free'); setStudying(false); setPaused(false); } },
                { text: 'Descansar', style: 'default', onPress: async () => { await stopStudyInternal(prev); } },
              ]);
              return 0;
            }
            return prev - 1;
          });
        } else {
          setElapsedSeconds((prev) => prev + 1);
        }
      }, 1000);
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [studying, paused, timerMode, pomodoroDuration]);

  useEffect(() => {
    return () => clearTimer();
  }, []);

  // sincroniza pomodoroLeft quando muda duração e não está estudando
  useEffect(() => {
    if (!studying) setPomodoroLeft(pomodoroDuration * 60);
  }, [pomodoroDuration, studying]);

  const toggleTopico = async (index) => {
    if (!materia) return;
    const novosTopicos = materia.topicos.map((t, i) =>
      i === index ? { ...t, estudado: !t.estudado } : t
    );
    await atualizarMateria(userId, id, { topicos: novosTopicos });
    setMateria({ ...materia, topicos: novosTopicos });
  };

  const startStudy = () => {
    if (timerMode === 'pomodoro') setPomodoroLeft(pomodoroDuration * 60);
    else setElapsedSeconds(0);
    setPaused(false);
    setStudying(true);
  };

  // internal helper for pomodoro finish
  const stopStudyInternal = async (overrideLeft) => {
    clearTimer();
    let minutos = 0;
    if (timerMode === 'pomodoro') {
      const left = typeof overrideLeft === 'number' ? overrideLeft : pomodoroLeft;
      const elapsed = pomodoroDuration * 60 - left;
      minutos = Math.floor(elapsed / 60);
      // se terminou bloco completo, conta bloco inteiro
      if (left === 0) minutos = pomodoroDuration;
    } else {
      minutos = Math.floor(elapsedSeconds / 60);
    }
    if (minutos >= 1 && userId && id) {
      await registrarSessao(userId, id, minutos);
      const s = await carregarSessoesPorMateria(userId, id);
      setSessoes(s);
    } else if ((timerMode === 'free' ? elapsedSeconds : (pomodoroDuration * 60 - pomodoroLeft)) > 0) {
      // só alerta se não for fim de pomodoro já tratado
      if (!(timerMode === 'pomodoro' && pomodoroLeft === 0)) {
        Alert.alert('Tempo muito curto', 'A sessão precisa ter pelo menos 1 minuto para ser registrada.', [{ text: 'OK' }]);
      }
    }
    setStudying(false);
    setPaused(false);
    setElapsedSeconds(0);
    setPomodoroLeft(pomodoroDuration * 60);
  };

  const stopStudy = async () => stopStudyInternal();

  const pauseStudy = () => setPaused(true);
  const resumeStudy = () => setPaused(false);

  const handleIaGenerate = async () => {
    if (!materia || materia.topicos.length < 1 || materia.topicos.length >= 10) return;
    setIaGenLoading(true);
    setIaGenError('');
    try {
      const { topicos } = await gerarTopicosComplementares(materia.nome, materia.topicos, { maxTotal: 10 });
      if (!topicos || topicos.length === 0) {
        setIaGenError('IA não retornou sugestões novas.');
        setIaGenSugestoes([]);
        return;
      }
      setIaGenSugestoes(topicos);
      const sel = {};
      topicos.forEach((_, i) => (sel[i] = true));
      setIaGenSelected(sel);
    } catch (e) {
      setIaGenError(e?.message || 'Erro ao gerar');
    } finally {
      setIaGenLoading(false);
    }
  };
  const toggleIaSelect = (idx) => setIaGenSelected((p) => ({ ...p, [idx]: !p[idx] }));
  const handleIaAddSelected = async () => {
    const sel = iaGenSugestoes.filter((_, i) => iaGenSelected[i]);
    if (sel.length === 0) { Alert.alert('Nada selecionado', 'Marque pelo menos 1 sugestão.'); return; }
    const slots = 10 - materia.topicos.length;
    const paraAdd = sel.slice(0, slots);
    const novosTopicos = [...materia.topicos, ...paraAdd];
    await atualizarMateria(userId, id, { topicos: novosTopicos });
    setMateria({ ...materia, topicos: novosTopicos });
    setIaGenSugestoes([]); setIaGenSelected({}); setIaGenError('');
  };
  const handleIaClear = () => { setIaGenSugestoes([]); setIaGenSelected({}); setIaGenError(''); };

  const handleBack = () => {
    if (studying) {
      Alert.alert(
        'Estudo em andamento',
        'Você tem uma sessão ativa. Deseja salvar o tempo parcial antes de sair?',
        [
          { text: 'Sair sem salvar', style: 'destructive', onPress: () => { clearTimer(); navigation.goBack(); } },
          { text: 'Salvar e sair', onPress: async () => { await stopStudy(); navigation.goBack(); } },
        ]
      );
    } else {
      clearTimer();
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
  const outrosTopicosNomes = materia.topicos.map((t) => t.nome);

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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Text style={s.timerLabel}>{paused ? 'Pausado' : timerMode === 'pomodoro' ? `Pomodoro ${pomodoroDuration}:00` : 'Estudando'}</Text>
              {timerMode === 'pomodoro' && (
                <View style={{ backgroundColor: 'rgba(138,104,255,0.18)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                  <Text style={{ color: '#8A68FF', fontSize: 10, fontWeight: '800' }}>foco</Text>
                </View>
              )}
            </View>
            <Text style={s.timerDisplay}>
              {timerMode === 'pomodoro' ? formatarCronometro(pomodoroLeft) : formatarCronometro(elapsedSeconds)}
            </Text>
            {timerMode === 'pomodoro' && !paused && (
              <View style={{ width: '100%', height: 4, backgroundColor: '#1F2A4A', borderRadius: 2, overflow: 'hidden', marginBottom: 12 }}>
                <View style={{ width: `${((pomodoroDuration * 60 - pomodoroLeft) / (pomodoroDuration * 60)) * 100}%`, height: '100%', backgroundColor: '#8A68FF' }} />
              </View>
            )}
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
          <>
            <View style={{ flexDirection: 'row', backgroundColor: '#111832', borderRadius: 10, borderWidth: 1, borderColor: '#27315B', padding: 3, marginBottom: 10 }}>
              <TouchableOpacity onPress={() => setTimerMode('free')} activeOpacity={0.8} style={{ flex: 1, backgroundColor: timerMode === 'free' ? '#6F52FF' : 'transparent', borderRadius: 8, paddingVertical: 8, alignItems: 'center' }}>
                <Text style={{ color: timerMode === 'free' ? '#fff' : '#7F8AB7', fontWeight: '700', fontSize: 12 }}>Livre</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setTimerMode('pomodoro')} activeOpacity={0.8} style={{ flex: 1, backgroundColor: timerMode === 'pomodoro' ? '#6F52FF' : 'transparent', borderRadius: 8, paddingVertical: 8, alignItems: 'center' }}>
                <Text style={{ color: timerMode === 'pomodoro' ? '#fff' : '#7F8AB7', fontWeight: '700', fontSize: 12 }}>Pomodoro</Text>
              </TouchableOpacity>
            </View>
            {timerMode === 'pomodoro' && (
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                <TouchableOpacity onPress={() => setPomodoroDuration(25)} activeOpacity={0.7} style={{ flex: 1, backgroundColor: pomodoroDuration === 25 ? 'rgba(138,104,255,0.18)' : '#111832', borderWidth: 1, borderColor: pomodoroDuration === 25 ? '#6F52FF' : '#27315B', borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}>
                  <Text style={{ color: pomodoroDuration === 25 ? '#8A68FF' : '#AAB6D9', fontWeight: '800', fontSize: 13 }}>25 / 5</Text>
                  <Text style={{ color: '#5E6994', fontSize: 10 }}>Foco curto</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setPomodoroDuration(50)} activeOpacity={0.7} style={{ flex: 1, backgroundColor: pomodoroDuration === 50 ? 'rgba(138,104,255,0.18)' : '#111832', borderWidth: 1, borderColor: pomodoroDuration === 50 ? '#6F52FF' : '#27315B', borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}>
                  <Text style={{ color: pomodoroDuration === 50 ? '#8A68FF' : '#AAB6D9', fontWeight: '800', fontSize: 13 }}>50 / 10</Text>
                  <Text style={{ color: '#5E6994', fontSize: 10 }}>Bloco longo</Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity style={s.startButton} activeOpacity={0.8} onPress={startStudy}>
              <Text style={s.startButtonText}>{timerMode === 'pomodoro' ? `▶ Iniciar Pomodoro ${pomodoroDuration} min` : '▶ Iniciar Estudos'}</Text>
            </TouchableOpacity>
          </>
        )}

        <Text style={s.sectionTitle}>Tópicos</Text>
        {materia.topicos.map((topico, index) => (
          <View key={index} style={{ marginBottom: 8 }}>
            <View style={[s.topicoRow, topico.estudado && s.topicoRowDone]}>
              <TouchableOpacity
                style={[s.checkbox, topico.estudado && s.checkboxChecked]}
                activeOpacity={0.7}
                onPress={() => toggleTopico(index)}
              >
                {topico.estudado && <Text style={s.checkboxIcon}>✓</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.7} onPress={() => toggleTopico(index)}>
                <Text style={[s.topicoLabel, topico.estudado && s.topicoLabelDone]}>
                  {topico.nome}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setExpandedIdx(expandedIdx === index ? null : index)}
                activeOpacity={0.7}
                style={{
                  width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: expandedIdx === index ? '#6F52FF' : '#1B2545', borderWidth: 1, borderColor: expandedIdx === index ? '#6F52FF' : '#27315B',
                  marginLeft: 8,
                }}
              >
                <Text style={{ color: expandedIdx === index ? '#fff' : '#8A68FF', fontSize: 14, fontWeight: '700' }}>✦</Text>
              </TouchableOpacity>
            </View>
            {expandedIdx === index && (
              <TopicCoachCard
                userId={userId}
                subjectId={id}
                materiaNome={materia.nome}
                topicoNome={topico.nome}
                outrosTopicos={outrosTopicosNomes}
                expanded={expandedIdx === index}
                onToggle={() => setExpandedIdx(null)}
                onUseMetodo={(duracao) => {
                  setPomodoroDuration(duracao === 50 ? 50 : 25);
                  setTimerMode('pomodoro');
                  setExpandedIdx(null);
                }}
              />
            )}
          </View>
        ))}

        {/* IA Expandir - C híbrido */}
        {materia.topicos.length < 10 && (
          <View style={{ marginBottom: 16 }}>
            <TouchableOpacity
              onPress={handleIaGenerate}
              disabled={materia.topicos.length < 1 || iaGenLoading}
              activeOpacity={0.8}
              style={{ backgroundColor: materia.topicos.length >=1 ? '#8A68FF' : '#1B2545', borderWidth:1, borderColor: materia.topicos.length>=1 ? '#8A68FF' : '#303E70', borderRadius:12, paddingVertical:12, alignItems:'center', flexDirection:'row', justifyContent:'center', gap:8, opacity: materia.topicos.length>=1 ? 1 : 0.6 }}
            >
              {iaGenLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: materia.topicos.length>=1 ? '#fff' : '#5a6a7a' }}>✨</Text>}
              <Text style={{ color: materia.topicos.length>=1 ? '#fff' : '#5a6a7a', fontWeight:'800', fontSize:14 }}>{iaGenLoading ? 'Gerando...' : 'Expandir com IA'}</Text>
            </TouchableOpacity>
            {materia.topicos.length < 1 && <Text style={{ color:'#7F8AB7', fontSize:11, marginTop:6 }}>Adicione 1 tópico para IA completar</Text>}
            {!!iaGenError && <Text style={{ color:'#EF4444', fontSize:12, marginTop:6 }}>{iaGenError}</Text>}
          </View>
        )}
        {iaGenSugestoes.length > 0 && (
          <View style={{ backgroundColor:'#111832', borderWidth:1, borderColor:'#27315B', borderRadius:12, padding:12, marginBottom:16 }}>
            <Text style={{ color:'#F4F6FF', fontWeight:'700', marginBottom:8 }}>Sugestões da IA ({iaGenSugestoes.length})</Text>
            {iaGenSugestoes.map((t, idx) => (
              <TouchableOpacity key={idx} onPress={() => toggleIaSelect(idx)} activeOpacity={0.7} style={{ flexDirection:'row', alignItems:'center', paddingVertical:6 }}>
                <View style={{ width:22, height:22, borderRadius:6, borderWidth:2, borderColor: iaGenSelected[idx] ? '#6F52FF' : '#303E70', backgroundColor: iaGenSelected[idx] ? '#6F52FF' : 'transparent', alignItems:'center', justifyContent:'center', marginRight:10 }}>
                  {iaGenSelected[idx] && <Text style={{ color:'#fff', fontSize:12, fontWeight:'700' }}>✓</Text>}
                </View>
                <Text style={{ color:'#C0CAE8', flex:1 }}>{t.nome}</Text>
              </TouchableOpacity>
            ))}
            <View style={{ flexDirection:'row', gap:8, marginTop:10 }}>
              <TouchableOpacity onPress={handleIaClear} style={{ flex:1, backgroundColor:'#1B2545', borderRadius:10, paddingVertical:10, alignItems:'center', borderWidth:1, borderColor:'#303E70' }}>
                <Text style={{ color:'#AAB6D9', fontWeight:'700' }}>Limpar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleIaGenerate} disabled={iaGenLoading} style={{ flex:1, backgroundColor:'#1B2545', borderRadius:10, paddingVertical:10, alignItems:'center', borderWidth:1, borderColor:'#303E70', opacity: iaGenLoading?0.5:1 }}>
                <Text style={{ color:'#AAB6D9', fontWeight:'700' }}>Regenerar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleIaAddSelected} style={{ flex:2, backgroundColor:'#6F52FF', borderRadius:10, paddingVertical:10, alignItems:'center' }}>
                <Text style={{ color:'#fff', fontWeight:'800' }}>Adicionar ({Object.values(iaGenSelected).filter(Boolean).length})</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ color:'#5E6994', fontSize:11, marginTop:8 }}>Vagas: {10 - materia.topicos.length} • Total max 10</Text>
          </View>
        )}

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
    padding: 20, marginBottom: 16,
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
    borderRadius: 12, padding: 14,
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
    paddingVertical: 16, alignItems: 'center', marginBottom: 20,
  },
  startButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  timerCard: {
    backgroundColor: 'rgba(111,82,255,0.1)',
    borderRadius: 16, borderWidth: 1, borderColor: '#6F52FF',
    padding: 20, alignItems: 'center', marginBottom: 16,
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
