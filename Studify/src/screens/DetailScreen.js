import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StatusBar, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getMateriaById, atualizarMateria, registrarSessao, carregarSessoesPorMateria } from '../services/subjectsDb';

export default function DetailScreen({ route, navigation }) {
  const id = route?.params?.id;
  const [materia, setMateria] = useState(null);
  const [sessoes, setSessoes] = useState([]);

  useEffect(() => {
    if (!id) {
      navigation.goBack();
      return;
    }
    (async () => {
      try {
        const m = await getMateriaById(id);
        setMateria(m);
        const s = await carregarSessoesPorMateria(id);
        setSessoes(s);
      } catch (e) {
        console.error('Erro ao carregar detalhes:', e);
      }
    })();
  }, [id]);

  const toggleTopico = async (index) => {
    if (!materia) return;
    const novosTopicos = materia.topicos.map((t, i) =>
      i === index ? { ...t, estudado: !t.estudado } : t
    );
    await atualizarMateria(id, { topicos: novosTopicos });
    setMateria({ ...materia, topicos: novosTopicos });
  };

  const continuarEstudando = async () => {
    await registrarSessao(id, 0);
    navigation.goBack();
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
  const totalEstudadoMin = sessoes.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0f1e" />
      <LinearGradient colors={['#0a0f1e', '#0d1a2e', '#0a1520']} style={s.gradient} />

      <View style={s.header}>
        <TouchableOpacity style={s.backButton} activeOpacity={0.7} onPress={() => navigation.goBack()}>
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

        <TouchableOpacity style={s.continueButton} activeOpacity={0.8} onPress={continuarEstudando}>
          <Text style={s.continueButtonText}>Continuar estudando</Text>
        </TouchableOpacity>
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

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1e' },
  gradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  loadingText: { color: '#8a9bb5', fontSize: 16, textAlign: 'center', marginTop: 100 },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
    paddingTop: 50, paddingBottom: 12,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  backButtonText: { color: '#8a9bb5', fontSize: 22 },
  headerTitle: { color: '#e8edf5', fontSize: 20, fontWeight: '700', flex: 1 },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  progressCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    padding: 20, marginBottom: 24,
  },
  progressCircle: {
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 3, borderColor: '#5ab8d4',
    alignItems: 'center', justifyContent: 'center', marginRight: 20,
  },
  progressCircleText: { color: '#e8edf5', fontSize: 22, fontWeight: '700' },
  progressCircleLabel: { color: '#8a9bb5', fontSize: 11, marginTop: 2 },
  progressInfo: { flex: 1 },
  progressInfoText: { color: '#e8edf5', fontSize: 16, fontWeight: '600' },
  progressInfoSub: { color: '#8a9bb5', fontSize: 13, marginTop: 4 },
  sectionTitle: { color: '#8a9bb5', fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  topicoRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12, padding: 14, marginBottom: 8,
  },
  topicoRowDone: { backgroundColor: 'rgba(90,184,212,0.08)' },
  checkbox: {
    width: 24, height: 24, borderRadius: 6,
    borderWidth: 2, borderColor: '#4a5a7a',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  checkboxChecked: { backgroundColor: '#5ab8d4', borderColor: '#5ab8d4' },
  checkboxIcon: { color: '#0a0f1e', fontSize: 14, fontWeight: '700' },
  topicoLabel: { color: '#e8edf5', fontSize: 15, flex: 1 },
  topicoLabelDone: { color: '#6a8a9a', textDecorationLine: 'line-through' },
  continueButton: {
    backgroundColor: '#5ab8d4', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 24, marginBottom: 40,
  },
  continueButtonText: { color: '#0a0f1e', fontSize: 16, fontWeight: '700' },
});
