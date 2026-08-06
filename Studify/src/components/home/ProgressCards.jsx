import React from 'react';
import { View, Text } from 'react-native';
import { ProgressCardsStyles as styles } from '../../styles/components/home/ProgressCardsStyles';
import { calcGlobalStats } from './helpers';

const ProgressCards = ({ historico, revisados, fixados, busca }) => {
  const { totalTopicos, concluidos } = calcGlobalStats(revisados, fixados);
  const progressoPct = totalTopicos > 0 ? Math.round((concluidos / totalTopicos) * 100) : 0;

  return (
    <>
      <Text style={styles.sectionHeading}>SEU PROGRESSO</Text>
      <View style={styles.progressoRow}>
        <View style={[styles.progressoCard, styles.progressoCardRoxo]}>
          <Text style={styles.progressoLabel}>Conteúdos vistos</Text>
          <Text style={styles.progressoValor}>{historico.length}</Text>
          <Text style={styles.progressoMeta}>esta semana</Text>
          <View style={styles.progressoLinha} />
        </View>
        <View style={[styles.progressoCard, styles.progressoCardLaranja]}>
          <Text style={styles.progressoLabel}>Para revisar</Text>
          <Text style={styles.progressoValor}>{progressoPct}%</Text>
          <Text style={styles.progressoMeta}>{concluidos}/{totalTopicos} tópicos</Text>
          <View style={styles.progressoLinha}>
            <View style={[styles.progressoLinhaFill, { width: `${progressoPct}%` }]} />
          </View>
        </View>
      </View>
    </>
  );
};

export default ProgressCards;