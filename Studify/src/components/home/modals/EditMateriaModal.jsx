import React, { useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, Alert, StyleSheet } from 'react-native';
import { getEditMateriaModalStyles } from '../../../styles/components/home/modals/EditMateriaModalStyles';
import { useTheme } from '../../../shared/theme/ThemeContext';
import { renderTopicoInput } from '../helpers';

const EditMateriaModal = ({
  visible,
  onClose,
  materia,
  onSave,
  onDelete,
  editNome,
  setEditNome,
  editTopicos,
  setEditTopicos,
  editTopicoInput,
  setEditTopicoInput,
  MAX_TOPICOS = 10,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => getEditMateriaModalStyles(colors), [colors]);
  return (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
      <TouchableOpacity style={styles.modalBox} activeOpacity={1}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitulo}>Editar {materia?.nome || 'Matéria'}</Text>
          <TouchableOpacity onPress={onClose}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
        </View>
        <Text style={styles.modalLabel}>Nome da matéria *</Text>
        <TextInput
          style={styles.modalInput}
          placeholder="Ex: Matemática, Física..."
          placeholderTextColor={colors.textMuted}
          value={editNome}
          onChangeText={setEditNome}
          selectionColor={colors.accent}
        />
        {renderTopicoInput({
          value: editTopicoInput,
          onChangeText: setEditTopicoInput,
          onAdd: () => {
            if (editTopicoInput.trim() && editTopicos.length < MAX_TOPICOS) {
              setEditTopicos((prev) => [...prev, { nome: editTopicoInput.trim(), estudado: false }]);
              setEditTopicoInput('');
            }
          },
          list: editTopicos,
          setList: setEditTopicos,
          label: 'Tópicos',
          placeholder: 'Ex: Álgebra Linear',
          max: MAX_TOPICOS,
          styles,
          placeholderTextColor: colors.textMuted,
          selectionColor: colors.accent,
        })}
        <TouchableOpacity style={[styles.modalConfirmar, { backgroundColor: '#6c9fd4' }]} onPress={onSave}>
          <Text style={styles.modalConfirmarText}>Salvar Alterações</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.excluirBtn} onPress={() =>
          Alert.alert('Confirmar exclusão', 'Esta matéria será removida de todas as seções.', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Excluir', style: 'destructive', onPress: () => onDelete(materia.id) },
          ])
        }>
          <Text style={styles.excluirBtnText}>Excluir Matéria</Text>
        </TouchableOpacity>
      </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default EditMateriaModal;