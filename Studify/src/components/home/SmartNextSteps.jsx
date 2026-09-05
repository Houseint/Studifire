import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// Lógica pura e testável: decide o próximo passo a partir de dados que o Home já tem.
export function getNextStep({ streak = 0, materias = [], weeklyPercent = 0, weeklyRemaining = 0 } = {}) {
  const all = Array.isArray(materias) ? materias : [];
  if (all.length === 0) {
    return { emoji: '🌱', text: 'Crie sua primeira matéria para começar' };
  }
  if (!streak || streak === 0) {
    return { emoji: '🔥', text: 'Volte hoje e recupere seu streak!' };
  }
  const withPct = all.map((m) => {
    const tops = Array.isArray(m.topicos) ? m.topicos : [];
    const done = tops.filter((t) => t.estudado).length;
    const pct = tops.length > 0 ? Math.round((done / tops.length) * 100) : 0;
    return { nome: m.nome, pct };
  });
  const zero = withPct.find((m) => m.pct === 0);
  if (zero) return { emoji: '🌱', text: `Comece: ${zero.nome}` };
  const low = withPct.sort((a, b) => a.pct - b.pct)[0];
  if (low && low.pct < 50) return { emoji: '📚', text: `Continue: ${low.nome} (${low.pct}%)` };
  if ((weeklyPercent || 0) < 100 && (weeklyRemaining || 0) > 0) {
    return { emoji: '⏱', text: `Faltam ${weeklyRemaining} min para a meta semanal` };
  }
  return { emoji: '🏆', text: 'Meta no rumo! Revise um tópico de hoje' };
}

const SmartNextSteps = ({ streak = 0, materias = [], weeklyPercent = 0, weeklyRemaining = 0, onPress }) => {
  const step = getNextStep({ streak, materias, weeklyPercent, weeklyRemaining });
  return (
    <TouchableOpacity style={s.card} activeOpacity={0.85} onPress={onPress}>
      <Text style={s.emoji}>{step.emoji}</Text>
      <View style={s.body}>
        <Text style={s.label}>PRÓXIMO PASSO INTELIGENTE</Text>
        <Text style={s.text}>{step.text}</Text>
      </View>
    </TouchableOpacity>
  );
};

const s = StyleSheet.create({
  card: {
    backgroundColor: '#1A1C4A',
    borderWidth: 1,
    borderColor: '#4850AE',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: { fontSize: 26, marginRight: 10 },
  body: { flex: 1 },
  label: { color: '#8F98C2', fontSize: 11, fontWeight: '900', letterSpacing: 0.4 },
  text: { color: '#F4F6FF', fontSize: 14, fontWeight: '800', marginTop: 2 },
});

export default SmartNextSteps;
