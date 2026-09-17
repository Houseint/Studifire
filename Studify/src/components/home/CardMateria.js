import React, { useMemo } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { getCardMateriaStyles } from '../../styles/components/home/CardMateriaStyles.js';
import { useTheme } from '../../shared/theme/ThemeContext';

const THEMES_DARK = [
  {
    backgroundColor: '#151C45',
    borderColor: '#2D3C84',
    pinBg: '#212D66',
    progress: '#5B7CFF',
  },
  {
    backgroundColor: '#143B3A',
    borderColor: '#1C5D5A',
    pinBg: '#1B4C4A',
    progress: '#2DD4BF',
  },
  {
    backgroundColor: '#3D1B2A',
    borderColor: '#6C2742',
    pinBg: '#552034',
    progress: '#F472B6',
  },
  {
    backgroundColor: '#3A2A17',
    borderColor: '#6A4B1F',
    pinBg: '#51381A',
    progress: '#F59E0B',
  },
];

// Teste A/B de cor — variação 1: lilás (light usa tons claros p/ texto marinho ficar legível)
const THEMES_LIGHT = [
  {
    backgroundColor: '#E7E1FA',
    borderColor: '#C4B5F2',
    pinBg: '#D8CFF5',
    progress: '#8A68FF',
  },
  {
    backgroundColor: '#DED4F8',
    borderColor: '#B3A1EC',
    pinBg: '#CBC0F3',
    progress: '#6F52FF',
  },
  {
    backgroundColor: '#F0EBFD',
    borderColor: '#D3C8F6',
    pinBg: '#E4DCF9',
    progress: '#9D86F5',
  },
  {
    backgroundColor: '#E2D9F9',
    borderColor: '#BCAEF0',
    pinBg: '#D2C6F5',
    progress: '#7C63F0',
  },
];

export const pickTheme = (materia, mode = 'dark') => {
  const pool = mode === 'light' ? THEMES_LIGHT : THEMES_DARK;
  const idNum = Number(materia?.id || 0);
  return pool[Math.abs(idNum) % pool.length];
};

const isUrgent = (materia) => {
  const text = `${materia?.nome || ''} ${materia?.descricao || ''}`.toLowerCase();
  return text.includes('urgente') || text.includes('hoje') || text.includes('prazo');
};

const CardMateria = ({
  materia,
  mostrarFixar = false,
  mostrarAcesso = false,
  onCardPress,
  onAcesso,
  estaFixada,
  onPinPress,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => getCardMateriaStyles(colors), [colors]);
  const theme = pickTheme(materia, colors.mode);
  const urgent = isUrgent(materia);

  const topicos = materia.topicos || [];
  const totalTopicos = topicos.length;
  const concluidos = topicos.filter((t) => t.estudado).length;
  const progresso = totalTopicos > 0 ? concluidos / totalTopicos : 0;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.backgroundColor, borderColor: theme.borderColor }]}
      activeOpacity={0.85}
      onPress={() => {
        onCardPress?.(materia);
        if (mostrarAcesso) onAcesso?.(materia);
      }}
    >
      <View style={styles.cardTop}>
        <Text style={styles.cardNome} numberOfLines={1}>
          {materia.nome}
        </Text>
        {mostrarFixar && (
          <TouchableOpacity onPress={onPinPress} style={[styles.pinBtn, { backgroundColor: theme.pinBg }]}>
            <Text style={{ fontSize: 13, opacity: estaFixada ? 1 : 0.45 }}>📌</Text>
          </TouchableOpacity>
        )}
      </View>

      {urgent ? <Text style={styles.urgentBadge}>Urgente</Text> : null}

      {totalTopicos > 0 ? (
        <Text style={styles.cardDesc} numberOfLines={2}>
          {concluidos}/{totalTopicos} tópicos
        </Text>
      ) : null}

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progresso * 100}%`, backgroundColor: theme.progress }]} />
      </View>
    </TouchableOpacity>
  );
};

export default CardMateria;
