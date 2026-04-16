import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SecaoStyles } from '../../styles/components/home/SecaoStyles.js';

const Secao = ({ titulo, icone, children, acaoBotao }) => (
  <View style={styles.secao}>
    <View style={styles.secaoHeader}>
      <Text style={styles.secaoTitulo}>
        {icone} {titulo}
      </Text>
      {acaoBotao}
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {children}
    </ScrollView>
  </View>
);

export default Secao;
