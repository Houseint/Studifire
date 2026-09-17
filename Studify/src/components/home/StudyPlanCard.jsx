import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../shared/theme/ThemeContext';
import { buildWeeklyPlan } from '../../shared/utils/studyPlan';

const KIND_EMOJI = { revisao: '⏰', novo: '🌱', reforco: '🔁' };

// Card puro: recebe o que a Home já tem, sem query nova (padrão SmartNextSteps).
const StudyPlanCard = ({ materias = [], goalMinutes = 0, currentMinutes = 0 }) => {
  const { colors } = useTheme();
  const s = useMemo(() => getPlanStyles(colors), [colors]);
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

const getPlanStyles = (colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.mode === 'light' ? colors.card : '#1A1C4A',
    borderWidth: 1,
    borderColor: colors.mode === 'light' ? colors.accent : '#4850AE',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  emoji: { fontSize: 26, marginRight: 10 },
  body: { flex: 1 },
  label: { color: colors.textMuted, fontSize: 11, fontWeight: '900', letterSpacing: 0.4 },
  text: { color: colors.text, fontSize: 14, fontWeight: '800', marginTop: 2 },
  row: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
});

export default StudyPlanCard;
