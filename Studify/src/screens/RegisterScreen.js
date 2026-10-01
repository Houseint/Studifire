import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Image,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";


import { registerUser } from '../services/authDb';
import { useTheme } from '../shared/theme/ThemeContext';
import { getAuthScreenStyles } from '../styles/AuthScreenStyles.js';

export default function StudifyRegisterScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getAuthScreenStyles(colors), [colors]);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email.trim() || !senha.trim() || !confirmarSenha.trim()) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
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

    if (senha.length < 6) {
      Alert.alert('Atenção', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (senha !== confirmarSenha) {
      Alert.alert('Atenção', 'As senhas não conferem.');
      return;
    }

    try {
      setLoading(true);
      await registerUser(email, senha);
      Alert.alert('Sucesso', 'Conta criada com sucesso!');
      navigation.navigate('Login');
    } catch (error) {
      const code = error?.code || error?.message;
      if (code === 'EMAIL_EXISTS') {
        Alert.alert('Atenção', 'Este e-mail já está cadastrado.');
      } else if (code === 'DB_UNAVAILABLE') {
        Alert.alert('Erro', 'Não foi possível conectar ao banco de dados. Tente novamente.');
      } else {
        console.error('Erro ao cadastrar usuário:', error);
        Alert.alert('Erro', 'Não foi possível cadastrar agora. Tente novamente.');
      }
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
            style={styles.registerLogo}
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
              placeholderTextColor="transparent"
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
              placeholderTextColor="transparent"
              selectionColor={colors.accent}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Confirmar senha</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
              secureTextEntry
              placeholderTextColor="transparent"
              selectionColor={colors.accent}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.authButton}
          activeOpacity={0.85}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.authButtonText}>
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Já tem uma conta?{' '}
            <Text
              style={styles.footerLink}
              onPress={() => navigation.navigate("Login")}
            >
              Entrar
            </Text>
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
