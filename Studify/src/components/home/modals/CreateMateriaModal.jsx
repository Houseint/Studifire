import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { CreateMateriaModalStyles as styles } from '../../../styles/components/home/modals/CreateMateriaModalStyles';
import { renderTopicoInput } from '../helpers';

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
}) => (
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
        <TouchableOpacity style={styles.modalConfirmar} onPress={onSubmit}>
          <Text style={styles.modalConfirmarText}>Adicionar</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </TouchableOpacity>
  </Modal>
);

export default CreateMateriaModal;