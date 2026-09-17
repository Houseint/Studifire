import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StatusBar, StyleSheet, ActivityIndicator, Linking, Modal, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { getMateriaById, atualizarMateria, registrarSessao, carregarSessoesPorMateria, registrarQuizAttempt, carregarQuizAttempts, getSubjectGoal, setSubjectGoal, getSubjectWeekMinutes } from '../services/subjectsDb';
import { useUserId } from '../hooks/useUserId';
import { formatarTempo, formatarCronometro } from '../shared/utils/formatTime';
import { toggleTopicoWithFsrs, aplicarResultadoQuiz } from '../shared/utils/fsrs';
import { gerarTopicosComplementares, gerarTopicosDeMaterial, gerarQuiz } from '../services/aiService';
import TopicCoachCard from '../components/TopicCoachCard';
import { QuizModal } from '../features/study';
import { useTheme } from '../shared/theme/ThemeContext';

export default function DetailScreen({ route, navigation }) {
  const { colors } = useTheme();
  const s = useMemo(() => getDetailStyles(colors), [colors]);
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
  // FASE 3 — seletor de origem do material (modal próprio: sempre fechável)
  const [matPickerVisible, setMatPickerVisible] = useState(false);
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
        const q = await carregarQuizAttempts(userId, id).catch(() => []);
        setQuizHistory(q);
        // Meta semanal da matéria (passo 3): meta + minutos desta semana.
        const [g, w] = await Promise.all([
          getSubjectGoal(userId, id).catch(() => null),
          getSubjectWeekMinutes(userId, id).catch(() => 0),
        ]);
        setMeta({ goal: g, week: w });
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
    // FASE 2.1 FSRS-lite: marcar feito agenda a próxima revisão (due_date no JSON).
    const novosTopicos = toggleTopicoWithFsrs(materia.topicos, index);
    await atualizarMateria(userId, id, { topicos: novosTopicos });
    setMateria({ ...materia, topicos: novosTopicos });
  };

  const startStudy = () => {
    if (timerMode === 'pomodoro') setPomodoroLeft(pomodoroDuration * 60);
    else setElapsedSeconds(0);
    setPaused(false);
    setStudying(true);
    quizOfertadoRef.current = false;
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
      // Meta da matéria anda junto com a sessão salva.
      getSubjectWeekMinutes(userId, id).then((w) => setMeta((prev) => ({ ...prev, week: w }))).catch(() => {});
      // Quiz automático pós-sessão: oferece 1x por sessão (sem auto-modal).
      if (!quizOfertadoRef.current && materia?.topicos?.length) {
        quizOfertadoRef.current = true;
        Alert.alert('Sessão salva! 🎉', 'Fazer um quiz rápido do tópico?', [
          { text: 'Agora não', style: 'cancel' },
          { text: 'Fazer quiz', onPress: iniciarQuiz },
        ]);
      }
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

  // Quiz pós-sessão (FASE 2.2): testa o tópico em foco e ajusta o FSRS.
  const [quizVisible, setQuizVisible] = useState(false);
  const [quizQuestoes, setQuizQuestoes] = useState([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizTopicIndex, setQuizTopicIndex] = useState(0);
  const [quizLocal, setQuizLocal] = useState(false);
  // Histórico de quizzes da matéria (últimos resultados).
  const [quizHistory, setQuizHistory] = useState([]);
  // Meta semanal da matéria (passo 3): goal em min/semana (null = sem meta).
  const [meta, setMeta] = useState({ goal: null, week: 0 });

  const editarMeta = () => {
    const opcoes = [30, 60, 120, 180, 300].map((m) => ({
      text: `${m} min/sem`,
      onPress: async () => {
        const g = await setSubjectGoal(userId, id, m).catch(() => null);
        if (g != null) setMeta((prev) => ({ ...prev, goal: g }));
      },
    }));
    Alert.alert('Meta semanal', 'Quanto estudar esta matéria por semana?', [
      ...opcoes,
      { text: 'Desligar', style: 'destructive', onPress: async () => { await setSubjectGoal(userId, id, 0).catch(() => {}); setMeta((prev) => ({ ...prev, goal: null })); } },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };
  // Quiz automático: garante 1 oferta por sessão (ref é síncrono — sem duplo Alert).
  const quizOfertadoRef = useRef(false);

  const iniciarQuiz = async () => {
    if (!materia || !materia.topicos?.length) {
      Alert.alert('Sem tópicos', 'Adicione tópicos à matéria para gerar o quiz.');
      return;
    }
    // Foco: primeiro tópico ainda não estudado, senão o primeiro.
    const pendente = materia.topicos.findIndex((t) => !t.estudado);
    const idx = pendente >= 0 ? pendente : 0;
    const foco = materia.topicos[idx];
    setQuizLoading(true);
    try {
      const { questoes, local } = await gerarQuiz(materia.nome, [foco.nome || foco.titulo || 'tópico']);
      if (!questoes || questoes.length === 0) {
        Alert.alert('Quiz indisponível', 'A IA não retornou perguntas. Tente de novo.');
        return;
      }
      setQuizTopicIndex(idx);
      setQuizQuestoes(questoes);
      setQuizLocal(!!local);
      setQuizVisible(true);
    } catch (e) {
      Alert.alert('Quiz indisponível', e?.message || 'Erro ao gerar quiz.');
    } finally {
      setQuizLoading(false);
    }
  };

  const finalizarQuiz = async ({ total, correct }) => {
    const idx = quizTopicIndex;
    const foco = materia?.topicos?.[idx];
    try {
      if (userId && id && foco) {
        await registrarQuizAttempt(userId, {
          subject_id: id,
          topic_index: idx,
          topic_nome: foco.nome || foco.titulo || 'tópico',
          questions_total: total,
          questions_correct: correct,
        });
        // Resultado alimenta o FSRS: erro endurece (revisa antes), acerto facilita.
        const { topicos: novosTopicos } = aplicarResultadoQuiz(materia.topicos, idx, { total, correct });
        await atualizarMateria(userId, id, { topicos: novosTopicos });
        setMateria({ ...materia, topicos: novosTopicos });
        const q = await carregarQuizAttempts(userId, id).catch(() => []);
        setQuizHistory(q);
      }
    } catch (e) {
      console.warn('Quiz: falha ao salvar resultado', e?.message || e);
    } finally {
      setQuizVisible(false);
    }
  };

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

  // FASE 3 — Material → tópicos: foto (câmera/galeria) ou arquivo → IA vision.
  // Reaproveita a mesma lista de sugestões/preview do "Expandir com IA".
  const processarMaterial = async (base64) => {
    if (!materia) return;
    setIaGenLoading(true);
    setIaGenError('');
    try {
      const res = await gerarTopicosDeMaterial(materia.nome, base64, materia.topicos, { maxTotal: 10 });
      if (res.reason === 'limite_atingido' || !res.topicos || res.topicos.length === 0) {
        setIaGenError(res.reason === 'limite_atingido' ? 'Limite de 10 tópicos atingido.' : 'IA não retornou sugestões novas.');
        setIaGenSugestoes([]);
        return;
      }
      setIaGenSugestoes(res.topicos);
      const sel = {};
      res.topicos.forEach((_, i) => (sel[i] = true));
      setIaGenSelected(sel);
    } catch (e) {
      setIaGenError(e?.message || 'Erro ao ler material');
    } finally {
      setIaGenLoading(false);
    }
  };

  const alertSemPermissao = (nome) => Alert.alert(
    `Permissão de ${nome} negada`,
    `Libere o acesso nas configurações do celular para importar o material.`,
    [{ text: 'Abrir ajustes', onPress: () => Linking.openSettings() }, { text: 'OK' }],
  );

  const importarViaCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync().catch(() => null);
    if (!perm?.granted) { alertSemPermissao('câmera'); return; }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.5, base64: true }).catch(() => null);
    if (!res || res.canceled || !res.assets?.[0]?.base64) return;
    await processarMaterial(res.assets[0].base64);
  };

  const importarViaGaleria = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync().catch(() => null);
    if (!perm?.granted) { alertSemPermissao('galeria'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.5, base64: true }).catch(() => null);
    if (!res || res.canceled || !res.assets?.[0]?.base64) return;
    await processarMaterial(res.assets[0].base64);
  };

  const importarViaArquivo = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'], copyToCacheDirectory: true }).catch(() => null);
    if (!res || res.canceled || !res.assets?.[0]) return;
    const file = res.assets[0];
    const nome = (file.name || '').toLowerCase();
    if (file.mimeType === 'application/pdf' || nome.endsWith('.pdf')) {
      Alert.alert(
        'PDF ainda não suportado',
        'O app ainda não lê PDF direto. Fotografe as páginas que eu extraio os tópicos.',
        [{ text: 'Fotografar agora', onPress: importarViaCamera }, { text: 'OK' }],
      );
      return;
    }
    try {
      const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: 'base64' });
      await processarMaterial(base64);
    } catch (e) {
      setIaGenError('Não consegui abrir esse arquivo.');
    }
  };

  const handleImportMaterial = () => {
    if (!materia || materia.topicos.length >= 10 || iaGenLoading) return;
    setMatPickerVisible(true);
  };

  const escolherOrigem = (fn) => {
    setMatPickerVisible(false);
    fn();
  };

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
        <StatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />
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
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />
      <LinearGradient colors={colors.bgGradient} style={s.gradient} />

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
                  <Text style={{ color: colors.accent, fontSize: 10, fontWeight: '800' }}>foco</Text>
                </View>
              )}
            </View>
            <Text style={s.timerDisplay}>
              {timerMode === 'pomodoro' ? formatarCronometro(pomodoroLeft) : formatarCronometro(elapsedSeconds)}
            </Text>
            {timerMode === 'pomodoro' && !paused && (
              <View style={{ width: '100%', height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden', marginBottom: 12 }}>
                <View style={{ width: `${((pomodoroDuration * 60 - pomodoroLeft) / (pomodoroDuration * 60)) * 100}%`, height: '100%', backgroundColor: colors.accent }} />
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
            <View style={{ flexDirection: 'row', backgroundColor: colors.card, borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 3, marginBottom: 10 }}>
              <TouchableOpacity onPress={() => setTimerMode('free')} activeOpacity={0.8} style={{ flex: 1, backgroundColor: timerMode === 'free' ? colors.accentStrong : 'transparent', borderRadius: 8, paddingVertical: 8, alignItems: 'center' }}>
                <Text style={{ color: timerMode === 'free' ? '#fff' : colors.textMuted, fontWeight: '700', fontSize: 12 }}>Livre</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setTimerMode('pomodoro')} activeOpacity={0.8} style={{ flex: 1, backgroundColor: timerMode === 'pomodoro' ? colors.accentStrong : 'transparent', borderRadius: 8, paddingVertical: 8, alignItems: 'center' }}>
                <Text style={{ color: timerMode === 'pomodoro' ? '#fff' : colors.textMuted, fontWeight: '700', fontSize: 12 }}>Pomodoro</Text>
              </TouchableOpacity>
            </View>
            {timerMode === 'pomodoro' && (
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                <TouchableOpacity onPress={() => setPomodoroDuration(25)} activeOpacity={0.7} style={{ flex: 1, backgroundColor: pomodoroDuration === 25 ? 'rgba(138,104,255,0.18)' : colors.card, borderWidth: 1, borderColor: pomodoroDuration === 25 ? colors.accentStrong : colors.border, borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}>
                  <Text style={{ color: pomodoroDuration === 25 ? colors.accent : colors.textSecondary, fontWeight: '800', fontSize: 13 }}>25 / 5</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 10 }}>Foco curto</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setPomodoroDuration(50)} activeOpacity={0.7} style={{ flex: 1, backgroundColor: pomodoroDuration === 50 ? 'rgba(138,104,255,0.18)' : colors.card, borderWidth: 1, borderColor: pomodoroDuration === 50 ? colors.accentStrong : colors.border, borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}>
                  <Text style={{ color: pomodoroDuration === 50 ? colors.accent : colors.textSecondary, fontWeight: '800', fontSize: 13 }}>50 / 10</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 10 }}>Bloco longo</Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity style={s.startButton} activeOpacity={0.8} onPress={startStudy}>
              <Text style={s.startButtonText}>{timerMode === 'pomodoro' ? `▶ Iniciar Pomodoro ${pomodoroDuration} min` : '▶ Iniciar Estudos'}</Text>
            </TouchableOpacity>
            {materia.topicos.length > 0 && (
              <TouchableOpacity
                onPress={iniciarQuiz}
                disabled={quizLoading}
                activeOpacity={0.8}
                style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.accentStrong, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 20, opacity: quizLoading ? 0.6 : 1 }}
              >
                {quizLoading
                  ? <ActivityIndicator color={colors.accent} size="small" />
                  : <Text style={{ color: colors.accent, fontWeight: '800', fontSize: 15 }}>🧠 Quiz rápido</Text>}
              </TouchableOpacity>
            )}
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
                  backgroundColor: expandedIdx === index ? colors.accentStrong : colors.card2, borderWidth: 1, borderColor: expandedIdx === index ? colors.accentStrong : colors.border,
                  marginLeft: 8,
                }}
              >
                <Text style={{ color: expandedIdx === index ? '#fff' : colors.accent, fontSize: 14, fontWeight: '700' }}>✦</Text>
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
              style={{ backgroundColor: materia.topicos.length >=1 ? colors.accent : colors.card2, borderWidth:1, borderColor: materia.topicos.length>=1 ? colors.accent : colors.borderStrong, borderRadius:12, paddingVertical:12, alignItems:'center', flexDirection:'row', justifyContent:'center', gap:8, opacity: materia.topicos.length>=1 ? 1 : 0.6 }}
            >
              {iaGenLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: materia.topicos.length>=1 ? '#fff' : colors.textMuted }}>✨</Text>}
              <Text style={{ color: materia.topicos.length>=1 ? '#fff' : colors.textMuted, fontWeight:'800', fontSize:14 }}>{iaGenLoading ? 'Gerando...' : 'Expandir com IA'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleImportMaterial}
              disabled={iaGenLoading}
              activeOpacity={0.8}
              style={{ backgroundColor:colors.card2, borderWidth:1, borderColor:colors.borderStrong, borderRadius:12, paddingVertical:12, alignItems:'center', flexDirection:'row', justifyContent:'center', gap:8, marginTop:8, opacity: iaGenLoading?0.5:1 }}
            >
              <Text style={{ color:colors.textSecondary }}>📷</Text>
              <Text style={{ color:colors.textSecondary, fontWeight:'800', fontSize:14 }}>{iaGenLoading ? 'Lendo material...' : 'Importar material (foto/PDF)'}</Text>
            </TouchableOpacity>
            {materia.topicos.length < 1 && <Text style={{ color:colors.textMuted, fontSize:11, marginTop:6 }}>Adicione 1 tópico para IA completar</Text>}
            {!!iaGenError && <Text style={{ color:colors.danger, fontSize:12, marginTop:6 }}>{iaGenError}</Text>}
          </View>
        )}
        {/* FASE 3 — seletor de origem: fecha no Cancelar, fora ou botão voltar */}
        <Modal visible={matPickerVisible} transparent animationType="fade" onRequestClose={() => setMatPickerVisible(false)}>
          <Pressable style={{ flex:1, backgroundColor:'rgba(0,0,0,0.6)', justifyContent:'flex-end' }} onPress={() => setMatPickerVisible(false)}>
            <Pressable style={{ backgroundColor:colors.card, borderTopLeftRadius:16, borderTopRightRadius:16, padding:16, borderWidth:1, borderColor:colors.border }} onPress={(e) => e.stopPropagation()}>
              <Text style={{ color:colors.text, fontWeight:'800', fontSize:16 }}>Importar material</Text>
              <Text style={{ color:colors.textMuted, fontSize:12, marginTop:2, marginBottom:12 }}>De onde vem o conteúdo?</Text>
              {[
                ['📷', 'Câmera', importarViaCamera],
                ['🖼️', 'Galeria', importarViaGaleria],
                ['📄', 'Arquivo (imagem/PDF)', importarViaArquivo],
              ].map(([emoji, label, fn]) => (
                <TouchableOpacity key={label} onPress={() => escolherOrigem(fn)} activeOpacity={0.7} style={{ flexDirection:'row', alignItems:'center', backgroundColor:colors.card2, borderWidth:1, borderColor:colors.borderStrong, borderRadius:12, paddingVertical:12, paddingHorizontal:14, marginBottom:8 }}>
                  <Text style={{ fontSize:18, marginRight:10 }}>{emoji}</Text>
                  <Text style={{ color:colors.text, fontWeight:'700', fontSize:14 }}>{label}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => setMatPickerVisible(false)} activeOpacity={0.7} style={{ backgroundColor:'transparent', borderWidth:1, borderColor:colors.danger, borderRadius:12, paddingVertical:12, alignItems:'center', marginTop:4 }}>
                <Text style={{ color:colors.danger, fontWeight:'800', fontSize:14 }}>Cancelar</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
        {iaGenSugestoes.length > 0 && (
          <View style={{ backgroundColor:colors.card, borderWidth:1, borderColor:colors.border, borderRadius:12, padding:12, marginBottom:16 }}>
            <Text style={{ color:colors.text, fontWeight:'700', marginBottom:8 }}>Sugestões da IA ({iaGenSugestoes.length})</Text>
            {iaGenSugestoes.map((t, idx) => (
              <TouchableOpacity key={idx} onPress={() => toggleIaSelect(idx)} activeOpacity={0.7} style={{ flexDirection:'row', alignItems:'center', paddingVertical:6 }}>
                <View style={{ width:22, height:22, borderRadius:6, borderWidth:2, borderColor: iaGenSelected[idx] ? colors.accentStrong : colors.borderStrong, backgroundColor: iaGenSelected[idx] ? colors.accentStrong : 'transparent', alignItems:'center', justifyContent:'center', marginRight:10 }}>
                  {iaGenSelected[idx] && <Text style={{ color:'#fff', fontSize:12, fontWeight:'700' }}>✓</Text>}
                </View>
                <Text style={{ color:colors.textSecondary, flex:1 }}>{t.nome}</Text>
              </TouchableOpacity>
            ))}
            <View style={{ flexDirection:'row', gap:8, marginTop:10 }}>
              <TouchableOpacity onPress={handleIaClear} style={{ flex:1, backgroundColor:colors.card2, borderRadius:10, paddingVertical:10, alignItems:'center', borderWidth:1, borderColor:colors.borderStrong }}>
                <Text style={{ color:colors.textSecondary, fontWeight:'700' }}>Limpar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleIaGenerate} disabled={iaGenLoading} style={{ flex:1, backgroundColor:colors.card2, borderRadius:10, paddingVertical:10, alignItems:'center', borderWidth:1, borderColor:colors.borderStrong, opacity: iaGenLoading?0.5:1 }}>
                <Text style={{ color:colors.textSecondary, fontWeight:'700' }}>Regenerar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleIaAddSelected} style={{ flex:2, backgroundColor:colors.accentStrong, borderRadius:10, paddingVertical:10, alignItems:'center' }}>
                <Text style={{ color:'#fff', fontWeight:'800' }}>Adicionar ({Object.values(iaGenSelected).filter(Boolean).length})</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ color:colors.textMuted, fontSize:11, marginTop:8 }}>Vagas: {10 - materia.topicos.length} • Total max 10</Text>
          </View>
        )}

                <Text style={s.sectionTitle}>META SEMANAL</Text>
        <TouchableOpacity style={s.sessionRow} activeOpacity={0.7} onPress={editarMeta}>
          <Text style={s.sessionDate}>
            {meta.goal ? `${meta.week}/${meta.goal} min` : 'Sem meta · toque para definir'}
          </Text>
          <Text style={s.sessionDuration}>
            {meta.goal ? `${Math.min(100, Math.round((meta.week / meta.goal) * 100))}%` : 'Definir'}
          </Text>
        </TouchableOpacity>

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

        {quizHistory.length > 0 && (
          <>
            <Text style={s.sectionTitle}>ÚLTIMOS QUIZZES</Text>
            {quizHistory.slice(0, 3).map((q) => (
              <View key={q.id} style={s.sessionRow}>
                <Text style={s.sessionDate}>
                  {q.topic_nome} · {new Date(q.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit', month: '2-digit',
                  })}
                </Text>
                <Text style={s.sessionDuration}>
                  {q.questions_correct}/{q.questions_total}
                </Text>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <QuizModal
        visible={quizVisible}
        questoes={quizQuestoes}
        local={quizLocal}
        onFinish={finalizarQuiz}
        onClose={() => setQuizVisible(false)}
      />
    </View>
  );
}

export function getDetailStyles(colors) {
  const isDark = colors.mode !== 'light';
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  gradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  loadingText: { color: colors.textMuted, fontSize: 16, textAlign: 'center', marginTop: 100 },
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
  headerTitle: { color: colors.text, fontSize: 20, fontWeight: '700', flex: 1 },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  progressCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16, borderWidth: 1, borderColor: colors.border,
    padding: 20, marginBottom: 16,
  },
  progressCircle: {
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 3, borderColor: colors.accent,
    alignItems: 'center', justifyContent: 'center', marginRight: 20,
  },
  progressCircleText: { color: colors.text, fontSize: 22, fontWeight: '700' },
  progressCircleLabel: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  progressInfo: { flex: 1 },
  progressInfoText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  progressInfoSub: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  sectionTitle: {
    color: colors.textMuted, fontSize: 14, fontWeight: '600', textTransform: 'uppercase',
    letterSpacing: 1, marginBottom: 12,
  },
  topicoRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12, padding: 14,
  },
  topicoRowDone: { backgroundColor: isDark ? 'rgba(111,82,255,0.08)' : 'rgba(111,82,255,0.10)' },
  checkbox: {
    width: 24, height: 24, borderRadius: 6,
    borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  checkboxChecked: { backgroundColor: colors.accentStrong, borderColor: colors.accentStrong },
  checkboxIcon: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  topicoLabel: { color: colors.text, fontSize: 15, flex: 1 },
  topicoLabelDone: { color: colors.textMuted, textDecorationLine: 'line-through' },

  startButton: {
    backgroundColor: colors.accentStrong, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginBottom: 20,
  },
  startButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  timerCard: {
    backgroundColor: isDark ? 'rgba(111,82,255,0.1)' : 'rgba(111,82,255,0.08)',
    borderRadius: 16, borderWidth: 1, borderColor: colors.accentStrong,
    padding: 20, alignItems: 'center', marginBottom: 16,
  },
  timerLabel: { color: colors.accent, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  timerDisplay: { color: colors.text, fontSize: 48, fontWeight: '200', fontVariant: ['tabular-nums'], marginVertical: 12 },
  timerRow: { flexDirection: 'row', gap: 12 },
  timerBtnPause: {
    backgroundColor: colors.card, borderRadius: 10, borderWidth: 1, borderColor: colors.border,
    paddingVertical: 10, paddingHorizontal: 24,
  },
  timerBtnPauseText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  timerBtnResume: {
    backgroundColor: colors.accentStrong, borderRadius: 10,
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
    backgroundColor: colors.card, borderRadius: 12,
    padding: 14, marginBottom: 8,
  },
  sessionDate: { color: colors.textMuted, fontSize: 14 },
  sessionDuration: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  });
}
