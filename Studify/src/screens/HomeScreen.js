import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  StatusBar,
} from 'react-native';

import styles from '../styles/screens/HomeScreenStyles';
import Icon from '../components/common/Icon';
import CardMateria from '../components/home/CardMateria';
import Secao from '../components/home/Secao';

export default function HomeScreen({ navigation }) {
  const [revisados, setRevisados] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [fixados, setFixados] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedMateria, setSelectedMateria] = useState(null);
  const [busca, setBusca] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [novaMateria, setNovaMateria] = useState('');
  const [novaDescricao, setNovaDescricao] = useState('');

  const adicionarMateria = () => {
    if (!novaMateria.trim()) {
      Alert.alert('Atenção', 'Digite o nome da matéria!');
      return;
    }
    const nova = {
      id: Date.now(),
      nome: novaMateria.trim(),
      descricao: novaDescricao.trim(),
      fixada: false,
    };
    setRevisados((prev) => [nova, ...prev]);
    setNovaMateria('');
    setNovaDescricao('');
    setModalVisible(false);
  };

  const acessarMateria = (materia) => {
    setHistorico((prev) => {
      const semDuplicata = prev.filter((m) => m.id !== materia.id);
      return [materia, ...semDuplicata].slice(0, 10);
    });
  };

  const fixarMateria = (materia) => {
    const jaFixada = fixados.find((m) => m.id === materia.id);
    if (jaFixada) {
      setFixados((prev) => prev.filter((m) => m.id !== materia.id));
    } else {
      setFixados((prev) => [materia, ...prev]);
    }
  };

  const openEditModal = (materia) => {
    setSelectedMateria(materia);
    setNovaMateria(materia.nome);
    setNovaDescricao(materia.descricao || '');
    setEditModalVisible(true);
  };

  const updateMateria = (id, updates) => {
    const updateFn = (prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m));
    setRevisados(updateFn);
    setHistorico(updateFn);
    setFixados(updateFn);
  };

  const deleteMateria = (id) => {
    const filterFn = (prev) => prev.filter((m) => m.id !== id);
    setRevisados(filterFn);
    setHistorico(filterFn);
    setFixados(filterFn);
    setEditModalVisible(false);
    setSelectedMateria(null);
    setNovaMateria('');
    setNovaDescricao('');
    Alert.alert('Excluído', 'Matéria removida com sucesso!');
  };

  const revisadosFiltrados = revisados.filter(
    (m) =>
      m.nome.toLowerCase().includes(busca.toLowerCase()) ||
      m.descricao?.toLowerCase().includes(busca.toLowerCase())
  );

  const getEstaFixada = (materia) => !!fixados.find((m) => m.id === materia.id);

  return (
    <View style={styles.main}>
      <StatusBar barStyle="light-content" backgroundColor="#090E1F" />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topo}>
          <TouchableOpacity
            style={styles.perfilBtn}
            activeOpacity={0.8}
            onPress={() => navigation?.navigate('Profile')}
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>US</Text>
            </View>
            <View>
              <Text style={styles.saudacao}>Bom dia ☀</Text>
              <Text style={styles.perfilNome}>Username</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.helpBtn}
            activeOpacity={0.8}
            onPress={() => navigation?.navigate('Help')}
          >
            <Icon name="question" size={15} color="#9AA7D7" />
          </TouchableOpacity>
        </View>

        <View style={styles.buscaWrapper}>
          <Icon name="search" size={14} color="#5E6994" />
          <TextInput
            style={styles.buscaInput}
            placeholder="Pesquisar conteúdos..."
            placeholderTextColor="#5E6994"
            value={busca}
            onChangeText={setBusca}
            selectionColor="#7A6BFF"
          />
        </View>

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
            <Text style={styles.progressoValor}>{revisados.length}</Text>
            <Text style={styles.progressoMeta}>pendentes</Text>
            <View style={styles.progressoLinha} />
          </View>
        </View>

        <Secao titulo="ULTIMOS ACESSADOS">
          {historico.length === 0 ? (
            <Text style={styles.vazio}>Nenhum conteúdo acessado ainda.</Text>
          ) : (
            historico.map((m) => (
              <CardMateria
                key={m.id}
                materia={m}
                onCardPress={openEditModal}
                estaFixada={getEstaFixada(m)}
                onPinPress={() => fixarMateria(m)}
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
                onCardPress={openEditModal}
                onAcesso={acessarMateria}
                estaFixada={getEstaFixada(m)}
                onPinPress={() => fixarMateria(m)}
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
                onCardPress={openEditModal}
                onAcesso={acessarMateria}
                estaFixada={true}
                onPinPress={() => fixarMateria(m)}
              />
            ))
          )}
        </Secao>

        <View style={styles.scrollBottomSpace} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.8} onPress={() => navigation?.navigate('Home')}>
          <Text style={styles.navIcon}>⌂</Text>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Início</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} activeOpacity={0.8} onPress={() => setBusca('')}>
          <Text style={styles.navIcon}>⌕</Text>
          <Text style={styles.navLabel}>Explorar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, styles.navItemPlus]}
          activeOpacity={0.85}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.navPlusText}>+</Text>
          <Text style={styles.navLabel}>Adicionar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} activeOpacity={0.8} onPress={() => navigation?.navigate('Historic')}>
          <Text style={styles.navIcon}>↗</Text>
          <Text style={styles.navLabel}>Progresso</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} activeOpacity={0.8} onPress={() => navigation?.navigate('Profile')}>
          <Text style={styles.navIcon}>◌</Text>
          <Text style={styles.navLabel}>Perfil</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <TouchableOpacity style={styles.modalBox} activeOpacity={1}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Nova Matéria</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={{ color: '#5a6a7a', fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Nome da matéria *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ex: Matemática, Física..."
              placeholderTextColor="#5a6a7a"
              value={novaMateria}
              onChangeText={setNovaMateria}
              selectionColor="#6c8ebf"
            />

            <Text style={styles.modalLabel}>Descrição (opcional)</Text>
            <TextInput
              style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Tópicos, capítulos..."
              placeholderTextColor="#5a6a7a"
              value={novaDescricao}
              onChangeText={setNovaDescricao}
              multiline
              selectionColor="#6c8ebf"
            />

            <TouchableOpacity style={styles.modalConfirmar} onPress={adicionarMateria}>
              <Text style={styles.modalConfirmarText}>Adicionar</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setEditModalVisible(false)}>
          <TouchableOpacity style={styles.modalBox} activeOpacity={1}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Editar {selectedMateria?.nome || 'Matéria'}</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Text style={{ color: '#5a6a7a', fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Nome da matéria *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ex: Matemática, Física..."
              placeholderTextColor="#5a6a7a"
              value={novaMateria}
              onChangeText={setNovaMateria}
              selectionColor="#6c8ebf"
            />

            <Text style={styles.modalLabel}>Descrição (opcional)</Text>
            <TextInput
              style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Tópicos, capítulos..."
              placeholderTextColor="#5a6a7a"
              value={novaDescricao}
              onChangeText={setNovaDescricao}
              multiline
              selectionColor="#6c8ebf"
            />

            <TouchableOpacity
              style={[styles.modalConfirmar, { backgroundColor: '#6c9fd4' }]}
              onPress={() => {
                if (!novaMateria.trim()) {
                  Alert.alert('Atenção', 'Digite o nome da matéria!');
                  return;
                }
                updateMateria(selectedMateria.id, {
                  nome: novaMateria.trim(),
                  descricao: novaDescricao.trim(),
                });
                setEditModalVisible(false);
                setSelectedMateria(null);
              }}
            >
              <Text style={styles.modalConfirmarText}>Salvar Alterações</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.excluirBtn}
              onPress={() =>
                Alert.alert('Confirmar exclusão', 'Esta matéria será removida de todas as seções.', [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: () => deleteMateria(selectedMateria.id),
                  },
                ])
              }
            >
              <Text style={styles.excluirBtnText}>Excluir Matéria</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
