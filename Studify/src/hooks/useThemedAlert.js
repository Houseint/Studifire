import { useState, useCallback } from 'react';

/**
 * Hook para gerenciar alerts temáticos (substitui Alert.alert nativo).
 * Uso:
 *   const { alertConfig, showAlert, hideAlert } = useThemedAlert();
 *   // No JSX: <ThemedAlert config={alertConfig} onClose={hideAlert} />
 *   // Para mostrar: showAlert({ title, message, buttons, onClose })
 */
export default function useThemedAlert() {
  const [alertConfig, setAlertConfig] = useState(null);

  const showAlert = useCallback((config) => {
    setAlertConfig(config);
  }, []);

  const hideAlert = useCallback(() => {
    setAlertConfig(null);
  }, []);

  return { alertConfig, showAlert, hideAlert };
}