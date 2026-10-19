import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../shared/theme/ThemeContext';

/**
 * ThemedAlert - substitui Alert.alert nativo com visual do Studify (light/dark).
 * Uso:
 *   <ThemedAlert
 *     visible={show}
 *     title="Título"
 *     message="Mensagem"
 *     buttons={[
 *       { text: 'Cancelar', style: 'cancel', onPress: () => setShow(false) },
 *       { text: 'Confirmar', style: 'destructive', onPress: handleConfirm },
 *     ]}
 *     onClose={() => setShow(false)}
 *   />
 */
export default function ThemedAlert({ visible, title, message, buttons = [], onClose }) {
  const { colors } = useTheme();
  const s = getThemedAlertStyles(colors);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.overlay}>
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={s.card}>
          {title && <Text style={s.title}>{title}</Text>}
          {message && <Text style={s.message}>{message}</Text>}
          <View style={s.buttonRow}>
            {buttons.map((btn, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  s.button,
                  btn.style === 'destructive' && s.buttonDestructive,
                  btn.style === 'cancel' && s.buttonCancel,
                  btn.style === 'primary' && s.buttonPrimary,
                ]}
                activeOpacity={0.8}
                onPress={() => {
                  btn.onPress?.();
                  if (btn.style !== 'cancel') onClose?.();
                }}
              >
                <Text style={[
                  s.buttonText,
                  btn.style === 'destructive' && s.buttonTextDestructive,
                  btn.style === 'cancel' && s.buttonTextCancel,
                  btn.style === 'primary' && s.buttonTextPrimary,
                ]}>
                  {btn.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function getThemedAlertStyles(colors) {
  const isDark = colors.mode !== 'light';
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      padding: 20,
    },
    backdrop: {
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(5, 8, 20, 0.7)',
    },
    card: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 20,
      maxWidth: 360,
      alignSelf: 'center',
    },
    title: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '800',
      marginBottom: 8,
      textAlign: 'center',
    },
    message: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
      marginBottom: 16,
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 8,
    },
    button: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
      minWidth: 100,
    },
    buttonPrimary: {
      backgroundColor: colors.accent,
    },
    buttonDestructive: {
      backgroundColor: colors.danger,
    },
    buttonCancel: {
      backgroundColor: colors.card2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    buttonText: {
      fontSize: 14,
      fontWeight: '700',
    },
    buttonTextPrimary: { color: '#FFFFFF' },
    buttonTextDestructive: { color: '#FFFFFF' },
    buttonTextCancel: { color: colors.text },
  });
}