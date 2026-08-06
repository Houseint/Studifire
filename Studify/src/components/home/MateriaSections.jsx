import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import Secao from './Secao';
import CardMateria from './CardMateria';
import { MateriaSectionsStyles as styles } from '../../styles/components/home/MateriaSectionsStyles';

const MateriaSections = ({
  historico,
  revisadosFiltrados,
  fixados,
  getEstaFixada,
  onCardPress,
  onAcesso,
  onPinPress,
  navigation,
  busca,
}) => (
  <>
    <Secao titulo="ULTIMOS ACESSADOS">
      {historico.length === 0 ? (
        <Text style={styles.vazio}>Nenhum conteúdo acessado ainda.</Text>
      ) : (
        historico.map((m) => (
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
      {fixados.length === 0 ? (
        <Text style={styles.vazio}>Fixe uma matéria clicando no pin.</Text>
      ) : (
        fixados.map((m) => (
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

export default MateriaSections;