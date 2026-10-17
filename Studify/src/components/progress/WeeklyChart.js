/**
 * Studify - WeeklyChart (escopo só-Progresso).
 * Props: dados [{dia, minutos, horas, isHoje}], maxMinutos, formatarTempo(min)->string.
 * Constante local META_DIARIA_MIN = 30 (valor fixo do mockup; só linha tracejada + chip).
 * Card raio 26 com total da semana + chip "Meta: 30min/dia", área 120px,
 * barras larg. 30 topo arredondado, altura mín. 8px (12px hoje), labels dia+minutos,
 * legenda Hoje/Outros centralizada.
 */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../shared/theme/ThemeContext';

export const META_DIARIA_MIN = 30;
const AREA_H = 120;
const BAR_W = 30;

export default function WeeklyChart({ dados = [], maxMinutos = 1, formatarTempo }) {
  const { colors } = useTheme();
  const fmt = formatarTempo || ((min) => (min < 60 ? `${min}min` : `${Math.floor(min / 60)}h${min % 60 > 0 ? `${min % 60}min` : ''}`));
  const totalMin = useMemo(() => (dados || []).reduce((a, d) => a + (d.minutos || 0), 0), [dados]);
  const scale = Math.max(maxMinutos || 1, META_DIARIA_MIN, 1);
  const goalBottom = (META_DIARIA_MIN / scale) * AREA_H;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.topRow}>
        <Text style={[styles.total, { color: colors.text }]}>{fmt(totalMin)} esta semana</Text>
        <View style={[styles.chip, { backgroundColor: colors.card2, borderColor: colors.border }]}>
          <Text style={[styles.chipText, { color: colors.textSecondary }]}>Meta: 30min/dia</Text>
        </View>
      </View>
      <View style={[styles.area, { height: AREA_H }]}>
        <View pointerEvents="none" style={[styles.goalLine, { bottom: goalBottom, borderColor: colors.borderDashed }]} />
        <View style={styles.bars}>
          {(dados || []).map((d, i) => {
            const h = Math.max((d.minutos / scale) * AREA_H, d.minutos > 0 ? (d.isHoje ? 12 : 8) : d.isHoje ? 12 : 8);
            const barStyle = { width: BAR_W, height: h };
            return (
              <View key={i} style={styles.col}>
                {d.isHoje ? (
                  <LinearGradient colors={['#B8A2FF', colors.primary]} style={[styles.bar, styles.barRound, barStyle]}>
                    <View style={[styles.glowHoje, { backgroundColor: colors.primary, opacity: 0.25 }]} />
                  </LinearGradient>
                ) : (
                  <View style={[styles.bar, styles.barRound, barStyle, { backgroundColor: colors.barIdle }]} />
                )}
                <Text style={[styles.day, { color: d.isHoje ? colors.primaryLight : colors.textMuted, fontWeight: d.isHoje ? '700' : '500' }]}>{d.dia}</Text>
                <Text style={[styles.mins, { color: d.isHoje ? colors.primaryLight : colors.text, fontWeight: d.isHoje ? '700' : '600' }]}>
                  {d.horas > 0 ? `${d.horas}h` : `${d.minutos}min`}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Hoje</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.barIdle }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Outros</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 18,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  total: {
    fontSize: 15,
    fontWeight: '700',
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  area: {
    justifyContent: 'flex-end',
    position: 'relative',
  },
  goalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1.5,
    borderStyle: 'dashed',
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: '100%',
  },
  col: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  bar: {
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barRound: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    minHeight: 8,
  },
  glowHoje: {
    position: 'absolute',
    top: -6,
    left: -4,
    right: -4,
    height: 18,
    borderRadius: 9,
  },
  day: {
    fontSize: 10,
    marginTop: 6,
  },
  mins: {
    fontSize: 10,
    marginTop: 2,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
