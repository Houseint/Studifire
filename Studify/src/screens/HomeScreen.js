import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  StatusBar,
} from 'react-native';

import { HomeScreenStyles } from '../styles/HomeScreenStyles.js';
import Icon from '../components/common/Icon';
import CardMateria from '../components/home/CardMateria';
import Secao from '../components/home/Secao';

export default function HomeScreen({ navigation }) {
  // ─── ESTADO ───────────────────────────────────────────────────────────────
  const [revisados, setRevisados] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [fixados, setFixados] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedMateria, setSelectedMateria] = useState(null);
  const [busca, setBusca] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [novaMateria, setNovaMateria] = useState('');
  const [novaDescricao, setNovaDescricao] = useState('');

  // ─── LÓGICA (unchanged from original) ─────────────────────────────────────
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

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <View style={styles.main}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1e24" />

      {/* ── TOPO ── */}
      <View style={styles.topo}>
        <TouchableOpacity
          style={styles.perfilBtn}
          activeOpacity={0.7}
          onPress={() => navigation?.navigate('Perfil')}
        >
          <View style={styles.avatarCircle}>
            <Icon name="user" size={20} color="#a0b4c8" />
          </View>
          <Text style={styles.perfilNome}>Hello, User!</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.helpBtn}
          activeOpacity={0.7}
          onPress={() => Alert.alert('Ajuda', 'Página de ajuda em breve!')}
        >
          <Icon name="question" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── BUSCA ── */}
      <View style={styles.buscaWrapper}>
        <Icon name="search" size={16} color="#5a6a7a" />
        <TextInput
          style={styles.buscaInput}
          placeholder="Pesquisar matérias..."
          placeholderTextColor="#5a6a7a"
          value={busca}
          onChangeText={setBusca}
          selectionColor="#6c8ebf"
        />
        {busca.length > 0 && (
          <TouchableOpacity onPress={() => setBusca('')}>
            <Text style={{ color: '#5a6a7a', fontSize: 16, paddingRight: 12 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── CONTEÚDO ── */}
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Últimos acessados */}
        <Secao titulo="Últimos conteúdos acessados" icone="🕐">
          {historico.length === 0 ? (
            <Text style={styles.vazio}>Nenhum conteúdo acessado ainda.</Text>
          ) : (
            historico.map((m) => (
              <CardMateria
                key={m.id}
                materia={m}
                onCardPress={openEditModal}
                estaFixada={getEstaFixada(m)}
                onPinPress={() => {}}
              />
            ))
          )}
        </Secao>

        {/* Para revisar */}
        <Secao titulo="Conteúdos para serem revisados" icone="🔍">
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

        {/* Fixados */}
        <Secao titulo="Conteúdos fixados" icone="📌">
          {fixados.length === 0 ? (
            <Text style={styles.vazio}>Fixe uma matéria clicando no 📌</Text>
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

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── BOTTOM BAR ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.bottomBtn, styles.bottomBtnPrincipal]}
          activeOpacity={0.7}
          onPress={() => setModalVisible(true)}
        >
          <Text style={[styles.bottomIcon, { fontSize: 28, color: '#1a1e24' }]}>
            +
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bottomBtn}
          activeOpacity={0.7}
          onPress={() => navigation?.navigate('Historico')}
        >
          <Icon name="clock" size={22} />
        </TouchableOpacity>
      </View>

      {/* MODAL ADICIONAR MATÉRIA */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <TouchableOpacity style={styles.modalBox} activeOpacity={1}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Nova Matéria</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={{ color: "#5a6a7a", fontSize: 20 }}>✕</Text>
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
              style={[styles.modalInput, { height: 80, textAlignVertical: "top" }]}
              placeholder="Tópicos, capítulos..."
              placeholderTextColor="#5a6a7a"
              value={novaDescricao}
              onChangeText={setNovaDescricao}
              multiline
              selectionColor="#6c8ebf"
            />

            <TouchableOpacity
              style={styles.modalConfirmar}
              onPress={adicionarMateria}
            >
              <Text style={styles.modalConfirmarText}>Adicionar</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* MODAL EDITAR MATÉRIA */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setEditModalVisible(false)}
        >
          <TouchableOpacity style={styles.modalBox} activeOpacity={1}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>
                Editar {selectedMateria?.nome || 'Matéria'}
              </Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Text style={{ color: "#5a6a7a", fontSize: 20 }}>✕</Text>
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
              style={[styles.modalInput, { height: 80, textAlignVertical: "top" }]}
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
                  Alert.alert("Atenção", "Digite o nome da matéria!");
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
              style={{
                backgroundColor: '#d32f2f',
                borderRadius: 14,
                paddingVertical: 15,
                alignItems: 'center',
                marginTop: 12,
              }}
              onPress={() =>
                Alert.alert(
                  'Confirmar exclusão',
                  'Esta matéria será removida de todas as seções.',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Excluir',
                      style: 'destructive',
                      onPress: () => deleteMateria(selectedMateria.id),
                    },
                  ]
                )
              }
            >
              <Text
                style={{
                  color: '#ffffff',
                  fontSize: 16,
                  fontWeight: '800',
                  letterSpacing: 0.5,
                }}
              >
                Excluir Matéria
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

