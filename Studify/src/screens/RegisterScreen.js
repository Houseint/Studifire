import React, { useState } from "react";
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

export default function StudifyRegisterScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email.trim() || !senha.trim() || !confirmarSenha.trim()) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
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
      if (error.message === 'EMAIL_EXISTS') {
        Alert.alert('Atenção', 'Este e-mail já está cadastrado.');
      } else {
        Alert.alert('Erro', 'Não foi possível cadastrar agora.');
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
            style={{ width: 300, height: 350 }}
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
              placeholderTextColor="transparent"
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
              placeholderTextColor="transparent"
              selectionColor="#00d4ff"
            />
          </View>
        </View>

        <View style={{ marginBottom: 18 }}>
          <Text style={styles.inputLabel}>Confirmar senha</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
              secureTextEntry
              placeholderTextColor="transparent"
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
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '700' }}>
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </Text>
        </TouchableOpacity>

        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <Text style={{ color: 'rgba(200, 220, 230, 0.7)', fontSize: 13 }}>
            Já tem uma conta?{' '}
            <Text
              style={{ color: '#00c8f0', fontWeight: '700' }}
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
