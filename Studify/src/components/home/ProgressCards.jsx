import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { getProgressCardsStyles } from '../../styles/components/home/ProgressCardsStyles';
import { useTheme } from '../../shared/theme/ThemeContext';
import { getDueTopics } from '../../shared/utils/fsrs';

const ProgressCards = ({ historico = [], revisados = [], fixados = [], materias, onPressReview }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => getProgressCardsStyles(colors), [colors]);
  const allMaterias = Array.isArray(materias) && materias.length > 0
    ? materias
    : [...revisados, ...fixados];
  const dueCount = getDueTopics(allMaterias).length;

  return (
    <>
      <Text style={styles.sectionHeading}>SEU PROGRESSO</Text>
      <View style={styles.progressoRow}>
        <View style={[styles.progressoCard, styles.progressoCardRoxo]}>
          <Text style={styles.progressoLabel}>Conteúdos vistos</Text>
          <Text style={styles.progressoValor}>{historico.length}</Text>
          <Text style={styles.progressoMeta}>matérias recentes</Text>
        </View>
        <TouchableOpacity
          style={[styles.progressoCard, styles.progressoCardLaranja]}
          activeOpacity={dueCount > 0 ? 0.8 : 1}
          onPress={dueCount > 0 ? onPressReview : undefined}
          disabled={dueCount === 0 || !onPressReview}
        >
          <Text style={styles.progressoLabel}>Para revisar</Text>
          <Text style={styles.progressoValor}>{dueCount}</Text>
          <Text style={styles.progressoMeta}>
            {dueCount > 0 ? 'tópicos vencidos hoje' : 'nada vencido hoje'}
          </Text>
          {dueCount > 0 && <Text style={styles.progressoHint}>Toque para revisar →</Text>}
        </TouchableOpacity>
      </View>
    </>
  );
};

export default ProgressCards;
