import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";


import { loginUser } from '../features/auth/authDb';
import { AuthScreenStyles as styles } from '../styles/AuthScreenStyles.js';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !senha.trim()) {
      Alert.alert('Atenção', 'Preencha e-mail e senha.');
      return;
    }

    // Validação de e-mail: deve conter @ e . e ter texto antes do @
    const emailValido =
      email.includes('@') &&
      email.includes('.') &&
      email.split('@')[0].trim().length > 0;
    if (!emailValido) {
      Alert.alert('Atenção', 'Digite um e-mail válido (ex: nome@exemplo.com).');
      return;
    }

    try {
      setLoading(true);
      const user = await loginUser(email, senha);

      if (!user) {
        Alert.alert('Login inválido', 'E-mail ou senha incorretos.');
        return;
      }

      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível fazer login agora.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0a0f1e" />

      <LinearGradient
        colors={["#0a0f1e", "#0d1a2e", "#0a1520"]}
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
              selectionColor="#00d4ff"
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
              selectionColor="#00d4ff"
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
    </KeyboardAvoidingView>
  );
}
