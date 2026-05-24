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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { LoginScreenStyles as styles } from '../styles/LoginScreenStyles.js';
import { loginUser } from '../services/authDb';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !senha.trim()) {
      Alert.alert('Atenção', 'Preencha e-mail e senha.');
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0f1e" />

      <LinearGradient
        colors={["#0a0f1e", "#0d1a2e", "#0a1520"]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <View style={styles.glowOrb1} />
      <View style={styles.glowOrb2} />

      <View style={{ flex: 1, paddingHorizontal: 30, justifyContent: 'center' }}>
        <View style={[styles.logoContainer, { marginBottom: 40 }]}>
          <Image
            source={require("../../img/LogoStudifirWithDesc.png")}
            style={styles.logoImage}
          />
        </View>

        <View style={{ marginBottom: 18 }}>
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

        <View style={{ marginBottom: 18 }}>
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
          style={{
            marginTop: 10,
            borderRadius: 30,
            backgroundColor: '#5ab8d4',
            paddingVertical: 15,
            alignItems: 'center',
          }}
          activeOpacity={0.85}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '700' }}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Text>
        </TouchableOpacity>

        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <Text style={{ color: 'rgba(200, 220, 230, 0.7)', fontSize: 13 }}>
            É novo por aqui?{' '}
            <Text
              style={{ color: '#00c8f0', fontWeight: '700' }}
              onPress={() => navigation?.navigate("Register")}
            >
              Cadastrar
            </Text>
          </Text>
        </View>
      </View>
    </View>
  );
}
