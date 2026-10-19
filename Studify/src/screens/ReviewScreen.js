import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../shared/theme/ThemeContext';
import { useUserId } from '../hooks/useUserId';
import { useThemedAlert } from '../hooks/useThemedAlert';
import ThemedAlert from '../components/common/ThemedAlert';
import {
  carregarMaterias,
  atualizarMateria,
  registrarQuizAttempt,
} from '../services/subjectsDb';
import { getDueTopics, aplicarResultadoQuiz, formatDueDate } from '../shared/utils/fsrs';
import { gerarQuiz } from '../services/aiService';
import { QuizModal } from '../features/study';
import { ArrowLeftIcon, ClockIcon, SproutIcon, CheckIcon } from '../components/progress/ProgressIcons';

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const DIFFICULTY_LABEL = ['', 'Fácil', 'Média', 'Difícil', 'Muito difícil'];

export default function ReviewScreen({ route, navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getReviewStyles(colors), [colors]);
  const userId = useUserId();
  const { alertConfig, showAlert, hideAlert } = useThemedAlert();
  const materiaFiltro = route?.params?.materiaId;

  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quizVisible, setQuizVisible] = useState(false);
  const [quizQuestoes, setQuizQuestoes] = useState([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [ativo, setAtivo] = useState(null);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return undefined;
      let mounted = true;
      (async () => {
        try {
          const m = await carregarMaterias(userId);
          if (mounted) setMaterias(m || []);
        } catch (e) {
          console.error('Erro ao carregar revisões:', e);
        } finally {
          if (mounted) setLoading(false);
        }
      })();
      return () => { mounted = false; };
    }, [userId])
  );

  const todasVencidas = useMemo(() => getDueTopics(materias), [materias]);
  const vencidas = useMemo(
    () => (materiaFiltro ? todasVencidas.filter((d) => d.materiaId === materiaFiltro) : todasVencidas),
    [todasVencidas, materiaFiltro]
  );

  const proxima = useMemo(() => {
    const hoje = startOfDay(new Date());
    let melhor = null;
    (materias || []).forEach((m) => {
      (m?.topicos || []).forEach((t, idx) => {
        if (!t?.due_date) return;
        const dia = startOfDay(t.due_date);
        if (dia <= hoje) return;
        if (!melhor || dia < melhor.dia) {
          melhor = {
            dia,
            materiaNome: m.nome,
            topicoNome: t.nome || t.titulo || 'tópico',
            topicoIndex: idx,
            due_date: t.due_date,
          };
        }
      });
    });
    return melhor;
  }, [materias]);

  const iniciarRevisao = async (item) => {
    if (!item) return;
    setAtivo(item);
    setQuizLoading(true);
    try {
      const { questoes } = await gerarQuiz(item.materiaNome, [item.topicoNome], { qtd: 3 });
      if (!questoes || questoes.length === 0) {
        showAlert({ title: 'Quiz indisponível', message: 'A IA não retornou perguntas. Tente novamente.', buttons: [{ text: 'OK', style: 'cancel' }] });
        setAtivo(null);
        return;
      }
      setQuizQuestoes(questoes);
      setQuizVisible(true);
    } catch (e) {
      showAlert({ title: 'Quiz indisponível', message: e?.message || 'Erro ao gerar o quiz de revisão.', buttons: [{ text: 'OK', style: 'cancel' }] });
      setAtivo(null);
    } finally {
      setQuizLoading(false);
    }
  };

  const finalizarRevisao = async ({ total, correct }) => {
    const item = ativo;
    setQuizVisible(false);
    if (!item || !userId) return;
    try {
      await registrarQuizAttempt(userId, {
        subject_id: item.materiaId,
        topic_index: item.topicoIndex,
        topic_nome: item.topicoNome,
        questions_total: total,
        questions_correct: correct,
      });
      const materia = materias.find((m) => m.id === item.materiaId);
      if (materia) {
        const { topicos } = aplicarResultadoQuiz(materia.topicos, item.topicoIndex, { total, correct });
        await atualizarMateria(userId, item.materiaId, { topicos });
        const atualizados = await carregarMaterias(userId);
        setMaterias(atualizados || []);
        const novo = topicos[item.topicoIndex];
        showAlert({ title: 'Revisão registrada ✅', message: `${correct}/${total} acertos.\nPróxima revisão em ${formatDueDate(novo?.due_date)}.`, buttons: [{ text: 'OK', style: 'cancel' }] });
      }
    } catch (e) {
      showAlert({ title: 'Erro ao salvar revisão', message: e?.message || 'Tente novamente.', buttons: [{ text: 'OK', style: 'cancel' }] });
    } finally {
      setAtivo(null);
    }
  };

  const fecharQuiz = () => {
    setQuizVisible(false);
    setAtivo(null);
  };

  const diasAte = proxima
    ? Math.max(1, Math.round((proxima.dia - startOfDay(new Date())) / 86400000))
    : null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation?.goBack?.()}
            accessibilityLabel="Voltar"
            accessibilityRole="button"
          >
            <ArrowLeftIcon size={20} color={colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.headerTexts}>
            <Text style={styles.headerTitle}>Revisão</Text>
            <Text style={styles.headerSubtitle}>Repita na hora certa, não na hora errada</Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <ClockIcon size={22} color={colors.accent} />
          </View>
          <View style={styles.heroBody}>
            <Text style={styles.heroLabel}>PARA REVISAR HOJE</Text>
            <Text style={styles.heroValue}>{vencidas.length}</Text>
            <Text style={styles.heroText}>
              {vencidas.length > 0
                ? `${vencidas.length === 1 ? 'tópico vencido' : 'tópicos vencidos'} — o cérebro já começou a esquecer.`
                : 'Nada vencido. O app só chama você quando o tópico precisa ser lembrado.'}
            </Text>
          </View>
        </View>

        <Text style={styles.explainer}>
          A revisão espaçada marca cada tópico para 1, 3, 7 ou 14 dias depois. Estudar de novo
          no mesmo dia não conta como revisão — é por isso que nada aparece aqui logo após a sessão.
        </Text>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.loadingText}>Carregando revisões…</Text>
          </View>
        ) : vencidas.length === 0 ? (
          <View style={styles.emptyCard}>
            <SproutIcon size={48} color={colors.textFaint} />
            <Text style={styles.emptyTitle}>Nada vencido por aqui</Text>
            <Text style={styles.emptyText}>
              {proxima
                ? `Próxima revisão: ${proxima.topicoNome} (${proxima.materiaNome}) em ${diasAte} ${diasAte === 1 ? 'dia' : 'dias'} — ${formatDueDate(proxima.due_date)}.`
                : 'Conclua tópicos estudando com o timer. A primeira revisão é agendada automaticamente.'}
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation?.navigate('Home')}
              accessibilityRole="button"
            >
              <Text style={styles.emptyButtonText}>Ir para o Início</Text>
            </TouchableOpacity>
          </View>
        ) : (
          vencidas.map((item) => (
            <View key={`${item.materiaId}-${item.topicoIndex}`} style={styles.reviewCard}>
              <View style={styles.reviewTop}>
                <View style={styles.reviewBadge}>
                  <Text style={styles.reviewBadgeText}>{item.materiaNome}</Text>
                </View>
                <Text style={styles.reviewDue}>Venceu em {formatDueDate(item.due_date)}</Text>
              </View>
              <Text style={styles.reviewTopic}>{item.topicoNome}</Text>
              <Text style={styles.reviewMeta}>
                Dificuldade: {DIFFICULTY_LABEL[item.difficulty] || 'Média'}
              </Text>
              <TouchableOpacity
                style={[styles.reviewButton, quizLoading && styles.reviewButtonDisabled]}
                onPress={() => iniciarRevisao(item)}
                disabled={quizLoading}
                accessibilityRole="button"
              >
                <CheckIcon size={16} color={colors.bg} />
                <Text style={styles.reviewButtonText}>
                  {quizLoading && ativo?.topicoIndex === item.topicoIndex ? 'Gerando quiz…' : 'Revisar agora'}
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <QuizModal
        visible={quizVisible}
        questoes={quizQuestoes}
        onFinish={finalizarRevisao}
        onClose={fecharQuiz}
      />
      <ThemedAlert config={alertConfig} onClose={hideAlert} />
    </View>
  );
}

export function getReviewStyles(colors) {
  const light = colors.mode === 'light';
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    scrollContent: { paddingHorizontal: 16, paddingTop: 50, paddingBottom: 100 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTexts: { marginLeft: 14, flex: 1 },
    headerTitle: { color: colors.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
    headerSubtitle: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
    heroCard: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 12,
    },
    heroIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: light ? 'rgba(138,104,255,0.12)' : 'rgba(138,104,255,0.18)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    heroBody: { flex: 1 },
    heroLabel: {
      color: colors.textMuted,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1,
    },
    heroValue: { color: colors.text, fontSize: 34, fontWeight: '900', lineHeight: 38 },
    heroText: { color: colors.textSecondary, fontSize: 12, lineHeight: 17 },
    explainer: {
      color: colors.textMuted,
      fontSize: 12,
      lineHeight: 18,
      marginBottom: 16,
      paddingHorizontal: 4,
    },
    loadingBox: { alignItems: 'center', paddingVertical: 40 },
    loadingText: { color: colors.textMuted, marginTop: 10, fontSize: 13 },
    emptyCard: {
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 24,
    },
    emptyTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginTop: 12 },
    emptyText: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 20,
      textAlign: 'center',
      marginTop: 6,
    },
    emptyButton: {
      marginTop: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      paddingHorizontal: 18,
      paddingVertical: 10,
    },
    emptyButtonText: { color: colors.accent, fontWeight: '700', fontSize: 13 },
    reviewCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginBottom: 12,
    },
    reviewTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    reviewBadge: {
      backgroundColor: light ? 'rgba(138,104,255,0.10)' : 'rgba(138,104,255,0.16)',
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
      maxWidth: '62%',
    },
    reviewBadgeText: { color: colors.accent, fontSize: 11, fontWeight: '700' },
    reviewDue: { color: colors.warn, fontSize: 11, fontWeight: '700' },
    reviewTopic: { color: colors.text, fontSize: 17, fontWeight: '800', marginTop: 10 },
    reviewMeta: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
    reviewButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 12,
      paddingVertical: 11,
      borderRadius: 12,
      backgroundColor: colors.accent,
    },
    reviewButtonDisabled: { opacity: 0.6 },
    reviewButtonText: { color: colors.bg, fontSize: 13, fontWeight: '800' },
  });
}
