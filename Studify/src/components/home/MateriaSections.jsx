import React, { useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import Secao from './Secao';
import CardMateria from './CardMateria';
import { getMateriaSectionsStyles } from '../../styles/components/home/MateriaSectionsStyles';
import { filterRevisados } from './helpers';
import { useTheme } from '../../shared/theme/ThemeContext';

const MateriaSections = ({
  historico,
  revisadosFiltrados,
  fixados,
  getEstaFixada,
  onCardPress,
  onAcesso,
  onPinPress,
  navigation,
  busca = '',
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => getMateriaSectionsStyles(colors), [colors]);
  const historicoFiltrado = filterRevisados(historico, busca);
  const fixadosFiltrados = filterRevisados(fixados, busca);
  return (
  <>
    <Secao titulo="ULTIMOS ACESSADOS">
      {historicoFiltrado.length === 0 ? (
        <Text style={styles.vazio}>
          {busca ? 'Nenhuma matéria encontrada.' : 'Nenhum conteúdo acessado ainda.'}
        </Text>
      ) : (
        historicoFiltrado.map((m) => (
          <CardMateria
            key={m.id}
            materia={m}
            onCardPress={onCardPress}
            estaFixada={getEstaFixada(m)}
            onPinPress={() => onPinPress(m)}
          />
        ))
      )}
    </Secao>

    <Secao titulo="PARA REVISAR">
      {revisadosFiltrados.length === 0 ? (
        <Text style={styles.vazio}>
          {busca ? 'Nenhuma matéria encontrada.' : 'Nenhuma matéria adicionada ainda.'}
        </Text>
      ) : (
        revisadosFiltrados.map((m) => (
          <CardMateria
            key={m.id}
            materia={m}
            mostrarFixar
            mostrarAcesso
            onCardPress={() => navigation.navigate('Detail', { id: m.id })}
            onAcesso={onAcesso}
            estaFixada={getEstaFixada(m)}
            onPinPress={() => onPinPress(m)}
          />
        ))
      )}
    </Secao>

    <Secao titulo="FIXADOS">
      {fixadosFiltrados.length === 0 ? (
        <Text style={styles.vazio}>
          {busca ? 'Nenhuma matéria encontrada.' : 'Fixe uma matéria clicando no pin.'}
        </Text>
      ) : (
        fixadosFiltrados.map((m) => (
          <CardMateria
            key={m.id}
            materia={m}
            mostrarAcesso
            onCardPress={() => navigation.navigate('Detail', { id: m.id })}
            onAcesso={onAcesso}
            estaFixada={true}
            onPinPress={() => onPinPress(m)}
          />
        ))
      )}
    </Secao>
  </>
  );
};

export default MateriaSections;