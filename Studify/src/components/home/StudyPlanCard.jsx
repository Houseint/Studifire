import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { buildWeeklyPlan } from '../../shared/utils/studyPlan';

const KIND_EMOJI = { revisao: '⏰', novo: '🌱', reforco: '🔁' };

// Card puro: recebe o que a Home já tem, sem query nova (padrão SmartNextSteps).
const StudyPlanCard = ({ materias = [], goalMinutes = 0, currentMinutes = 0 }) => {
  const plan = buildWeeklyPlan(materias, { goalMinutes, currentMinutes });
  if (plan.totalItems === 0) return null;
  return (
    <View style={s.card}>
      <Text style={s.emoji}>📅</Text>
      <View style={s.body}>
        <Text style={s.label}>PLANO DA SEMANA</Text>
        <Text style={s.text}>
          {plan.perDayMinutes} min/dia · {plan.totalItems} {plan.totalItems > 1 ? 'itens' : 'item'}
        </Text>
        {plan.days.slice(0, 3).map((d) => (
          <Text key={d.date} style={s.row} numberOfLines={1}>
            {d.weekday} · {d.items.map((it) => `${KIND_EMOJI[it.kind] || ''} ${it.topicoNome}`).join('  ') || '—'}
          </Text>
        ))}
      </View>
    </View>
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
    alignItems: 'flex-start',
  },
  emoji: { fontSize: 26, marginRight: 10 },
  body: { flex: 1 },
  label: { color: '#8F98C2', fontSize: 11, fontWeight: '900', letterSpacing: 0.4 },
  text: { color: '#F4F6FF', fontSize: 14, fontWeight: '800', marginTop: 2 },
  row: { color: '#C6CBE8', fontSize: 12, marginTop: 4 },
});

export default StudyPlanCard;
