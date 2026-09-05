import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Anel de meta semanal — RN puro (sem react-native-svg para não quebrar jest/Expo Go).
// Props: percent (0-100), currentMinutes, goalMinutes
function ringColor(percent) {
  if (percent >= 100) return '#10B981';
  if (percent >= 70) return '#8A68FF';
  if (percent >= 30) return '#F59E0B';
  return '#EF4444';
}

const WeeklyGoalRing = ({ percent = 0, currentMinutes = 0, goalMinutes = 300 }) => {
  const pct = Math.max(0, Math.min(100, Math.round(percent || 0)));
  const color = ringColor(pct);
  const [display, setDisplay] = useState(0);
  const timerRef = useRef(null);

  // Count-up 0 -> pct em ~600ms (sensação de momentum, sem Reanimated)
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (pct === 0) {
      setDisplay(0);
      return undefined;
    }
    const start = Date.now();
    const dur = 600;
    timerRef.current = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / dur);
      setDisplay(Math.round(pct * t));
      if (t >= 1 && timerRef.current) clearInterval(timerRef.current);
    }, 30);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [pct]);

  const currentHours = Math.round((currentMinutes / 60) * 10) / 10;
  const goalHours = Math.round((goalMinutes / 60) * 10) / 10;
  const remaining = Math.max(0, goalMinutes - currentMinutes);

  return (
    <View style={s.card}>
      <View style={s.row}>
        <View style={[s.ring, { borderColor: color }]}>
          <Text style={s.pct}>{display}%</Text>
          <Text style={s.hours}>
            {currentHours}/{goalHours}h
          </Text>
        </View>
        <View style={s.info}>
          <Text style={s.title}>META SEMANAL</Text>
          <Text style={s.sub}>
            {pct >= 100 ? 'Meta batida! 🎉' : remaining > 0 ? `Faltam ${remaining} min` : 'Comece hoje 🌱'}
          </Text>
          <View style={s.bar}>
            <View style={[s.fill, { width: `${pct}%`, backgroundColor: color }]} />
          </View>
          <Text style={s.meta}>
            {currentMinutes} de {goalMinutes} min
          </Text>
        </View>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  card: {
    backgroundColor: '#111832',
    borderWidth: 1,
    borderColor: '#27315B',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  ring: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 9,
    backgroundColor: '#090E1F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pct: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  hours: { color: '#8E97C4', fontSize: 10, fontWeight: '700', marginTop: 2 },
  info: { flex: 1, marginLeft: 14 },
  title: { color: '#8F98C2', fontSize: 12, fontWeight: '900', letterSpacing: 0.4 },
  sub: { color: '#F4F6FF', fontSize: 14, fontWeight: '800', marginTop: 4 },
  bar: {
    marginTop: 8,
    height: 6,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 999 },
  meta: { color: '#7F8AB7', fontSize: 11, fontWeight: '700', marginTop: 6 },
});

export default WeeklyGoalRing;
