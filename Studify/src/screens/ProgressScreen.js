import React, { useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getProgressScreenStyles } from '../styles/screens/ProgressScreenStyles.js';
import { useTheme } from '../shared/theme/ThemeContext';
import { useUserId } from '../hooks/useUserId';
import { carregarMaterias, carregarHistorico } from '../services/subjectsDb';
import { getDueTopics } from '../shared/utils/fsrs';
import SectionHeader from '../components/progress/SectionHeader';
import EmptyState from '../components/progress/EmptyState';
import StatCard from '../components/progress/StatCard';
import ProgressRing from '../components/progress/ProgressRing';
import StreakCard from '../components/progress/StreakCard';
import WeeklyChart from '../components/progress/WeeklyChart';
import SubjectCard from '../components/progress/SubjectCard';
import {
  BookOpenIcon,
  CheckIcon,
  ClockIcon,
  TrophyIcon,
  SproutIcon,
  PencilIcon,
  ArrowLeftIcon,
} from '../components/progress/ProgressIcons';

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function ProgressScreen({ navigation }) {
  const { colors } = useTheme();
  const s = useMemo(() => getProgressScreenStyles(colors), [colors]);
  const userId = useUserId();
  const [materias, setMaterias] = useState([]);
  const [sessoes, setSessoes] = useState([]);
  const [stats, setStats] = useState({
    totalMaterias: 0,
    totalTopicos: 0,
    topicosConcluidos: 0,
    totalHoras: 0,
    diasAtivos: 0,
    sequencia: 0,
  });

  // Carregar dados quando a tela ganha foco
  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      let mounted = true;

      (async () => {
        try {
          const [m, s] = await Promise.all([
            carregarMaterias(userId),
            carregarHistorico(userId),
          ]);
          if (!mounted) return;

          setMaterias(m);
          setSessoes(s);
          calcularStats(m, s);
        } catch (e) {
          console.error('Erro ao carregar progresso:', e);
        }
      })();

      return () => { mounted = false; };
    }, [userId])
  );

  const calcularStats = (materias, sessoes) => {
    let totalTopicos = 0;
    let topicosConcluidos = 0;

    materias.forEach((m) => {
      if (m.topicos && Array.isArray(m.topicos)) {
        totalTopicos += m.topicos.length;
        topicosConcluidos += m.topicos.filter((t) => t.estudado).length;
      }
    });

    const totalMinutos = sessoes.reduce((acc, sessao) => acc + (sessao.duration_minutes || 0), 0);
    const totalHoras = Math.round(totalMinutos / 60 * 10) / 10;

    const datasUnicas = new Set(
      sessoes.map((s) => new Date(s.started_at).toDateString())
    );
    const diasAtivos = datasUnicas.size;

    // Calcular sequência (streak)
    const datasOrdenadas = [...datasUnicas]
      .map((d) => new Date(d))
      .sort((a, b) => b - a);

    let sequencia = 0;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    for (let i = 0; i < datasOrdenadas.length; i++) {
      const esperado = new Date(hoje);
      esperado.setDate(esperado.getDate() - i);
      if (datasOrdenadas[i].toDateString() === esperado.toDateString()) {
        sequencia++;
      } else {
        break;
      }
    }

    setStats({
      totalMaterias: materias.length,
      totalTopicos,
      topicosConcluidos,
      totalHoras,
      diasAtivos,
      sequencia,
    });
  };

  // Separar matérias em andamento e concluídas
  const materiasEmAndamento = materias.filter((m) => {
    if (!m.topicos || !m.topicos.length) return false;
    const concluidas = m.topicos.filter((t) => t.estudado).length;
    return concluidas > 0 && concluidas < m.topicos.length;
  });

  const materiasConcluidas = materias.filter((m) => {
    if (!m.topicos || !m.topicos.length) return false;
    const concluidas = m.topicos.filter((t) => t.estudado).length;
    return concluidas === m.topicos.length && concluidas > 0;
  });

  const materiasNaoIniciadas = materias.filter((m) => {
    if (!m.topicos || !m.topicos.length) return true;
    return m.topicos.every((t) => !t.estudado);
  });

  // Dados para o gráfico semanal (últimos 7 dias)
  const getDadosGraficoSemanal = () => {
    const dados = [];
    const agora = new Date();
    const inicioSemana = new Date(agora);
    inicioSemana.setDate(agora.getDate() - 6);
    inicioSemana.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const data = new Date(inicioSemana);
      data.setDate(inicioSemana.getDate() + i);
      const dataStr = data.toDateString();

      const sessoesDia = sessoes.filter((s) => new Date(s.started_at).toDateString() === dataStr);
      const minutos = sessoesDia.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);

      // Matérias estudadas nesse dia (sem repetir)
      const nomesDia = [
        ...new Set(
          sessoesDia
            .map((s) => materias.find((m) => m.id === s.subject_id)?.nome)
            .filter(Boolean)
        ),
      ];

      dados.push({
        dia: DIAS_SEMANA[data.getDay()],
        minutos,
        horas: Math.round(minutos / 60 * 10) / 10,
        isHoje: data.toDateString() === agora.toDateString(),
        materias: nomesDia,
      });
    }
    return dados;
  };

  const dadosGrafico = getDadosGraficoSemanal();
  const maxMinutos = Math.max(...dadosGrafico.map((d) => d.minutos), 1);

  const formatarTempo = (minutos) => {
    if (minutos < 60) return `${minutos}min`;
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return m > 0 ? `${h}h${m}min` : `${h}h`;
  };

  const getProgressoMateria = (materia) => {
    if (!materia.topicos || !materia.topicos.length) return 0;
    const concluidas = materia.topicos.filter((t) => t.estudado).length;
    return Math.round((concluidas / materia.topicos.length) * 100);
  };

  const handleContinuarEstudo = (materia) => {
    // DetailScreen lê route.params.id — sem o id ela faz goBack() e volta pra Home.
    navigation.navigate('Detail', { id: materia.id });
  };

  const handleRevisar = (materia) => {
    navigation.navigate('Review', { materiaId: materia.id });
  };

  const dueHoje = useMemo(() => getDueTopics(materias).length, [materias]);

  if (!userId) {
    return (
      <View style={s.container}>
        <StatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />
        <LinearGradient colors={colors.bgGradient} style={s.gradient} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.textMuted, fontSize: 16 }}>Carregando...</Text>
        </View>
      </View>
    );
  }

  const isDark = colors.mode !== 'light';
  const rawHeaderDate = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  const headerDate = rawHeaderDate.charAt(0).toUpperCase() + rawHeaderDate.slice(1);
  const heroGradient = isDark
    ? ['#1A1B4B', colors.card, '#10142F']
    : ['#FFFFFF', colors.cardAlt, '#E9EDF7'];

  return (
    <View style={s.container}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />
      <LinearGradient colors={colors.bgGradient} style={s.gradient} />
      <View pointerEvents="none" style={[s.glowTop, { backgroundColor: colors.primary }]} />
      <View pointerEvents="none" style={[s.glowAmber, { backgroundColor: colors.amber }]} />

      <ScrollView
        style={s.scrollView}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header: voltar + Perfil (sem refresh do mockup) */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <TouchableOpacity
              style={s.backButtonLarge}
              activeOpacity={0.7}
              onPress={() => navigation.goBack()}
              accessibilityLabel="Voltar"
              accessibilityRole="button"
            >
              <ArrowLeftIcon size={20} color={colors.textMuted} />
            </TouchableOpacity>
            <View>
              <Text style={s.headerTitle}>Progresso</Text>
              <Text style={s.headerDate}>{headerDate}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={s.profileButtonLarge}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Profile')}
            accessibilityLabel="Perfil"
            accessibilityRole="button"
          >
            <Text style={s.profileButtonText}>◌</Text>
          </TouchableOpacity>
        </View>

        {/* Hero: anel + jornada */}
        <LinearGradient colors={heroGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.heroCard}>
          <View style={s.heroRow}>
            <ProgressRing concluidos={stats.topicosConcluidos} total={stats.totalTopicos} />
            <View style={s.heroRight}>
              <Text style={s.heroEyebrow}>SUA JORNADA</Text>
              <Text style={s.heroPhrase}>Cada tópico conta — continue no ritmo!</Text>
              <Text style={s.heroCount}>{stats.topicosConcluidos} de {stats.totalTopicos} tópicos concluídos</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Stat Cards */}
        <View style={s.statsRow}>
          <StatCard
            icon={<BookOpenIcon size={20} color={colors.primary} />}
            value={stats.totalMaterias}
            label="Matérias"
            tint={colors.primary}
          />
          <StatCard
            icon={<CheckIcon size={20} color={colors.success} />}
            value={stats.topicosConcluidos}
            suffix={`/${stats.totalTopicos}`}
            label="Tópicos"
            tint={colors.success}
          />
          <StatCard
            icon={<ClockIcon size={20} color={colors.info} />}
            value={stats.totalHoras > 0 ? stats.totalHoras + 'h' : '0h'}
            label="Horas"
            tint={colors.info}
          />
        </View>

        {/* Streak */}
        <View style={{ marginHorizontal: 16 }}>
          <StreakCard sequencia={stats.sequencia} sessoes={sessoes} />
        </View>

        {/* Weekly Chart */}
        <View style={s.chartSection}>
          <SectionHeader
            icon={<ClockIcon size={18} color={colors.primary} />}
            title="Evolução Semanal"
            countText="Últimos 7 dias"
            tint={colors.primary}
          />
          <WeeklyChart dados={dadosGrafico} maxMinutos={maxMinutos} formatarTempo={formatarTempo} />
        </View>

        {/* Revisão espaçada */}
        <View style={s.reviewSection}>
          <View style={s.reviewCard}>
            <View style={s.reviewIcon}>
              <ClockIcon size={22} color={colors.warn} />
            </View>
            <View style={s.reviewBody}>
              <Text style={s.reviewTitle}>Revisões para hoje</Text>
              <Text style={s.reviewText}>
                {dueHoje > 0
                  ? `${dueHoje} ${dueHoje === 1 ? 'tópico vencido' : 'tópicos vencidos'} — revise antes de esquecer.`
                  : 'Nada vencido. O app só sugere revisão quando o tópico vence.'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={s.reviewButton}
            onPress={() => navigation.navigate('Review')}
            accessibilityRole="button"
          >
            <Text style={s.reviewButtonText}>
              {dueHoje > 0 ? `Abrir revisão (${dueHoje})` : 'Ver próxima revisão'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Em Andamento */}
        <View style={s.subjectSection}>
          <SectionHeader
            icon={<BookOpenIcon size={18} color={colors.primary} />}
            title="Em Andamento"
            countText={`${materiasEmAndamento.length} ${materiasEmAndamento.length === 1 ? 'matéria' : 'matérias'}`}
            tint={colors.primary}
          />

          {materiasEmAndamento.length === 0 ? (
            <EmptyState
              icon={<SproutIcon size={52} color={colors.textFaint} />}
              title="Nenhuma matéria em andamento"
              description="Comece a estudar uma matéria para ver seu progresso aqui!"
            />
          ) : (
            materiasEmAndamento.map((materia) => {
              const progresso = getProgressoMateria(materia);
              const concluidas = materia.topicos.filter((t) => t.estudado).length;
              const total = materia.topicos.length;
              const onPress = () => handleContinuarEstudo(materia);

              return (
                <TouchableOpacity key={materia.id} activeOpacity={0.9} onPress={onPress} accessibilityRole="button">
                  <SubjectCard
                    nome={materia.nome}
                    progresso={progresso}
                    metaTexto={`${concluidas} de ${total} tópicos concluídos`}
                    botaoTexto="Continuar estudando"
                    onPress={onPress}
                    icon={<BookOpenIcon size={24} color={colors.primary} />}
                  />
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Concluídas */}
        <View style={s.subjectSection}>
          <SectionHeader
            icon={<TrophyIcon size={18} color={colors.success} />}
            title="Concluídas"
            countText={`${materiasConcluidas.length} ${materiasConcluidas.length === 1 ? 'matéria' : 'matérias'}`}
            tint={colors.success}
          />

          {materiasConcluidas.length === 0 ? (
            <EmptyState
              icon={<TrophyIcon size={52} color={colors.textFaint} />}
              title="Nenhuma matéria concluída ainda"
              description="Complete todos os tópicos de uma matéria para vê-la aqui!"
            />
          ) : (
            materiasConcluidas.map((materia) => {
              const ultimaSessao = sessoes
                .filter((sn) => sn.subject_id === materia.id)
                .sort((a, b) => new Date(b.started_at) - new Date(a.started_at))[0];

              const dataConclusao = ultimaSessao
                ? new Date(ultimaSessao.started_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                  })
                : '—';
              const onPress = () => handleRevisar(materia);

              return (
                <TouchableOpacity key={materia.id} activeOpacity={0.9} onPress={onPress} accessibilityRole="button">
                  <SubjectCard
                    nome={materia.nome}
                    progresso={100}
                    metaTexto={`${materia.topicos.length} tópicos • ${materia.topicos.length} concluídos`}
                    botaoTexto="Revisar"
                    onPress={onPress}
                    variant="completed"
                    dataConclusao={dataConclusao}
                    icon={<CheckIcon size={24} color={colors.success} />}
                  />
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Não Iniciadas */}
        {materiasNaoIniciadas.length > 0 && (
          <View style={s.subjectSection}>
            <SectionHeader
              icon={<PencilIcon size={18} color={colors.info} />}
              title="Não Iniciadas"
              countText={`${materiasNaoIniciadas.length} ${materiasNaoIniciadas.length === 1 ? 'matéria' : 'matérias'}`}
              tint={colors.info}
            />
            {materiasNaoIniciadas.slice(0, 3).map((materia) => {
              const onPress = () => handleContinuarEstudo(materia);
              return (
                <TouchableOpacity key={materia.id} activeOpacity={0.9} onPress={onPress} accessibilityRole="button">
                  <SubjectCard
                    nome={materia.nome}
                    progresso={0}
                    metaTexto={`${materia.topicos?.length || 0} tópicos para estudar`}
                    botaoTexto="Começar"
                    onPress={onPress}
                    icon={<PencilIcon size={24} color={colors.info} />}
                  />
                </TouchableOpacity>
              );
            })}
            {materiasNaoIniciadas.length > 3 && (
              <Text style={s.moreLink}>
                +{materiasNaoIniciadas.length - 3} mais na tela Início
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
