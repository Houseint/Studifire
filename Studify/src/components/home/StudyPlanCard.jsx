import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../shared/theme/ThemeContext';
import { buildWeeklyPlan } from '../../shared/utils/studyPlan';
import { ClockIcon, SproutIcon, RefreshCwIcon, CalendarIcon } from '../common/FeatherIcons';

const KIND_ICONS = { revisao: ClockIcon, novo: SproutIcon, reforco: RefreshCwIcon };

// Card puro: recebe o que a Home já tem, sem query nova (padrão SmartNextSteps).
const StudyPlanCard = ({ materias = [], goalMinutes = 0, currentMinutes = 0 }) => {
  const { colors } = useTheme();
  const s = useMemo(() => getPlanStyles(colors), [colors]);
  const plan = buildWeeklyPlan(materias, { goalMinutes, currentMinutes });
  if (plan.totalItems === 0) return null;
  return (
    <View style={s.card}>
      <View style={s.iconWrap}>
        <CalendarIcon size={24} color={colors.accent} />
      </View>
      <View style={s.body}>
        <Text style={s.label}>PLANO DA SEMANA</Text>
        <Text style={s.text}>
          {plan.perDayMinutes} min/dia · {plan.totalItems} {plan.totalItems > 1 ? 'itens' : 'item'}
        </Text>
        {plan.days.slice(0, 3).map((d) => (
          <View key={d.date} style={s.dayRow}>
            <Text style={s.row}>{`${d.weekday} ·`}</Text>
            {d.items.length === 0 ? (
              <Text style={s.row}>—</Text>
            ) : (
              d.items.map((it, i) => {
                const KindIcon = KIND_ICONS[it.kind] || SproutIcon;
                return (
                  <View key={i} style={s.itemRow}>
                    <KindIcon size={12} color={colors.textSecondary} />
                    <Text style={s.row}>{it.topicoNome}</Text>
                  </View>
                );
              })
            )}
          </View>
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
  iconWrap: { marginRight: 10, marginTop: 2 },
  body: { flex: 1 },
  label: { color: colors.textMuted, fontSize: 11, fontWeight: '900', letterSpacing: 0.4 },
  text: { color: colors.text, fontSize: 14, fontWeight: '800', marginTop: 2 },
  dayRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap', gap: 6 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  row: { color: colors.textSecondary, fontSize: 12 },
});

export default StudyPlanCard;
