/**
 * Studify - EmptyState (escopo só-Progresso).
 * Borda tracejada, glow radial (View absoluta), ícone 52px, título + descrição via props
 * (textos atuais da tela são passados por quem usa — nada de texto fixo aqui).
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../shared/theme/ThemeContext';

export default function EmptyState({ icon, title, description }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.box, { borderColor: colors.borderDashed, backgroundColor: colors.card }]}>
      <View pointerEvents="none" style={[styles.glow, { backgroundColor: colors.primary, opacity: colors.mode === 'light' ? 0.08 : 0.14 }]} />
      {!!icon && <View style={styles.iconWrap}>{icon}</View>}
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {!!description && <Text style={[styles.desc, { color: colors.textMuted }]}>{description}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    overflow: 'hidden',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    top: -20,
    alignSelf: 'center',
  },
  iconWrap: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    opacity: 0.9,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  desc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
});
