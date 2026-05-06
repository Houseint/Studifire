import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { CardMateriaStyles } from '../../styles/components/home/CardMateriaStyles.js';

const CardMateria = ({
  materia,
  mostrarFixar = false,
  mostrarAcesso = false,
  onCardPress,
  estaFixada,
  onPinPress,
}) => (
  <TouchableOpacity
    style={styles.card}
    activeOpacity={0.8}
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
        <TouchableOpacity onPress={onPinPress} style={styles.pinBtn}>
          <Text style={{ fontSize: 16, opacity: estaFixada ? 1 : 0.3 }}>
            📌
          </Text>
        </TouchableOpacity>
      )}
    </View>
    {materia.descricao ? (
      <Text style={styles.cardDesc} numberOfLines={2}>
        {materia.descricao}
      </Text>
    ) : null}
  </TouchableOpacity>
);

export default CardMateria;
