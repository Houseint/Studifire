/**
 * Studify - SubjectCard (escopo só-Progresso).
 * Gradiente cardAlt→card, quadrado 48px raio 16, nome 19/700, % em primaryLight,
 * barra 8px (trilho track, mín. 3% visível), botão full-width 52px raio 16.
 * Variante `completed`: botão "Revisar" + linha "Concluída em {data}".
 * Props: nome, progresso (0-100), metaTexto, botaoTexto, onPress, variant, dataConclusao, icon.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../shared/theme/ThemeContext';
import { ArrowRightIcon } from './ProgressIcons';

export default function SubjectCard({
  nome,
  progresso = 0,
  metaTexto,
  botaoTexto = 'Continuar estudando',
  onPress,
  variant = 'default',
  dataConclusao,
  icon,
}) {
  const { colors } = useTheme();
  const isDark = colors.mode !== 'light';
  const completed = variant === 'completed';
  const pct = Math.max(0, Math.min(100, Math.round(progresso || 0)));
  const visiblePct = pct === 0 ? 0 : Math.max(pct, 3);
  const accent = completed ? colors.success : colors.primary;

  return (
    <LinearGradient
      colors={[colors.cardAlt, colors.card]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, { borderColor: colors.border }]}
    >
      <View style={styles.header}>
        {!!icon && (
          <View style={[styles.iconBox, { backgroundColor: `${accent}26`, borderColor: `${accent}40` }]}>
            {icon}
          </View>
        )}
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
          {nome}
        </Text>
        <Text style={[styles.percent, { color: completed ? colors.success : colors.primaryLight }]}>{pct}%</Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.track }]}>
        <View style={[styles.fill, { width: `${visiblePct}%`, backgroundColor: accent }]} />
      </View>
      <View style={styles.meta}>
        {!!metaTexto && (
          <Text style={[styles.metaText, { color: colors.textMuted }]}>{metaTexto}</Text>
        )}
        {completed && !!dataConclusao && (
          <Text style={[styles.doneDate, { color: colors.success }]}>Concluída em {dataConclusao}</Text>
        )}
      </View>
      <TouchableOpacity
        style={[
          styles.cta,
          {
            backgroundColor: `${accent}26`,
            borderColor: `${accent}4D`,
          },
        ]}
        activeOpacity={0.9}
        onPress={onPress}
        accessibilityRole="button"
      >
        <Text style={[styles.ctaText, { color: isDark ? (completed ? colors.success : '#C9BFFF') : accent }]}>
          {botaoTexto}
        </Text>
        <ArrowRightIcon size={16} color={isDark ? (completed ? colors.success : '#C9BFFF') : accent} />
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 19,
    fontWeight: '700',
    flex: 1,
  },
  percent: {
    fontSize: 15,
    fontWeight: '800',
    minWidth: 48,
    textAlign: 'right',
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  fill: {
    height: '100%',
    borderRadius: 4,
    minWidth: 0,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  metaText: {
    fontSize: 12,
    flex: 1,
  },
  doneDate: {
    fontSize: 12,
    fontWeight: '600',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
