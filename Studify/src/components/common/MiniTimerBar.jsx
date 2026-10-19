import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTimer } from '../../shared/timer/TimerContext';
import { useTheme } from '../../shared/theme/ThemeContext';
import { ClockIcon } from './FeatherIcons';

function fmt(total) {
  const t = Math.max(0, Math.floor(total || 0));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const sec = t % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

// Barra flutuante global: mostra a sessão ativa em qualquer tela e leva de
// volta para a Detail correspondente (o timer vive no TimerProvider).
export default function MiniTimerBar({ navRef, hidden }) {
  const { colors } = useTheme();
  const { session } = useTimer();

  if (!session || hidden) return null;

  const isPomodoro = session.mode === 'pomodoro';
  const seconds = isPomodoro
    ? Math.max(0, session.duration * 60 - session.elapsed)
    : session.elapsed;
  const status = session.paused ? 'pausado' : session.finished ? 'bloco concluído' : null;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => navRef?.current?.navigate('Detail', { id: session.materiaId })}
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 76,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.accentStrong,
        borderRadius: 14,
        paddingVertical: 10,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        elevation: 8,
      }}
    >
      <ClockIcon size={16} color={colors.accent} />
      <Text numberOfLines={1} style={{ flex: 1, color: colors.text, fontWeight: '700', fontSize: 13 }}>
        {session.materiaNome}
      </Text>
      {status ? (
        <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600' }}>{status}</Text>
      ) : null}
      <Text style={{ color: colors.accent, fontWeight: '800', fontSize: 14 }}>{fmt(seconds)}</Text>
    </TouchableOpacity>
  );
}
