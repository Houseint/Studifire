import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  StatusBar,
  Image,
} from "react-native";

import { HomeScreenStyles as styles } from './styles/HomeScreenStyles.js';

// ─── ÍCONES SIMPLES (substitua por <Image source={require(...)} /> se quiser) ───
const Icon = ({ name, size = 24, color = "#fff" }) => {
  const icons = {
    menu: "☰",
    search: "🔍",
    download: "⬇️",
    plus: "+",
    clock: "🕐",
    pin: "📌",
    question: "?",
    user: "👤",
    book: "📚",
    close: "✕",
    unpin: "📌",
  };
  return <Text style={{ fontSize: size, color }}>{icons[name] || "?"}</Text>;
};

export default function HomeScreen({ navigation }) {
  // ─── ESTADO ───────────────────────────────────────────────────────────────
const [revisados, setRevisados] = useState([]); // conteúdos para revisão
  const [historico, setHistorico] = useState([]); // últimos acessados
  const [fixados, setFixados] = useState([]); // fixados
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedMateria, setSelectedMateria] = useState(null);
  const [busca, setBusca] = useState(""); // filtro de busca
  const [modalVisible, setModalVisible] = useState(false);
  const [novaMateria, setNovaMateria] = useState("");
  const [novaDescricao, setNovaDescricao] = useState("");

  // ─── LÓGICA ───────────────────────────────────────────────────────────────
  const adicionarMateria = () => {
    if (!novaMateria.trim()) {
      Alert.alert("Atenção", "Digite o nome da matéria!");
      return;
    }
    const nova = {
      id: Date.now(),
      nome: novaMateria.trim(),
      descricao: novaDescricao.trim(),
      fixada: false,
    };
    setRevisados((prev) => [nova, ...prev]);
    setNovaMateria("");
    setNovaDescricao("");
    setModalVisible(false);
  };

  const acessarMateria = (materia) => {
    // adiciona ao histórico sem duplicar
    setHistorico((prev) => {
      const semDuplicata = prev.filter((m) => m.id !== materia.id);
      return [materia, ...semDuplicata].slice(0, 10); // máx 10 no histórico
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
    const updateFn = (prev) => prev.map(m => m.id === id ? {...m, ...updates} : m);
    setRevisados(updateFn);
    setHistorico(updateFn);
    setFixados(updateFn);
  };

  const deleteMateria = (id) => {
    const filterFn = (prev) => prev.filter(m => m.id !== id);
    setRevisados(filterFn);
    setHistorico(filterFn);
    setFixados(filterFn);
    setEditModalVisible(false);
    setSelectedMateria(null);
    setNovaMateria('');
    setNovaDescricao('');
    Alert.alert("Excluído", "Matéria removida com sucesso!");
  };

  const revisadosFiltrados = revisados.filter(
    (m) =>
      m.nome.toLowerCase().includes(busca.toLowerCase()) ||
      m.descricao.toLowerCase().includes(busca.toLowerCase())
  );

  // ─── CARD DE MATÉRIA ──────────────────────────────────────────────────────
  const CardMateria = ({
    materia,
    mostrarFixar = false,
    mostrarAcesso = false,
    onCardPress,
  }) => {
    const estaFixada = fixados.find((m) => m.id === materia.id);
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => {
          onCardPress?.(materia);
          if (mostrarAcesso) acessarMateria(materia);
        }}
      >
        <View style={styles.cardTop}>
          <Text style={styles.cardNome} numberOfLines={1}>
            {materia.nome}
          </Text>
          {mostrarFixar && (
            <TouchableOpacity
              onPress={() => fixarMateria(materia)}
              style={styles.pinBtn}
            >
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
  };

  // ─── SEÇÃO ────────────────────────────────────────────────────────────────
  const Secao = ({ titulo, icone, children, acaoBotao }) => (
    <View style={styles.secao}>
      <View style={styles.secaoHeader}>
        <Text style={styles.secaoTitulo}>
          {icone} {titulo}
        </Text>
        {acaoBotao}
      </View>
      {children}
    </View>
  );

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <View style={styles.main}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1e24" />

      {/* ── TOPO ── */}
      <View style={styles.topo}>
        <TouchableOpacity
          style={styles.perfilBtn}
          activeOpacity={0.7}
          onPress={() => navigation?.navigate("Perfil")}
        >
          <View style={styles.avatarCircle}>
            <Icon name="user" size={20} color="#a0b4c8" />
          </View>
          <Text style={styles.perfilNome}>Hello, User!</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.helpBtn}
          activeOpacity={0.7}
          onPress={() => Alert.alert("Ajuda", "Página de ajuda em breve!")}
        >
          <Text style={styles.helpText}>?</Text>
        </TouchableOpacity>
      </View>

      {/* ── BUSCA ── */}
      <View style={styles.buscaWrapper}>
        <Text style={styles.buscaIcone}>🔍</Text>
        <TextInput
          style={styles.buscaInput}
          placeholder="Pesquisar matérias..."
          placeholderTextColor="#5a6a7a"
          value={busca}
          onChangeText={setBusca}
          selectionColor="#6c8ebf"
        />
        {busca.length > 0 && (
          <TouchableOpacity onPress={() => setBusca("")}>
            <Text style={{ color: "#5a6a7a", fontSize: 16, paddingRight: 12 }}>
              ✕
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── CONTEÚDO PRINCIPAL ── */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Últimos acessados */}
        <Secao titulo="Últimos conteúdos acessados" icone="🕐">
          {historico.length === 0 ? (
            <Text style={styles.vazio}>Nenhum conteúdo acessado ainda.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
{historico.map((m) => (
                <CardMateria key={m.id} materia={m} onCardPress={openEditModal} />
              ))}
            </ScrollView>
          )}
        </Secao>

        {/* Para serem revisados */}
        <Secao
          titulo="Conteúdos para serem revisados"
          icone="🔍"
        >
          {revisadosFiltrados.length === 0 ? (
            <Text style={styles.vazio}>
              {busca
                ? "Nenhuma matéria encontrada."
                : "Nenhuma matéria adicionada ainda."}
            </Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
{revisadosFiltrados.map((m) => (
                <CardMateria
                  key={m.id}
                  materia={m}
                  mostrarFixar
                  mostrarAcesso
                  onCardPress={openEditModal}
                />
              ))}
            </ScrollView>
          )}
        </Secao>

        {/* Fixados */}
        <Secao titulo="Conteúdos fixados" icone="📌">
          {fixados.length === 0 ? (
            <Text style={styles.vazio}>Fixe uma matéria clicando no 📌</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
{fixados.map((m) => (
                <CardMateria key={m.id} materia={m} mostrarAcesso onCardPress={openEditModal} />
              ))}
            </ScrollView>
          )}
        </Secao>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── BARRA INFERIOR ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.bottomBtn, styles.bottomBtnPrincipal]}
          activeOpacity={0.7}
          onPress={() => setModalVisible(true)}
        >
          <Text style={[styles.bottomIcon, { fontSize: 28, color: "#1a1e24" }]}>
            + {/* Adicionar o icone de adicionar aqui */}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomBtn}
          activeOpacity={0.7}
          onPress={() => navigation?.navigate("Historico")}
        >
          <Text style={styles.bottomIcon}>🕐</Text>
        </TouchableOpacity>
      </View>

      {/* ── MODAL ADICIONAR MATÉRIA ── */}
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
              style={[
                styles.modalInput,
                { height: 80, textAlignVertical: "top" },
              ]}
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

      {/* ── MODAL EDITAR MATÉRIA ── */}
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
              <Text style={styles.modalTitulo}>Editar {selectedMateria?.nome || 'Matéria'}</Text>
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
              style={[
                styles.modalInput,
                { height: 80, textAlignVertical: "top" },
              ]}
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
                  descricao: novaDescricao.trim()
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
                alignItems: "center",
                marginTop: 12,
              }}
              onPress={() => Alert.alert(
                "Confirmar exclusão",
                "Esta matéria será removida de todas as seções.",
                [
                  {text: "Cancelar", style: 'cancel'},
                  {text: "Excluir", style: 'destructive', onPress: () => deleteMateria(selectedMateria.id)}
                ]
              )}
            >
              <Text style={{
                color: "#ffffff",
                fontSize: 16,
                fontWeight: "800",
                letterSpacing: 0.5,
              }}>Excluir Matéria</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};
