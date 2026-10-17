/**
 * Studify - ProgressRing (escopo só-Progresso).
 * Anel SVG 116px, trilho `track`, arco gradiente primaryLight→primaryDark,
 * strokeWidth 10, topo como início, % central + legenda "GERAL".
 * Guard total=0 → 0% (sem divisão por zero).
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Svg, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../../shared/theme/ThemeContext';

const SIZE = 116;
const STROKE = 10;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

/** Puro e testável: 0..100. Guard total<=0 → 0. */
export function getProgressPercent(concluidos, total) {
  if (!total || total <= 0) return 0;
  const p = Math.round((concluidos / total) * 100);
  if (Number.isNaN(p)) return 0;
  return Math.max(0, Math.min(100, p));
}

export default function ProgressRing({ concluidos = 0, total = 0 }) {
  const { colors } = useTheme();
  const percent = getProgressPercent(concluidos, total);
  const offset = C * (1 - percent / 100);
  return (
    <View style={styles.wrap} accessibilityLabel={`Progresso geral ${percent}%`}>
      <Svg width={SIZE} height={SIZE}>
        <Defs>
          <LinearGradient id="progressRingGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.primaryLight} />
            <Stop offset="1" stopColor={colors.primaryDark} />
          </LinearGradient>
        </Defs>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke={colors.track} strokeWidth={STROKE} fill="none" />
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          stroke="url(#progressRingGrad)"
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${C} ${C}`}
          strokeDashoffset={offset}
          rotation="-90"
          origin={`${SIZE / 2}, ${SIZE / 2}`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.percent, { color: colors.text }]}>{percent}%</Text>
        <Text style={[styles.caption, { color: colors.textFaint }]}>GERAL</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percent: {
    fontSize: 26,
    fontWeight: '700',
  },
  caption: {
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 1.6,
    marginTop: 2,
  },
});
