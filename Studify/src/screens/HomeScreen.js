import React, { useState, useEffect } from 'react';
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
import { useUserId } from '../hooks/useUserId';
import {
  carregarMaterias,
  criarMateria,
  atualizarMateria,
  deletarMateria,
  toggleFixada as toggleFixadaDb,
} from '../services/subjectsDb';

const TopicoItem = ({ nome, onRemove }) => (
  <View style={styles.topicoChip}>
    <Text style={styles.topicoChipText}>{nome}</Text>
    <TouchableOpacity onPress={onRemove} style={styles.topicoChipRemove}>
      <Text style={styles.topicoChipRemoveText}>✕</Text>
    </TouchableOpacity>
  </View>
);



export default function HomeScreen({ navigation }) {
  const userId = useUserId();
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
    if (!userId) return;
    (async () => {
      try {
        const materias = await carregarMaterias(userId);
        const revisadas = materias.filter((m) => !m.fixada);
        const fix = materias.filter((m) => m.fixada);
        setRevisados(revisadas);
        setFixados(fix);
      } catch (e) {
        console.error('Erro ao carregar matérias:', e);
      }
    })();
  }, [userId]);

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

  const acessarMateria = (materia) => {
    setHistorico((prev) => {
      const semDuplicata = prev.filter((m) => m.id !== materia.id);
      return [materia, ...semDuplicata].slice(0, 10);
    });
  };

  const fixarMateria = async (materia) => {
    const jaFixada = fixados.find((m) => m.id === materia.id);
    try {
      await toggleFixadaDb(userId, materia.id, jaFixada);
    } catch (e) {
      console.error('Erro ao fixar matéria:', e);
    }
    if (jaFixada) {
      setFixados((prev) => prev.filter((m) => m.id !== materia.id));
    } else {
      setFixados((prev) => [materia, ...prev]);
    }
  };

  const openEditModal = (materia) => {
    setSelectedMateria(materia);
    setEditNome(materia.nome);
    setEditTopicos(materia.topicos ? [...materia.topicos] : []);
    setEditTopicoInput('');
    setEditModalVisible(true);
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

  const updateMateria = (id, updates) => {
    const updateFn = (prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m));
    setRevisados(updateFn);
    setHistorico(updateFn);
    setFixados(updateFn);
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
    const toggleFn = (prev) =>
      prev.map((m) => {
        if (m.id !== materiaId) return m;
        const novosTopicos = m.topicos.map((t, i) =>
          i === topicoIndex ? { ...t, estudado: !t.estudado } : t
        );
        return { ...m, topicos: novosTopicos };
      });
    const materia = [...revisados, ...fixados].find((m) => m.id === materiaId);
    if (materia) {
      const novosTopicos = materia.topicos.map((t, i) =>
        i === topicoIndex ? { ...t, estudado: !t.estudado } : t
      );
      try {
        await atualizarMateria(userId, materiaId, { topicos: novosTopicos });
      } catch (e) {
        console.error('Erro ao atualizar tópico:', e);
        return;
      }
    }
    setRevisados(toggleFn);
    setHistorico(toggleFn);
    setFixados(toggleFn);
  };

  const revisadosFiltrados = revisados.filter((m) => {
    const q = busca.toLowerCase();
    if (m.nome.toLowerCase().includes(q)) return true;
    return m.topicos?.some((t) => t.nome.toLowerCase().includes(q));
  });

  const getEstaFixada = (materia) => !!fixados.find((m) => m.id === materia.id);

  const totalTopicosGeral = revisados.reduce((acc, m) => acc + (m.topicos?.length || 0), 0);
  const concluidosGeral = revisados.reduce(
    (acc, m) => acc + (m.topicos?.filter((t) => t.estudado).length || 0),
    0
  );

  const resetCreateModal = () => {
    setNovaMateria('');
    setNovosTopicos([]);
    setTopicoInput('');
    setModalVisible(true);
  };

  const renderTopicoInput = (value, onChangeText, onAdd, list, setList) => (
    <View>
      <Text style={styles.modalLabel}>
        Tópicos ({list.length}/{MAX_TOPICOS})
      </Text>
      <View style={styles.topicoInputRow}>
        <TextInput
          style={[styles.modalInput, styles.topicoInputField]}
          placeholder="Ex: Álgebra Linear"
          placeholderTextColor="#5a6a7a"
          value={value}
          onChangeText={onChangeText}
          selectionColor="#6c8ebf"
          onSubmitEditing={onAdd}
          returnKeyType="next"
        />
        <TouchableOpacity
          style={[styles.topicoAddBtn, list.length >= MAX_TOPICOS && styles.topicoAddBtnDisabled]}
          onPress={onAdd}
          disabled={list.length >= MAX_TOPICOS}
        >
          <Text style={styles.topicoAddBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      {list.length > 0 && (
        <View style={styles.topicoChipsContainer}>
          {list.map((t, i) => (
            <TopicoItem
              key={i}
              nome={t.nome || `Tópico ${i + 1}`}
              onRemove={() => setList((prev) => prev.filter((_, idx) => idx !== i))}
            />
          ))}
        </View>
      )}
    </View>
  );

  const renderEditTopicoInput = () => (
    <View>
      <Text style={styles.modalLabel}>
        Tópicos ({editTopicos.length}/{MAX_TOPICOS})
      </Text>
      <View style={styles.topicoInputRow}>
        <TextInput
          style={[styles.modalInput, styles.topicoInputField]}
          placeholder="Ex: Álgebra Linear"
          placeholderTextColor="#5a6a7a"
          value={editTopicoInput}
          onChangeText={setEditTopicoInput}
          selectionColor="#6c8ebf"
          returnKeyType="next"
        />
        <TouchableOpacity
          style={[styles.topicoAddBtn, editTopicos.length >= MAX_TOPICOS && styles.topicoAddBtnDisabled]}
          onPress={() => {
            if (editTopicoInput.trim() && editTopicos.length < MAX_TOPICOS) {
              setEditTopicos((prev) => [...prev, { nome: editTopicoInput.trim(), estudado: false }]);
              setEditTopicoInput('');
            }
          }}
          disabled={editTopicos.length >= MAX_TOPICOS}
        >
          <Text style={styles.topicoAddBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      {editTopicos.length > 0 && (
        <View style={styles.topicoChipsContainer}>
          {editTopicos.map((t, i) => (
            <TopicoItem
              key={i}
              nome={t.nome || `Tópico ${i + 1}`}
              onRemove={() => setEditTopicos((prev) => prev.filter((_, idx) => idx !== i))}
            />
          ))}
        </View>
      )}
    </View>
  );

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
            <Text style={styles.progressoValor}>
              {totalTopicosGeral > 0
                ? `${Math.round((concluidosGeral / totalTopicosGeral) * 100)}%`
                : '0%'}
            </Text>
            <Text style={styles.progressoMeta}>
              {concluidosGeral}/{totalTopicosGeral} tópicos
            </Text>
            <View style={styles.progressoLinha}>
              <View
                style={[
                  styles.progressoLinhaFill,
                  {
                    width: totalTopicosGeral > 0 ? `${(concluidosGeral / totalTopicosGeral) * 100}%` : '0%',
                  },
                ]}
              />
            </View>
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
                onCardPress={() => navigation.navigate('Detail', { id: m.id })}
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
                onCardPress={() => navigation.navigate('Detail', { id: m.id })}
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

        <TouchableOpacity style={styles.navItem} activeOpacity={0.8} onPress={() => navigation?.navigate('Chat')}>
          <Text style={styles.navIcon}>🤖</Text>
          <Text style={styles.navLabel}>IA</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, styles.navItemPlus]}
          activeOpacity={0.85}
          onPress={resetCreateModal}
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

            {renderTopicoInput(
              topicoInput,
              setTopicoInput,
              () => {
                if (topicoInput.trim() && novosTopicos.length < MAX_TOPICOS) {
                  setNovosTopicos((prev) => [...prev, { nome: topicoInput.trim(), estudado: false }]);
                  setTopicoInput('');
                }
              },
              novosTopicos,
              setNovosTopicos
            )}

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
              value={editNome}
              onChangeText={setEditNome}
              selectionColor="#6c8ebf"
            />

            {renderEditTopicoInput()}

            <TouchableOpacity
              style={[styles.modalConfirmar, { backgroundColor: '#6c9fd4' }]}
              onPress={salvarEdicao}
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
