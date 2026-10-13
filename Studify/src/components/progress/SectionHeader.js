/**
 * Studify - SectionHeader (escopo só-Progresso).
 * Quadrado tintado 32px + título + pill de contagem.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../shared/theme/ThemeContext';

export default function SectionHeader({ icon, title, countText, tint }) {
  const { colors } = useTheme();
  const tintColor = tint || colors.primary;
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        {!!icon && (
          <View style={[styles.iconBox, { backgroundColor: `${tintColor}26`, borderColor: `${tintColor}40` }]}>
            {icon}
          </View>
        )}
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      </View>
      {!!countText && (
        <View style={[styles.pill, { backgroundColor: colors.card2, borderColor: colors.border }]}>
          <Text style={[styles.pillText, { color: colors.textSecondary }]}>{countText}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  pill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
