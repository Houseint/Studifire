import React, { useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { getSecaoStyles } from '../../styles/components/home/SecaoStyles.js';
import { useTheme } from '../../shared/theme/ThemeContext';

const Secao = ({ titulo, children, acaoBotao }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => getSecaoStyles(colors), [colors]);
  return (
  <View style={styles.secao}>
    <View style={styles.secaoHeader}>
      <Text style={styles.secaoTitulo}>{titulo}</Text>
      {acaoBotao}
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {children}
    </ScrollView>
  </View>
  );
};

export default Secao;
