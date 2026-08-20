import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProgressScreenStyles as s } from '../styles/screens/ProgressScreenStyles.js';
import { useUserId } from '../hooks/useUserId';
import { carregarMaterias, carregarHistorico } from '../services/subjectsDb';

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function ProgressScreen({ navigation }) {
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

      dados.push({
        dia: DIAS_SEMANA[data.getDay()],
        minutos,
        horas: Math.round(minutos / 60 * 10) / 10,
        isHoje: data.toDateString() === agora.toDateString(),
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
    navigation.navigate('Detail', { materia });
  };

  const handleRevisar = (materia) => {
    navigation.navigate('Detail', { materia, revisar: true });
  };

  if (!userId) {
    return (
      <View style={s.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0f1e" />
        <LinearGradient colors={['#0a0f1e', '#0d1a2e', '#0a1520']} style={s.gradient} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#7F8AB7', fontSize: 16 }}>Carregando...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0f1e" />
      <LinearGradient colors={['#0a0f1e', '#0d1a2e', '#0a1520']} style={s.gradient} />

      <ScrollView
        style={s.scrollView}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <TouchableOpacity
              style={s.backButton}
              activeOpacity={0.7}
              onPress={() => navigation.goBack()}
            >
              <Text style={s.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={s.headerTitle}>Progresso</Text>
          </View>
          <TouchableOpacity
            style={s.profileButton}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={s.profileButtonText}>◌</Text>
          </TouchableOpacity>
        </View>

        {/* Stat Cards */}
        <View style={s.statsRow}>
          <View style={[s.statCard, { borderColor: 'rgba(138, 104, 255, 0.4)' }]}>
            <Text style={s.statIcon}>📚</Text>
            <Text style={s.statValue}>{stats.totalMaterias}</Text>
            <Text style={s.statLabel}>Matérias</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statIcon}>✓</Text>
            <Text style={s.statValue}>{stats.topicosConcluidos}/{stats.totalTopicos}</Text>
            <Text style={s.statLabel}>Tópicos</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statIcon}>⏱</Text>
            <Text style={s.statValue}>{stats.totalHoras > 0 ? stats.totalHoras + 'h' : '0h'}</Text>
            <Text style={s.statLabel}>Horas</Text>
          </View>
        </View>

        {/* Streak Card */}
        <View style={s.streakCard}>
          <View style={s.streakLeft}>
            <Text style={s.streakFire}>🔥</Text>
            <View style={s.streakInfo}>
              <Text style={s.streakLabel}>Sequência atual</Text>
              <Text style={s.streakValue}>{stats.sequencia}</Text>
              <Text style={s.streakSub}>{stats.sequencia === 1 ? 'dia seguido' : 'dias seguidos'}</Text>
            </View>
          </View>
          <TouchableOpacity style={s.streakButton} activeOpacity={0.7}>
            <Text style={s.streakButtonText}>Manter vivo</Text>
          </TouchableOpacity>
        </View>

        {/* Weekly Chart */}
        <View style={s.chartSection}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Evolução Semanal</Text>
            <Text style={s.sectionSubtitle}>Últimos 7 dias</Text>
          </View>
          <View style={s.chartCard}>
            <View style={s.chartWrapper}>
              <View style={s.chartBars}>
                {dadosGrafico.map((d, i) => (
                  <View key={i} style={s.chartBarContainer}>
                    <View
                      style={[
                        s.chartBar,
                        {
                          height: Math.max((d.minutos / maxMinutos) * 90, d.minutos > 0 ? 4 : 0),
                          backgroundColor: d.isHoje ? '#8A68FF' : 'rgba(138, 104, 255, 0.4)',
                        },
                      ]}
                    />
                    <Text style={s.chartBarLabel}>{d.dia}</Text>
                    <Text style={s.chartBarValue}>{d.horas > 0 ? d.horas + 'h' : d.minutos + 'min'}</Text>
                  </View>
                ))}
              </View>
            </View>
            {/* Legend */}
            <View style={s.legendRow}>
              <View style={s.legendItem}>
                <View style={[s.legendDot, s.legendDotInProgress]} />
                <Text style={s.legendText}>Hoje</Text>
              </View>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: 'rgba(138, 104, 255, 0.4)' }]} />
                <Text style={s.legendText}>Outros dias</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Em Andamento */}
        <View style={s.subjectSection}>
          <View style={s.subjectSectionHeader}>
            <Text style={s.sectionTitle}>📚 Em Andamento</Text>
            <Text style={s.sectionSubtitle}>
              {materiasEmAndamento.length} {materiasEmAndamento.length === 1 ? 'matéria' : 'matérias'}
            </Text>
          </View>

          {materiasEmAndamento.length === 0 ? (
            <View style={s.emptySection}>
              <Text style={s.emptyIcon}>🌱</Text>
              <Text style={s.emptyTitle}>Nenhuma matéria em andamento</Text>
              <Text style={s.emptySubtitle}>
                Comece a estudar uma matéria para ver seu progresso aqui!
              </Text>
            </View>
          ) : (
            materiasEmAndamento.map((materia) => {
              const progresso = getProgressoMateria(materia);
              const concluidas = materia.topicos.filter((t) => t.estudado).length;
              const total = materia.topicos.length;

              return (
                <TouchableOpacity
                  key={materia.id}
                  style={[s.subjectCard, s.subjectCardInProgress]}
                  activeOpacity={0.8}
                  onPress={() => handleContinuarEstudo(materia)}
                >
                  <View style={s.subjectHeader}>
                    <Text style={s.subjectName}>{materia.nome}</Text>
                    <Text style={s.subjectProgressText}>{progresso}%</Text>
                  </View>
                  <View style={s.progressBarContainer}>
                    <View
                      style={[
                        s.progressBar,
                        s.progressBarInProgress,
                        { width: `${progresso}%` },
                      ]}
                    />
                  </View>
                  <View style={s.subjectMeta}>
                    <Text style={s.subjectTopics}>{concluidas} de {total} tópicos concluídos</Text>
                  </View>
                  <View style={s.subjectActionButton}>
                    <Text style={s.subjectActionButtonText}>Continuar estudando</Text>
                    <Text style={s.subjectActionButtonText}>→</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Concluídas */}
        <View style={s.subjectSection}>
          <View style={s.subjectSectionHeader}>
            <Text style={s.sectionTitle}>✅ Concluídas</Text>
            <Text style={s.sectionSubtitle}>
              {materiasConcluidas.length} {materiasConcluidas.length === 1 ? 'matéria' : 'matérias'}
            </Text>
          </View>

          {materiasConcluidas.length === 0 ? (
            <View style={s.emptySection}>
              <Text style={s.emptyIcon}>🏆</Text>
              <Text style={s.emptyTitle}>Nenhuma matéria concluída ainda</Text>
              <Text style={s.emptySubtitle}>
                Complete todos os tópicos de uma matéria para vê-la aqui!
              </Text>
            </View>
          ) : (
            materiasConcluidas.map((materia) => {
              const ultimaSessao = sessoes
                .filter((s) => s.subject_id === materia.id)
                .sort((a, b) => new Date(b.started_at) - new Date(a.started_at))[0];

              const dataConclusao = ultimaSessao
                ? new Date(ultimaSessao.started_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                  })
                : '—';

              return (
                <TouchableOpacity
                  key={materia.id}
                  style={[s.subjectCard, s.subjectCardCompleted]}
                  activeOpacity={0.8}
                  onPress={() => handleRevisar(materia)}
                >
                  <View style={s.subjectHeader}>
                    <Text style={s.subjectName}>{materia.nome}</Text>
                    <Text style={[s.subjectProgressText, s.subjectProgressTextCompleted]}>100%</Text>
                  </View>
                  <View style={s.progressBarContainer}>
                    <View style={[s.progressBar, s.progressBarCompleted, { width: '100%' }]} />
                  </View>
                  <View style={s.subjectMeta}>
                    <Text style={s.subjectTopics}>{materia.topicos.length} tópicos • {materia.topicos.length} concluídos</Text>
                    <Text style={s.subjectCompletedDate}>Concluída em {dataConclusao}</Text>
                  </View>
                  <View style={[s.subjectActionButton, s.subjectActionButtonCompleted]}>
                    <Text style={[s.subjectActionButtonText, s.subjectActionButtonTextCompleted]}>Revisar</Text>
                    <Text style={[s.subjectActionButtonText, s.subjectActionButtonTextCompleted]}>→</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Não Iniciadas - opcional, pode remover se quiser */}
        {materiasNaoIniciadas.length > 0 && (
          <View style={s.subjectSection}>
            <View style={s.subjectSectionHeader}>
              <Text style={s.sectionTitle}>📝 Não Iniciadas</Text>
              <Text style={s.sectionSubtitle}>
                {materiasNaoIniciadas.length} {materiasNaoIniciadas.length === 1 ? 'matéria' : 'matérias'}
              </Text>
            </View>
            {materiasNaoIniciadas.slice(0, 3).map((materia) => (
              <TouchableOpacity
                key={materia.id}
                style={s.subjectCard}
                activeOpacity={0.8}
                onPress={() => handleContinuarEstudo(materia)}
              >
                <View style={s.subjectHeader}>
                  <Text style={s.subjectName}>{materia.nome}</Text>
                  <Text style={s.subjectProgressText}>0%</Text>
                </View>
                <View style={s.progressBarContainer}>
                  <View style={[s.progressBar, { width: '0%' }]} />
                </View>
                <View style={s.subjectMeta}>
                  <Text style={s.subjectTopics}>{materia.topicos?.length || 0} tópicos para estudar</Text>
                </View>
                <View style={s.subjectActionButton}>
                  <Text style={s.subjectActionButtonText}>Começar</Text>
                  <Text style={s.subjectActionButtonText}>→</Text>
                </View>
              </TouchableOpacity>
            ))}
            {materiasNaoIniciadas.length > 3 && (
              <Text style={{ color: '#7F8AB7', fontSize: 13, textAlign: 'center', marginTop: 8 }}>
                +{materiasNaoIniciadas.length - 3} mais na tela Início
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}