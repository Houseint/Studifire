import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../shared/theme/ThemeContext';
import { buildWeeklyPlan } from '../../shared/utils/studyPlan';
import { ClockIcon, SproutIcon, RefreshCwIcon, CalendarIcon } from '../common/FeatherIcons';

const KIND_ICONS = { revisao: ClockIcon, novo: SproutIcon, reforco: RefreshCwIcon };
const KIND_LABEL = { revisao: 'Revisão', novo: 'Novo', reforco: 'Reforço' };
const KIND_COLOR = { revisao: '#F59E0B', novo: '#4ADE80', reforco: '#60A5FA' };

const dayNumber = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : String(d.getDate()).padStart(2, '0');
};

// Card puro: recebe o que a Home já tem, sem query nova (padrão SmartNextSteps).
// Visual: trilha dos 7 dias + agenda dos próximos dias com itens.
const StudyPlanCard = ({ materias = [], goalMinutes = 0, currentMinutes = 0 }) => {
  const { colors } = useTheme();
  const s = useMemo(() => getPlanStyles(colors), [colors]);
  const plan = buildWeeklyPlan(materias, { goalMinutes, currentMinutes });
  if (plan.totalItems === 0) return null;

  return (
    <View style={s.card}>
      <View style={s.header}>
        <View style={s.iconWrap}>
          <CalendarIcon size={22} color={colors.accent} />
        </View>
        <View style={s.headerBody}>
          <Text style={s.label}>PLANO DA SEMANA</Text>
          <Text style={s.text}>
            {plan.perDayMinutes} min/dia · {plan.totalItems} {plan.totalItems > 1 ? 'itens' : 'item'}
          </Text>
        </View>
      </View>

      {/* Trilha dos 7 dias: hoje em destaque, bolinha quando há conteúdo. */}
      <View style={s.weekStrip}>
        {plan.days.map((d, i) => {
          const today = i === 0;
          return (
            <View key={d.date} style={[s.dayPill, today && s.dayPillToday]}>
              <Text style={[s.dayPillLabel, today && s.dayPillLabelToday]}>{d.weekday}</Text>
              <Text style={[s.dayPillNumber, today && s.dayPillNumberToday]}>{dayNumber(d.date)}</Text>
              <View
                style={[
                  s.dayDot,
                  { backgroundColor: d.items.length > 0 ? colors.accent : 'transparent' },
                ]}
              />
            </View>
          );
        })}
      </View>

      {/* Agenda: só dias com itens; hoje sempre aparece (mesmo livre). */}
      {plan.days.map((d, i) => {
        if (i > 0 && d.items.length === 0) return null;
        if (i > 4) return null;
        const today = i === 0;
        return (
          <View key={`agenda-${d.date}`} style={[s.dayBlock, today && s.dayBlockToday]}>
            <View style={s.dayHeader}>
              <Text style={[s.dayLabel, today && { color: colors.accent }]}>{`${d.weekday} ·`}</Text>
              <Text style={s.dayDate}>{dayNumber(d.date)}</Text>
              {today ? <Text style={s.todayBadge}>HOJE</Text> : null}
            </View>
            {d.items.length === 0 ? (
              <Text style={s.freeText}>Dia livre — descanse ou adiante um tópico.</Text>
            ) : (
              d.items.map((it, idx) => {
                const KindIcon = KIND_ICONS[it.kind] || SproutIcon;
                const tint = KIND_COLOR[it.kind] || colors.accent;
                return (
                  <View key={`${it.kind}-${idx}`} style={s.itemRow}>
                    <View style={[s.itemIcon, { backgroundColor: `${tint}22`, borderColor: `${tint}55` }]}>
                      <KindIcon size={13} color={tint} />
                    </View>
                    <View style={s.itemBody}>
                      <Text style={s.itemName} numberOfLines={1}>{it.topicoNome}</Text>
                      <Text style={s.itemMeta} numberOfLines={1}>
                        {it.materiaNome} · {KIND_LABEL[it.kind] || 'Estudo'}
                      </Text>
                    </View>
                    <Text style={[s.itemTag, { color: tint, borderColor: `${tint}55` }]}>
                      {it.kind === 'revisao' ? 'REVISAR' : it.kind === 'novo' ? 'ESTUDAR' : 'REFORÇAR'}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        );
      })}
    </View>
  );
};

const getPlanStyles = (colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.mode === 'light' ? colors.card : '#1A1C4A',
    borderWidth: 1,
    borderColor: colors.mode === 'light' ? colors.accent : '#4850AE',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  header: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: colors.mode === 'light' ? colors.card2 : '#252866',
    borderWidth: 1,
    borderColor: colors.mode === 'light' ? colors.border : '#3A3F85',
  },
  headerBody: { flex: 1 },
  label: { color: colors.textMuted, fontSize: 11, fontWeight: '900', letterSpacing: 0.6 },
  text: { color: colors.text, fontSize: 14, fontWeight: '800', marginTop: 2 },
  weekStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 8,
  },
  dayPill: {
    flex: 1,
    marginHorizontal: 2,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.mode === 'light' ? colors.card2 : 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.mode === 'light' ? colors.border : 'rgba(255,255,255,0.07)',
  },
  dayPillToday: {
    backgroundColor: colors.mode === 'light' ? `${colors.accent}22` : 'rgba(91,124,255,0.22)',
    borderColor: colors.accent,
  },
  dayPillLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '800' },
  dayPillLabelToday: { color: colors.accent },
  dayPillNumber: { color: colors.textSecondary, fontSize: 12, fontWeight: '800', marginTop: 1 },
  dayPillNumberToday: { color: colors.text },
  dayDot: { width: 4, height: 4, borderRadius: 2, marginTop: 4 },
  dayBlock: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.mode === 'light' ? colors.border : 'rgba(255,255,255,0.08)',
  },
  dayBlockToday: {},
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  dayLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '900' },
  dayDate: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  todayBadge: {
    color: colors.accent,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 5,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  freeText: { color: colors.textMuted, fontSize: 12, fontStyle: 'italic' },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  itemIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: 8,
  },
  itemBody: { flex: 1, minWidth: 0 },
  itemName: { color: colors.text, fontSize: 13, fontWeight: '700' },
  itemMeta: { color: colors.textMuted, fontSize: 10, marginTop: 1 },
  itemTag: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.4,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginLeft: 6,
  },
});

export default StudyPlanCard;
