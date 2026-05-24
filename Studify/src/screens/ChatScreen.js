import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StatusBar, KeyboardAvoidingView, Platform, StyleSheet,
  Modal, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { enviarMensagem } from '../services/aiService';
import {
  criarConversa,
  listarConversas,
  getConversa,
  atualizarTituloConversa,
  deletarConversa,
  salvarMensagem,
  carregarMensagens,
  limparConversasAntigas,
} from '../services/subjectsDb';

export default function ChatScreen({ navigation }) {
  const [conversaId, setConversaId] = useState(null);
  const [mensagens, setMensagens] = useState([]);
  const [input, setInput] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [status, setStatus] = useState('conectando');
  const [histModal, setHistModal] = useState(false);
  const [conversasLista, setConversasLista] = useState([]);
  const flatRef = useRef(null);
  const tituloSalvoRef = useRef(false);

  const carregarConversa = useCallback(async (id) => {
    setConversaId(id);
    setStatus('conectando');
    const msgs = await carregarMensagens(id);
    if (msgs.length === 0) {
      setMensagens([{
        _id: 'welcome',
        role: 'assistant',
        content: 'Olá! Sou seu assistente de estudos 📚. Pergunte sobre matérias, métodos de estudo, planejamento ou dicas educacionais!',
      }]);
    } else {
      setMensagens(msgs.map((m) => ({ ...m, _id: String(m.id) })));
    }
    setStatus('online');
    tituloSalvoRef.current = msgs.length > 0;
  }, []);

  const novaConversa = useCallback(async () => {
    await limparConversasAntigas(20);
    const conv = await criarConversa();
    await carregarConversa(conv.id);
    setHistModal(false);
  }, [carregarConversa]);

  useEffect(() => {
    (async () => {
      const ultima = await listarConversas();
      if (ultima.length > 0) {
        await carregarConversa(ultima[0].id);
      } else {
        await novaConversa();
      }
    })();
  }, [carregarConversa, novaConversa]);

  const abrirHistorico = async () => {
    const lista = await listarConversas();
    setConversasLista(lista);
    setHistModal(true);
  };

  const enviar = async () => {
    const texto = input.trim();
    if (!texto || carregando || !conversaId) return;
    setInput('');
    setStatus('digitando');

    const userMsg = await salvarMensagem(conversaId, 'user', texto);

    if (!tituloSalvoRef.current) {
      const titulo = texto.length > 40 ? texto.slice(0, 40) + '…' : texto;
      await atualizarTituloConversa(conversaId, titulo);
      tituloSalvoRef.current = true;
    }

    const msgLocal = { _id: String(userMsg.id), ...userMsg };
    const msgsAtualizadas = [...mensagens, msgLocal];
    setMensagens(msgsAtualizadas);
    setCarregando(true);

    const resposta = await enviarMensagem(
      msgsAtualizadas.map((m) => ({ role: m.role, text: m.content }))
    );

    const assistMsg = await salvarMensagem(conversaId, 'assistant', resposta);
    setMensagens((prev) => [
      ...prev,
      { _id: String(assistMsg.id), ...assistMsg },
    ]);
    setCarregando(false);
    setStatus('online');
  };

  const excluirConversa = (id, titulo) => {
    Alert.alert('Excluir conversa', `"${titulo}" será removida.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await deletarConversa(id);
          if (id === conversaId) await novaConversa();
          else abrirHistorico();
        },
      },
    ]);
  };

  const formatarData = (iso) => {
    const d = new Date(iso);
    const hoje = new Date();
    if (d.toDateString() === hoje.toDateString()) {
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const renderItem = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[s.bolha, isUser ? s.bolhaUser : s.bolhaBot]}>
        {!isUser && (
          <View style={s.bolhaBotIcon}>
            <Text style={s.bolhaBotIconText}>🤖</Text>
          </View>
        )}
        <View style={[s.bolhaContent, isUser && s.bolhaContentUser]}>
          <Text style={[s.bolhaTexto, isUser ? s.bolhaTextoUser : s.bolhaTextoBot]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0a0f1e" />
      <LinearGradient colors={['#0a0f1e', '#0d1a2e', '#0a1520']} style={s.gradient} />

      <View style={s.header}>
        <TouchableOpacity style={s.backButton} activeOpacity={0.7} onPress={() => navigation.goBack()}>
          <Text style={s.backButtonText}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.headerInfo} activeOpacity={0.7} onPress={abrirHistorico}>
          <Text style={s.headerTitle} numberOfLines={1}>Assistente IA</Text>
          <View style={s.headerStatusRow}>
            <View style={[s.statusDot, status === 'online' ? s.statusOnline : status === 'digitando' ? s.statusDigitando : s.statusOffline]} />
            <Text style={s.headerStatus}>
              {status === 'online' ? 'Online' : status === 'digitando' ? 'Digitando...' : 'Conectando...'}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={s.novaBtn} activeOpacity={0.7} onPress={novaConversa}>
          <Text style={s.novaBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatRef}
        data={mensagens}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={s.lista}
        onContentSizeChange={() => setTimeout(() => flatRef.current?.scrollToEnd(), 100)}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<View style={{ height: 8 }} />}
      />

      <View style={s.inputArea}>
        <TextInput
          style={s.input}
          placeholder="Digite sua dúvida..."
          placeholderTextColor="#4a5a6a"
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
          editable={!carregando}
        />
        <TouchableOpacity
          style={[s.enviarBtn, (!input.trim() || carregando) && s.enviarBtnDisabled]}
          activeOpacity={0.7}
          onPress={enviar}
          disabled={!input.trim() || carregando}
        >
          <Text style={s.enviarBtnText}>↑</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={histModal} transparent animationType="slide" onRequestClose={() => setHistModal(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setHistModal(false)}>
          <TouchableOpacity style={s.modalBox} activeOpacity={1}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitulo}>Histórico</Text>
              <TouchableOpacity onPress={() => setHistModal(false)}>
                <Text style={{ color: '#5a6a7a', fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            {conversasLista.length === 0 ? (
              <Text style={s.modalVazio}>Nenhuma conversa anterior.</Text>
            ) : (
              <FlatList
                data={conversasLista}
                keyExtractor={(item) => String(item.id)}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const ativa = item.id === conversaId;
                  const preview = item.ultima_msg
                    ? (item.ultima_msg.length > 60 ? item.ultima_msg.slice(0, 60) + '…' : item.ultima_msg)
                    : '';
                  return (
                    <TouchableOpacity
                      style={[s.histItem, ativa && s.histItemAtiva]}
                      activeOpacity={0.7}
                      onPress={() => { carregarConversa(item.id); setHistModal(false); }}
                      onLongPress={() => excluirConversa(item.id, item.titulo)}
                    >
                      <View style={s.histItemLeft}>
                        <Text style={[s.histTitulo, ativa && s.histTituloAtiva]} numberOfLines={1}>
                          {item.titulo}
                        </Text>
                        {preview ? (
                          <Text style={s.histPreview} numberOfLines={1}>{preview}</Text>
                        ) : null}
                      </View>
                      <Text style={s.histData}>{formatarData(item.created_at)}</Text>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1e' },
  gradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 50, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  backButtonText: { color: '#8a9bb5', fontSize: 22 },
  headerInfo: { flex: 1 },
  headerTitle: { color: '#e8edf5', fontSize: 17, fontWeight: '700' },
  headerStatusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
  statusOnline: { backgroundColor: '#4CAF50' },
  statusDigitando: { backgroundColor: '#FF9800' },
  statusOffline: { backgroundColor: '#5a6a7a' },
  headerStatus: { color: '#8a9bb5', fontSize: 12 },
  novaBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(90,184,212,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 8,
  },
  novaBtnText: { color: '#5ab8d4', fontSize: 22, fontWeight: '300', lineHeight: 24 },

  lista: { paddingHorizontal: 16, paddingBottom: 8 },
  bolha: {
    flexDirection: 'row', marginBottom: 12,
    alignItems: 'flex-end',
  },
  bolhaUser: { justifyContent: 'flex-end' },
  bolhaBot: { justifyContent: 'flex-start' },
  bolhaBotIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(90,184,212,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 8, marginBottom: 4,
  },
  bolhaBotIconText: { fontSize: 14 },
  bolhaContent: {
    maxWidth: '78%', borderRadius: 16, padding: 13,
  },
  bolhaContent: {
    maxWidth: '78%', borderRadius: 16, padding: 13,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderBottomLeftRadius: 4,
  },
  bolhaContentUser: {
    backgroundColor: '#5ab8d4',
    borderBottomRightRadius: 4,
    maxWidth: '78%', borderRadius: 16, padding: 13,
  },
  bolhaTexto: { fontSize: 15, lineHeight: 21 },
  bolhaTextoUser: { color: '#0a0f1e' },
  bolhaTextoBot: { color: '#e8edf5' },

  inputArea: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
  },
  input: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10,
    color: '#e8edf5', fontSize: 15, maxHeight: 100,
  },
  enviarBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#5ab8d4',
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 8,
  },
  enviarBtnDisabled: { opacity: 0.4 },
  enviarBtnText: { color: '#0a0f1e', fontSize: 20, fontWeight: '700' },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#0d1a2e',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: '70%',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    borderBottomWidth: 0,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  modalTitulo: { color: '#e8edf5', fontSize: 18, fontWeight: '700' },
  modalVazio: { color: '#5a6a7a', fontSize: 14, textAlign: 'center', marginTop: 20 },
  histItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 12,
    borderRadius: 12, marginBottom: 4,
  },
  histItemAtiva: { backgroundColor: 'rgba(90,184,212,0.1)' },
  histItemLeft: { flex: 1, marginRight: 12 },
  histTitulo: { color: '#e8edf5', fontSize: 15, fontWeight: '600' },
  histTituloAtiva: { color: '#5ab8d4' },
  histPreview: { color: '#5a6a7a', fontSize: 12, marginTop: 3 },
  histData: { color: '#4a5a6a', fontSize: 12, fontWeight: '500' },
});
