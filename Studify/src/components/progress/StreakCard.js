/**
 * Studify - StreakCard (escopo só-Progresso).
 * Gradiente âmbar, chama 34px em quadrado 64px, número 38/800,
 * botão "Manter vivo" (sem handler — igual hoje, só visual),
 * 7 bolinhas 26px derivadas da prop `sessoes` (default []).
 * Mesma expressão do calcularStats: Set de toDateString — sem nova fonte de dados.
 */
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../shared/theme/ThemeContext';
import { FlameIcon, CheckIcon } from './ProgressIcons';

/** Puro e testável: 7 dias (hoje-6..hoje) com flags {date, estudou, isHoje}. */
export function buildStreakDots(sessoes = [], now = new Date()) {
  const set = new Set((sessoes || []).map((s) => new Date(s.started_at).toDateString()));
  const base = new Date(now);
  base.setHours(0, 0, 0, 0);
  const dots = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    const isHoje = d.toDateString() === base.toDateString();
    dots.push({ date: d, estudou: set.has(d.toDateString()), isHoje });
  }
  return dots;
}

export default function StreakCard({ sequencia = 0, sessoes = [] }) {
  const { colors } = useTheme();
  const isDark = colors.mode !== 'light';
  const dots = useMemo(() => buildStreakDots(sessoes, new Date()), [sessoes]);
  const gradient = isDark
    ? [colors.amberBg, '#1D1A22', '#141830']
    : [colors.amberBg, '#FFF7EA', '#FFFFFF'];
  const sub = sequencia === 1 ? 'dia seguido' : 'dias seguidos';

  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, { borderColor: colors.amberBorder }]}
    >
      <View style={styles.topRow}>
        <View style={styles.left}>
          <View style={[styles.flameBox, { backgroundColor: isDark ? 'rgba(245,160,11,0.18)' : '#FEF3E2', borderColor: colors.amberBorder }]}>
            <FlameIcon size={34} color={colors.amber} />
          </View>
          <View style={styles.info}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Sequência atual</Text>
            <Text style={[styles.value, { color: colors.amberLight }]}>{sequencia}</Text>
            <Text style={[styles.sub, { color: colors.textSecondary }]}>{sub}</Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.cta, { borderColor: colors.amberBorder }]} activeOpacity={0.9} accessibilityLabel="Manter vivo" accessibilityRole="button">
          <Text style={styles.ctaText}>Manter vivo</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.dotsRow}>
        {dots.map((d, i) => {
          const filled = d.estudou;
          return (
            <View
              key={i}
              accessibilityLabel={`${d.date.toLocaleDateString('pt-BR', { weekday: 'short' })} ${filled ? 'estudado' : 'não estudado'}${d.isHoje ? ', hoje' : ''}`}
              style={[
                styles.dot,
                filled
                  ? { backgroundColor: colors.amber, borderColor: colors.amber }
                  : {
                      backgroundColor: 'transparent',
                      borderColor: colors.borderDashed,
                      borderStyle: 'dashed',
                      opacity: 0.7,
                    },
                d.isHoje && { borderColor: colors.amber, borderStyle: 'solid', borderWidth: 2 },
              ]}
            >
              {filled && <CheckIcon size={13} color={isDark ? '#1A1206' : '#FFFFFF'} />}
            </View>
          );
        })}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flameBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  info: {},
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  value: {
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 42,
  },
  sub: {
    fontSize: 13,
    marginTop: 2,
  },
  cta: {
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 44,
    justifyContent: 'center',
    backgroundColor: '#F5A00B',
    borderWidth: 1,
  },
  ctaText: {
    color: '#1A1206',
    fontSize: 13,
    fontWeight: '800',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
