import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { CardMateriaStyles as styles } from '../../styles/components/home/CardMateriaStyles.js';

const THEMES = [
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

const pickTheme = (materia) => {
  const idNum = Number(materia?.id || 0);
  return THEMES[Math.abs(idNum) % THEMES.length];
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
  const theme = pickTheme(materia);
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
