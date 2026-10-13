/**
 * Studify - StatCard (escopo só-Progresso).
 * Tint 40px raio 14 + número 26/700 + label uppercase.
 * Props: icon (nó 20px), value (string/number), suffix (ex. "/10" apagado), label, tint (cor base).
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../shared/theme/ThemeContext';

export default function StatCard({ icon, value, suffix, label, tint }) {
  const { colors } = useTheme();
  const tintColor = tint || colors.primary;
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {!!icon && (
        <View style={[styles.tint, { backgroundColor: `${tintColor}26` }]}>
          {icon}
        </View>
      )}
      <Text style={[styles.value, { color: colors.text }]}>
        {value}
        {!!suffix && <Text style={[styles.suffix, { color: colors.textFaint }]}>{suffix}</Text>}
      </Text>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  tint: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  value: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  suffix: {
    fontSize: 16,
    fontWeight: '600',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 4,
    textAlign: 'center',
  },
});
