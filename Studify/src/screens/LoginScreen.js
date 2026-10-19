import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";


import { loginUser } from '../features/auth/authDb';
import { getUserSettings } from '../services/subjectsDb';
import { useTheme } from '../shared/theme/ThemeContext';
import { getAuthScreenStyles } from '../styles/AuthScreenStyles.js';
import { useThemedAlert } from '../hooks/useThemedAlert';
import ThemedAlert from '../components/common/ThemedAlert';

export default function LoginScreen({ navigation }) {
  const { colors, setMode } = useTheme();
  const styles = useMemo(() => getAuthScreenStyles(colors), [colors]);
  const { alertConfig, showAlert, hideAlert } = useThemedAlert();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !senha.trim()) {
      showAlert({ title: 'Atenção', message: 'Preencha e-mail e senha.', buttons: [{ text: 'OK', style: 'cancel' }] });
      return;
    }

    // Validação de e-mail: deve conter @ e . e ter texto antes do @
    const emailValido =
      email.includes('@') &&
      email.includes('.') &&
      email.split('@')[0].trim().length > 0;
    if (!emailValido) {
      showAlert({ title: 'Atenção', message: 'Digite um e-mail válido (ex: nome@exemplo.com).', buttons: [{ text: 'OK', style: 'cancel' }] });
      return;
    }

    try {
      setLoading(true);
      const user = await loginUser(email, senha);

      if (!user) {
        showAlert({ title: 'Login inválido', message: 'E-mail ou senha incorretos.', buttons: [{ text: 'OK', style: 'cancel' }] });
        return;
      }

      // Carrega o tema persistido (o bootstrap rodou sem sessão — sem isso, light voltaria dark)
      try {
        const settings = await getUserSettings(user.id);
        setMode(settings?.theme_mode === 'light' ? 'light' : 'dark');
      } catch {
        // sem tema salvo: segue dark
      }

      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (error) {
      showAlert({ title: 'Erro', message: 'Não foi possível fazer login agora.', buttons: [{ text: 'OK', style: 'cancel' }] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />

      <LinearGradient
        colors={colors.bgGradient}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <View style={styles.glowOrb1} />
      <View style={styles.glowOrb2} />

      <View style={styles.formWrap}>
        <View style={[styles.logoContainer, { marginBottom: 40 }]}>
          <Image
            source={require("../../img/LogoStudifirWithDesc.png")}
            style={styles.logoImage}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>E-mail</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              selectionColor={colors.accent}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Senha</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
              selectionColor={colors.accent}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.authButton}
          activeOpacity={0.85}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.authButtonText}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            É novo por aqui?{' '}
            <Text
              style={styles.footerLink}
              onPress={() => navigation?.navigate("Register")}
            >
              Cadastrar
            </Text>
          </Text>
        </View>
      </View>
      <ThemedAlert config={alertConfig} onClose={hideAlert} />
    </KeyboardAvoidingView>
  );
}
