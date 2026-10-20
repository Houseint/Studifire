import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../shared/theme/ThemeContext';

// Tour rápido do app: 7 passos, acessível pela Ajuda e aberto no primeiro uso.
const PASSOS = [
  {
    icon: '👋',
    titulo: 'Bem-vindo ao Studifire',
    texto: 'Este tour leva 1 minuto. Você pode pular agora e rever depois em Ajuda > Como usar o Studifire.',
  },
  {
    icon: '📚',
    titulo: 'Crie sua primeira matéria',
    texto: 'Toque em + Adicionar no rodapé, dê um nome e adicione os tópicos que vai estudar. Marque cada tópico como estudado para o progresso subir.',
  },
  {
    icon: '⏱️',
    titulo: 'Timer Livre e Pomodoro',
    texto: 'Inicie uma sessão na matéria: cronômetro livre ou Pomodoro de 25/50 min. Ao sair da tela, a mini barra continua mostrando o tempo.',
  },
  {
    icon: '🔒',
    titulo: 'Modo foco',
    texto: 'Com o modo foco ativado, a saída da matéria fica bloqueada durante a sessão. Desative para navegar pelo app (chat, progresso) enquanto estuda.',
  },
  {
    icon: '📊',
    titulo: 'Progresso e histórico',
    texto: 'Acompanhe horas estudadas, sequência de dias, heatmap e as matérias que você estudou em cada dia. Toque em uma sessão do histórico para ver os detalhes.',
  },
  {
    icon: '🏆',
    titulo: 'Conquistas e meta',
    texto: 'São 8 conquistas. Cada uma mostra o quanto falta para desbloquear. Ajuste também a meta semanal de estudo.',
  },
  {
    icon: '🔔',
    titulo: 'Lembrete e quiz',
    texto: 'Escolha qualquer horário para o lembrete diário. Depois de cada sessão, o app oferece um quiz rápido para revisar o conteúdo.',
  },
];

export default function TutorialModal({ visible, onClose }) {
  const { colors } = useTheme();
  const s = getTutorialStyles(colors);
  const [step, setStep] = useState(0);

  const last = step === PASSOS.length - 1;
  const passo = PASSOS[step];

  const close = () => {
    setStep(0);
    if (onClose) onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={s.overlay}>
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={close} />
        <View style={s.card}>
          <Text style={s.counter}>Passo {step + 1} de {PASSOS.length}</Text>
          <Text style={s.icon}>{passo.icon}</Text>
          <Text style={s.title}>{passo.titulo}</Text>
          <Text style={s.text}>{passo.texto}</Text>

          <View style={s.dots}>
            {PASSOS.map((_, i) => (
              <View key={`passo-${i}`} style={[s.dot, i === step && s.dotActive]} />
            ))}
          </View>

          <View style={s.row}>
            {step > 0 ? (
              <TouchableOpacity style={s.secondary} activeOpacity={0.7} onPress={() => setStep(step - 1)}>
                <Text style={s.secondaryText}>Voltar</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flex: 1 }} />
            )}
            <TouchableOpacity
              style={s.primary}
              activeOpacity={0.8}
              onPress={() => (last ? close() : setStep(step + 1))}
            >
              <Text style={s.primaryText}>{last ? 'Começar a estudar' : 'Próximo'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity activeOpacity={0.7} onPress={close} style={s.skipWrap}>
            <Text style={s.skip}>Pular tutorial</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export function getTutorialStyles(colors) {
  return StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' },
    card: {
      width: '86%', maxWidth: 420,
      backgroundColor: colors.card, borderRadius: 18,
      borderWidth: 1, borderColor: colors.border,
      padding: 22, alignItems: 'center',
    },
    counter: { color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
    icon: { fontSize: 44, marginTop: 12, marginBottom: 8 },
    title: { color: colors.text, fontSize: 19, fontWeight: '800', textAlign: 'center' },
    text: { color: colors.textMuted, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 8 },
    dots: { flexDirection: 'row', marginTop: 18, marginBottom: 18 },
    dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.border, marginHorizontal: 3 },
    dotActive: { width: 18, backgroundColor: colors.accent },
    row: { flexDirection: 'row', alignItems: 'center', width: '100%' },
    secondary: {
      flex: 1, paddingVertical: 12, borderRadius: 12,
      borderWidth: 1, borderColor: colors.border, alignItems: 'center', marginRight: 8,
    },
    secondaryText: { color: colors.textMuted, fontSize: 14, fontWeight: '700' },
    primary: { flex: 1.4, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.accentStrong, alignItems: 'center' },
    primaryText: { color: '#fff', fontSize: 14, fontWeight: '800' },
    skipWrap: { marginTop: 12, padding: 4 },
    skip: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  });
}
