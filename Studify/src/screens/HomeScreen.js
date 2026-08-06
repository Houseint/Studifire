import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  StatusBar,
  Image,
} from 'react-native';

import styles from '../styles/screens/HomeScreenStyles';
import Icon from '../components/common/Icon';
import CardMateria from '../components/home/CardMateria';
import Secao from '../components/home/Secao';
import {
  HomeHeader,
  ProgressCards,
  MateriaSections,
  BottomNav,
  CreateMateriaModal,
  EditMateriaModal,
} from '../components/home';
import { filterRevisados, getEstaFixada, calcGlobalStats } from '../components/home/helpers';
import { useUserId } from '../hooks/useUserId';
import { getSessionUser, getUserById } from '../services/authDb';
import {
  carregarMaterias,
  criarMateria,
  atualizarMateria,
  getMateriaById,
  deletarMateria,
  toggleFixada as toggleFixadaDb,
} from '../services/subjectsDb';

export default function HomeScreen({ navigation }) {
  const userId = useUserId();
  const [user, setUser] = useState(null);
  const [userAvatar, setUserAvatar] = useState(null);
  const [revisados, setRevisados] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [fixados, setFixados] = useState([]);
  const [busca, setBusca] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [novaMateria, setNovaMateria] = useState('');
  const [novosTopicos, setNovosTopicos] = useState([]);
  const [topicoInput, setTopicoInput] = useState('');

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedMateria, setSelectedMateria] = useState(null);
  const [editNome, setEditNome] = useState('');
  const [editTopicos, setEditTopicos] = useState([]);
  const [editTopicoInput, setEditTopicoInput] = useState('');

  const MAX_TOPICOS = 10;

  useEffect(() => {
    getSessionUser().then(setUser);
    if (userId) {
      (async () => {
        try {
          const userData = await getUserById(userId);
          setUserAvatar(userData?.avatar ? `data:image/jpeg;base64,${userData.avatar}` : null);
        } catch (e) {
          console.error('Erro ao carregar avatar do usuário:', e);
        }
      })();
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const unsub = navigation.addListener('focus', loadHomeData);
    loadHomeData(); // carga inicial
    return unsub;
  }, [userId]);

  const loadHomeData = async () => {
    if (!userId) return;
    try {
      const [materias, userData] = await Promise.all([
        carregarMaterias(userId),
        getUserById(userId),
      ]);
      const revisadas = materias.filter((m) => !m.fixada);
      const fix = materias.filter((m) => m.fixada);
      setRevisados(revisadas);
      setFixados(fix);
      setHistorico(materias.sort((a, b) => new Date(b.accessed_at) - new Date(a.accessed_at)).slice(0, 10));
      if (userData?.avatar) {
        setUserAvatar(`data:image/jpeg;base64,${userData.avatar}`);
      }
    } catch (e) {
      console.error('Erro ao carregar home:', e);
    }
  };

  const adicionarMateria = async () => {
    if (!novaMateria.trim()) {
      Alert.alert('Atenção', 'Digite o nome da matéria!');
      return;
    }
    const topicosValidos = novosTopicos.filter((t) => t.nome.trim());
    try {
      const nova = await criarMateria(userId, novaMateria.trim(), topicosValidos);
      setRevisados((prev) => [nova, ...prev]);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar a matéria.');
    }
    setNovaMateria('');
    setNovosTopicos([]);
    setTopicoInput('');
    setModalVisible(false);
  };

  const acessarMateria = async (materia) => {
    try {
      await atualizarMateria(userId, materia.id, { accessed_at: new Date().toISOString() });
    } catch (e) {
      console.error('Erro ao atualizar accessed_at da matéria:', e);
    }
    setHistorico((prev) => {
      const semDuplicata = prev.filter((m) => m.id !== materia.id);
      return [materia, ...semDuplicata].slice(0, 10);
    });
  };

  const fixarMateria = async (materia) => {
    const jaFixada = fixados.find((m) => m.id === materia.id);
    try {
      await toggleFixadaDb(userId, materia.id, jaFixada);
      if (jaFixada) {
        setFixados((prev) => prev.filter((m) => m.id !== materia.id));
      } else {
        setFixados((prev) => [materia, ...prev]);
      }
    } catch (e) {
      console.error('Erro ao fixar matéria:', e);
    }
  };

  const openEditModal = (materia) => {
    setSelectedMateria(materia);
    setEditNome(materia.nome);
    setEditTopicos(materia.topicos ? [...materia.topicos] : []);
    setEditTopicoInput('');
    setEditModalVisible(true);
  };

  const updateMateria = (id, updates) => {
    const updateFn = (prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m));
    setRevisados(updateFn);
    setHistorico(updateFn);
    setFixados(updateFn);
  };

  const salvarEdicao = async () => {
    if (!editNome.trim()) {
      Alert.alert('Atenção', 'Digite o nome da matéria!');
      return;
    }
    const topicosValidos = editTopicos.filter((t) => t.nome.trim());
    await atualizarMateria(userId, selectedMateria.id, {
      nome: editNome.trim(),
      topicos: topicosValidos,
    });
    updateMateria(selectedMateria.id, {
      nome: editNome.trim(),
      topicos: topicosValidos,
    });
    setEditModalVisible(false);
    setSelectedMateria(null);
  };

  const deleteMateria = async (id) => {
    try {
      await deletarMateria(userId, id);
    } catch (e) {
      console.error('Erro ao deletar matéria:', e);
      return;
    }
    const filterFn = (prev) => prev.filter((m) => m.id !== id);
    setRevisados(filterFn);
    setHistorico(filterFn);
    setFixados(filterFn);
    setEditModalVisible(false);
    setSelectedMateria(null);
    setEditNome('');
    setEditTopicos([]);
    Alert.alert('Excluído', 'Matéria removida com sucesso!');
  };

  const toggleTopicoEstudado = async (materiaId, topicoIndex) => {
    const updateFn = (prev) =>
      prev.map((m) => {
        if (m.id !== materiaId) return m;
        const novosTopicos = m.topicos.map((t, i) =>
          i === topicoIndex ? { ...t, estudado: !t.estudado } : t
        );
        return { ...m, topicos: novosTopicos };
      });

    try {
      const materiaAtualizada = await getMateriaById(userId, materiaId);
      if (!materiaAtualizada) return;
      await atualizarMateria(userId, materiaId, { topicos: materiaAtualizada.topicos });
    } catch (e) {
      console.error('Erro ao atualizar tópico:', e);
      return;
    }

    setRevisados(updateFn);
    setHistorico(updateFn);
    setFixados(updateFn);
  };

  const revisadosFiltrados = filterRevisados(revisados, busca);

  const resetCreateModal = () => {
    setNovaMateria('');
    setNovosTopicos([]);
    setTopicoInput('');
    setModalVisible(true);
  };

  const { totalTopicosGeral, concluidosGeral } = calcGlobalStats(revisados, fixados);

  return (
    <View style={styles.main}>
      <StatusBar barStyle="light-content" backgroundColor="#090E1F" />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <HomeHeader
          user={user}
          userAvatar={userAvatar}
          onProfilePress={() => navigation?.navigate('Profile')}
          onHelpPress={() => navigation?.navigate('Help')}
        />

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

        <ProgressCards
          historico={historico}
          revisados={revisados}
          fixados={fixados}
          busca={busca}
        />

        <MateriaSections
          historico={historico}
          revisadosFiltrados={revisadosFiltrados}
          fixados={fixados}
          getEstaFixada={(m) => getEstaFixada(fixados, m)}
          onCardPress={openEditModal}
          onAcesso={acessarMateria}
          onPinPress={fixarMateria}
          navigation={navigation}
          busca={busca}
        />

        <View style={styles.scrollBottomSpace} />
      </ScrollView>

      <BottomNav navigation={navigation} onAddPress={resetCreateModal} />

      <CreateMateriaModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={adicionarMateria}
        novaMateria={novaMateria}
        setNovaMateria={setNovaMateria}
        novosTopicos={novosTopicos}
        setNovosTopicos={setNovosTopicos}
        topicoInput={topicoInput}
        setTopicoInput={setTopicoInput}
        MAX_TOPICOS={MAX_TOPICOS}
      />

      <EditMateriaModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        materia={selectedMateria}
        onSave={salvarEdicao}
        onDelete={deleteMateria}
        editNome={editNome}
        setEditNome={setEditNome}
        editTopicos={editTopicos}
        setEditTopicos={setEditTopicos}
        editTopicoInput={editTopicoInput}
        setEditTopicoInput={setEditTopicoInput}
        MAX_TOPICOS={MAX_TOPICOS}
      />
    </View>
  );
}