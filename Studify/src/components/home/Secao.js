import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { getSecaoStyles } from '../../styles/components/home/SecaoStyles.js';
import { useTheme } from '../../shared/theme/ThemeContext';

const Secao = ({ titulo, children, acaoBotao }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => getSecaoStyles(colors), [colors]);
  const scrollRef = useRef(null);
  const quantidadeItens = React.Children.count(children);

  useEffect(() => {
    // Ao adicionar um item no início da lista, volta para o começo para
    // que a nova matéria fique visível mesmo se a seção estava rolada.
    scrollRef.current?.scrollTo?.({ x: 0, animated: false });
  }, [quantidadeItens]);

  return (
  <View style={styles.secao}>
    <View style={styles.secaoHeader}>
      <Text style={styles.secaoTitulo}>{titulo}</Text>
      {acaoBotao}
    </View>
    <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator={false}>
      {children}
    </ScrollView>
  </View>
  );
};

export default Secao;
