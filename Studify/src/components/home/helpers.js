import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';

export const pickTheme = (materia) => {
  const THEMES = [
    { backgroundColor: '#151C45', borderColor: '#2D3C84', pinBg: '#212D66', progress: '#5B7CFF' },
    { backgroundColor: '#143B3A', borderColor: '#1C5D5A', pinBg: '#1B4C4A', progress: '#2DD4BF' },
    { backgroundColor: '#3D1B2A', borderColor: '#6C2742', pinBg: '#552034', progress: '#F472B6' },
    { backgroundColor: '#3A2A17', borderColor: '#6A4B1F', pinBg: '#51381A', progress: '#F59E0B' },
  ];
  const idNum = Number(materia?.id || 0);
  return THEMES[Math.abs(idNum) % THEMES.length];
};

export const isUrgent = (materia) => {
  const text = `${materia?.nome || ''} ${materia?.descricao || ''}`.toLowerCase();
  return text.includes('urgente') || text.includes('hoje') || text.includes('prazo');
};

export const calcProgress = (topicos) => {
  const total = topicos?.length || 0;
  const concluidos = topicos?.filter((t) => t.estudado).length || 0;
  return total > 0 ? concluidos / total : 0;
};

export const filterRevisados = (revisados, busca) => {
  const q = busca.toLowerCase();
  return revisados.filter((m) =>
    m.nome.toLowerCase().includes(q) || m.topicos?.some((t) => t.nome.toLowerCase().includes(q))
  );
};

export const getEstaFixada = (fixados, materia) => !!fixados.find((m) => m.id === materia.id);

export const calcGlobalStats = (revisados, fixados) => {
  const all = [...revisados, ...fixados];
  const totalTopicos = all.reduce((acc, m) => acc + (m.topicos?.length || 0), 0);
  const concluidos = all.reduce((acc, m) => acc + (m.topicos?.filter((t) => t.estudado).length || 0), 0);
  return { totalTopicos, concluidos };
};

const TopicoItem = ({ nome, onRemove, styles }) => (
  <View style={styles.topicoChip}>
    <Text style={styles.topicoChipText}>{nome}</Text>
    <TouchableOpacity onPress={onRemove} style={styles.topicoChipRemove}>
      <Text style={styles.topicoChipRemoveText}>✕</Text>
    </TouchableOpacity>
  </View>
);

export const renderTopicoInput = ({
  value,
  onChangeText,
  onAdd,
  list,
  setList,
  label = 'Tópicos',
  placeholder = 'Ex: Álgebra Linear',
  max = 10,
  disabled = false,
  styles,
}) => (
  <View>
    <Text style={styles.modalLabel}>{label} ({list.length}/{max})</Text>
    <View style={styles.topicoInputRow}>
      <TextInput
        style={[styles.modalInput, styles.topicoInputField]}
        placeholder={placeholder}
        placeholderTextColor="#5a6a7a"
        value={value}
        onChangeText={onChangeText}
        selectionColor="#6c8ebf"
        onSubmitEditing={onAdd}
        returnKeyType="next"
        disabled={disabled}
      />
      <TouchableOpacity
        style={[styles.topicoAddBtn, list.length >= max && styles.topicoAddBtnDisabled]}
        onPress={onAdd}
        disabled={list.length >= max || disabled}
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
            styles={styles}
          />
        ))}
      </View>
    )}
  </View>
);