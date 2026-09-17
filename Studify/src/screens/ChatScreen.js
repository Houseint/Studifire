import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StatusBar, KeyboardAvoidingView, Platform, StyleSheet,
  Modal, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../shared/theme/ThemeContext';
import { dark } from '../shared/theme/colors';
import * as AiService from '../services/aiService';
import { useUserId } from '../hooks/useUserId';
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
  const { colors } = useTheme();
  const s = useMemo(() => getChatStyles(colors), [colors]);
  const userId = useUserId();
  const [conversaId, setConversaId] = useState(null);
  const [mensagens, setMensagens] = useState([]);
  const [input, setInput] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [status, setStatus] = useState('conectando');
  const [histModal, setHistModal] = useState(false);
  const [conversasLista, setConversasLista] = useState([]);
  const flatRef = useRef(null);
  const tituloSalvoRef = useRef(false);
  const reqTokenRef = useRef(0);
  const mountedRef = useRef(true);

  const carregarConversa = useCallback(async (id) => {
    if (!userId) return;
    const token = ++reqTokenRef.current;
    mountedRef.current = true;
    setConversaId(id);
    setStatus('conectando');
    const msgs = await carregarMensagens(userId, id);
    if (!mountedRef.current || token !== reqTokenRef.current) {
      return;
    }
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
  }, [userId]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const novaConversa = useCallback(async () => {
    if (!userId) return;
    await limparConversasAntigas(userId, 20);
    const conv = await criarConversa(userId);
    await carregarConversa(conv.id);
    setHistModal(false);
  }, [carregarConversa, userId]);

  useEffect(() => {
    if (!userId) return;
    let mounted = true;
    (async () => {
      const ultima = await listarConversas(userId);
      if (!mounted) return;
      if (ultima.length > 0) {
        await carregarConversa(ultima[0].id);
      } else {
        await novaConversa();
      }
    })();
    return () => {
      mounted = false;
    };
  }, [carregarConversa, novaConversa, userId]);

  const abrirHistorico = async () => {
    if (!userId) return;
    const lista = await listarConversas(userId);
    setConversasLista(lista);
    setHistModal(true);
  };

  const enviar = async () => {
    const texto = input.trim();
    if (!texto || carregando || !conversaId) return;
    setInput('');
    setStatus('digitando');

    let userMsg;
    try {
      userMsg = await salvarMensagem(userId, conversaId, 'user', texto);
    } catch (e) {
      console.error('Erro ao salvar mensagem do usuário:', e);
      Alert.alert('Erro', 'Não foi possível enviar a mensagem.');
      setStatus('online');
      return;
    }

    if (!tituloSalvoRef.current) {
      const titulo = texto.length > 40 ? texto.slice(0, 40) + '…' : texto;
      await atualizarTituloConversa(userId, conversaId, titulo);
      tituloSalvoRef.current = true;
    }

    const msgLocal = { _id: String(userMsg.id), ...userMsg };
    const msgsAtualizadas = [...mensagens, msgLocal];
    setMensagens(msgsAtualizadas);
    setCarregando(true);

    // Passo 1.1: usa contextual quando disponível, fallback para mock legado (enviarMensagem) em testes
    const msgsPayload = msgsAtualizadas.map((m) => ({ role: m.role, text: m.content }));
    let resposta;
    if (typeof AiService.enviarMensagemContextual === 'function') {
      resposta = await AiService.enviarMensagemContextual(userId, msgsPayload);
    } else {
      resposta = await AiService.enviarMensagem(msgsPayload);
    }

    let assistMsg;
    try {
      assistMsg = await salvarMensagem(userId, conversaId, 'assistant', resposta);
    } catch (e) {
      console.error('Erro ao salvar resposta da IA:', e);
      setCarregando(false);
      setStatus('online');
      return;
    }
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
          await deletarConversa(userId, id);
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
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />
      <LinearGradient colors={colors.bgGradient} style={s.gradient} />

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
          placeholderTextColor={colors.textMuted}
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
                <Text style={{ color: colors.textMuted, fontSize: 20 }}>✕</Text>
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

export const getChatStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  gradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 50, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  backButtonText: { color: colors.textMuted, fontSize: 22 },
  headerInfo: { flex: 1 },
  headerTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  headerStatusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
  statusOnline: { backgroundColor: colors.success },
  statusDigitando: { backgroundColor: colors.warn },
  statusOffline: { backgroundColor: colors.textSecondary },
  headerStatus: { color: colors.textMuted, fontSize: 12 },
  novaBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(111,82,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 8,
  },
  novaBtnText: { color: colors.accent, fontSize: 22, fontWeight: '300', lineHeight: 24 },

  lista: { paddingHorizontal: 16, paddingBottom: 8 },
  bolha: {
    flexDirection: 'row', marginBottom: 12,
    alignItems: 'flex-end',
  },
  bolhaUser: { justifyContent: 'flex-end' },
  bolhaBot: { justifyContent: 'flex-start' },
  bolhaBotIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(111,82,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 8, marginBottom: 4,
  },
  bolhaBotIconText: { fontSize: 14 },
  bolhaContent: {
    maxWidth: '78%', borderRadius: 16, padding: 13,
    backgroundColor: colors.card,
    borderBottomLeftRadius: 4,
  },
  bolhaContentUser: {
    backgroundColor: colors.accentStrong,
    borderBottomRightRadius: 4,
    maxWidth: '78%', borderRadius: 16, padding: 13,
  },
  bolhaTexto: { fontSize: 15, lineHeight: 21 },
  bolhaTextoUser: { color: '#FFFFFF' },
  bolhaTextoBot: { color: colors.text },

  inputArea: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  input: {
    flex: 1, backgroundColor: colors.card2,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10,
    color: colors.text, fontSize: 15, maxHeight: 100,
  },
  enviarBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.accentStrong,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 8,
  },
  enviarBtnDisabled: { opacity: 0.4 },
  enviarBtnText: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: '70%',
    borderWidth: 1, borderColor: colors.borderStrong,
    borderBottomWidth: 0,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  modalTitulo: { color: colors.text, fontSize: 18, fontWeight: '700' },
  modalVazio: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 20 },
  histItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 12,
    borderRadius: 12, marginBottom: 4,
  },
  histItemAtiva: { backgroundColor: 'rgba(111,82,255,0.1)' },
  histItemLeft: { flex: 1, marginRight: 12 },
  histTitulo: { color: colors.text, fontSize: 15, fontWeight: '600' },
  histTituloAtiva: { color: colors.accent },
  histPreview: { color: colors.textSecondary, fontSize: 12, marginTop: 3 },
  histData: { color: colors.textMuted, fontSize: 12, fontWeight: '500' },
});

const ChatScreenStyles = getChatStyles(dark);

export { ChatScreenStyles };
