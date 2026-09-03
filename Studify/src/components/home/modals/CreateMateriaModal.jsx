import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { CreateMateriaModalStyles as styles } from '../../../styles/components/home/modals/CreateMateriaModalStyles';
import { renderTopicoInput } from '../helpers';
import { gerarTopicosComplementares } from '../../../services/aiService';

const CreateMateriaModal = ({
  visible,
  onClose,
  onSubmit,
  novaMateria,
  setNovaMateria,
  novosTopicos,
  setNovosTopicos,
  topicoInput,
  setTopicoInput,
  MAX_TOPICOS = 10,
}) => {
  const [iaLoading, setIaLoading] = useState(false);
  const [iaError, setIaError] = useState('');
  const [iaSugestoes, setIaSugestoes] = useState([]); // [{nome, estudado:false}]
  const [iaSelected, setIaSelected] = useState({}); // index -> bool

  useEffect(() => {
    if (!visible) {
      setIaSugestoes([]);
      setIaSelected({});
      setIaError('');
      setIaLoading(false);
    }
  }, [visible]);

  const canGenerate = novaMateria.trim().length >= 3 && novosTopicos.length >= 1 && novosTopicos.length < MAX_TOPICOS;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setIaLoading(true);
    setIaError('');
    try {
      const { topicos } = await gerarTopicosComplementares(novaMateria, novosTopicos, { maxTotal: MAX_TOPICOS });
      if (!topicos || topicos.length === 0) {
        setIaError('IA não retornou sugestões novas. Tente refinar o 1º tópico.');
        setIaSugestoes([]);
        return;
      }
      setIaSugestoes(topicos);
      const sel = {};
      topicos.forEach((_, i) => (sel[i] = true));
      setIaSelected(sel);
    } catch (e) {
      const msg = e?.message || 'Erro ao gerar';
      if (msg.startsWith('⏳') || msg.startsWith('Configure')) {
        setIaError(msg);
      } else if (msg === 'PRECISA_1_TOPICO') {
        setIaError('Adicione pelo menos 1 tópico manual antes.');
      } else if (msg === 'NOME_INVALIDO') {
        setIaError('Nome da matéria muito curto.');
      } else {
        setIaError(msg);
      }
    } finally {
      setIaLoading(false);
    }
  };

  const toggleSelect = (idx) => {
    setIaSelected((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleAddSelected = () => {
    const selecionados = iaSugestoes.filter((_, i) => iaSelected[i]);
    if (selecionados.length === 0) {
      Alert.alert('Nada selecionado', 'Marque pelo menos 1 sugestão.');
      return;
    }
    const slots = MAX_TOPICOS - novosTopicos.length;
    const paraAdd = selecionados.slice(0, slots);
    // dedup adicional por normalize
    const existentesNorm = new Set(
      novosTopicos.map((t) => t.nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()),
    );
    const filtrados = paraAdd.filter((t) => {
      const n = t.nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
      return !existentesNorm.has(n);
    });
    setNovosTopicos((prev) => [...prev, ...filtrados]);
    setIaSugestoes([]);
    setIaSelected({});
    setIaError('');
  };

  const handleClearIa = () => {
    setIaSugestoes([]);
    setIaSelected({});
    setIaError('');
  };

  const hintIa = !canGenerate
    ? novosTopicos.length < 1
      ? 'Adicione 1 tópico para IA completar'
      : novaMateria.trim().length < 3
        ? 'Nome precisa de 3+ letras'
        : novosTopicos.length >= MAX_TOPICOS
          ? 'Limite 10 tópicos atingido'
          : ''
    : '';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.modalBox} activeOpacity={1}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitulo}>Nova Matéria</Text>
            <TouchableOpacity onPress={onClose}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
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
          {renderTopicoInput({
            value: topicoInput,
            onChangeText: setTopicoInput,
            onAdd: () => {
              if (topicoInput.trim() && novosTopicos.length < MAX_TOPICOS) {
                setNovosTopicos((prev) => [...prev, { nome: topicoInput.trim(), estudado: false }]);
                setTopicoInput('');
              }
            },
            list: novosTopicos,
            setList: setNovosTopicos,
            label: 'Tópicos',
            placeholder: 'Ex: Álgebra Linear',
            max: MAX_TOPICOS,
            styles,
          })}

          {/* Botão IA híbrido C 1,2,3 */}
          <View style={{ marginTop: 8, marginBottom: 8 }}>
            <TouchableOpacity
              onPress={handleGenerate}
              disabled={!canGenerate || iaLoading}
              activeOpacity={0.8}
              style={{
                backgroundColor: canGenerate ? '#8A68FF' : '#1B2545',
                borderWidth: 1,
                borderColor: canGenerate ? '#8A68FF' : '#303E70',
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: 'center',
                opacity: canGenerate ? 1 : 0.6,
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {iaLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={{ color: canGenerate ? '#fff' : '#5a6a7a', fontSize: 16 }}>✨</Text>
              )}
              <Text style={{ color: canGenerate ? '#fff' : '#5a6a7a', fontWeight: '800', fontSize: 14 }}>
                {iaLoading ? 'Gerando...' : 'Completar com IA'}
              </Text>
            </TouchableOpacity>
            {!!hintIa && <Text style={{ color: '#7F8AB7', fontSize: 11, marginTop: 6 }}>{hintIa}</Text>}
            {!!iaError && <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 6 }}>{iaError}</Text>}
          </View>

          {/* Preview IA */}
          {iaSugestoes.length > 0 && (
            <View style={{ backgroundColor: '#111832', borderWidth: 1, borderColor: '#27315B', borderRadius: 12, padding: 12, marginBottom: 10 }}>
              <Text style={{ color: '#F4F6FF', fontWeight: '700', marginBottom: 8 }}>Sugestões da IA ({iaSugestoes.length}) — marque para adicionar</Text>
              <ScrollView style={{ maxHeight: 160 }}>
                {iaSugestoes.map((t, idx) => (
                  <TouchableOpacity key={idx} onPress={() => toggleSelect(idx)} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}>
                    <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: iaSelected[idx] ? '#6F52FF' : '#303E70', backgroundColor: iaSelected[idx] ? '#6F52FF' : 'transparent', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                      {iaSelected[idx] && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>✓</Text>}
                    </View>
                    <Text style={{ color: '#C0CAE8', flex: 1 }}>{t.nome}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <TouchableOpacity onPress={handleClearIa} style={{ flex: 1, backgroundColor: '#1B2545', borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#303E70' }}>
                  <Text style={{ color: '#AAB6D9', fontWeight: '700' }}>Limpar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleGenerate} disabled={iaLoading} style={{ flex: 1, backgroundColor: '#1B2545', borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#303E70', opacity: iaLoading ? 0.5 : 1 }}>
                  <Text style={{ color: '#AAB6D9', fontWeight: '700' }}>Regenerar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAddSelected} style={{ flex: 2, backgroundColor: '#6F52FF', borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '800' }}>Adicionar ({Object.values(iaSelected).filter(Boolean).length})</Text>
                </TouchableOpacity>
              </View>
              <Text style={{ color: '#5E6994', fontSize: 11, marginTop: 8 }}>Vagas: {MAX_TOPICOS - novosTopicos.length} • Desmarque o que não quiser</Text>
            </View>
          )}

          <TouchableOpacity style={styles.modalConfirmar} onPress={onSubmit}>
            <Text style={styles.modalConfirmarText}>Adicionar</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default CreateMateriaModal;
