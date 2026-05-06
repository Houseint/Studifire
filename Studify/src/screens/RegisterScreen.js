import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Image,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { RegisterScreenStyles as styles } from '../styles/RegisterScreenStyles.js';

const { width, height } = Dimensions.get("window");

export default function StudifyRegisterScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0f1e" />

      {/*gradiente pro fundo da tela(background) */}
      <LinearGradient
        colors={["#0a0f1e", "#0d1a2e", "#0a1520"]}
        style={StyleSheet.absoluteFillObject}
      />

      {/*orb de iluminaçao  */}
      <View style={styles.glowOrb1} />
      <View style={styles.glowOrb2} />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.keyboardView}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* LOGO DO APLICATIVO */}
          <Animated.View
            style={[
              styles.logoContainer,
              { opacity: fadeAnim, transform: [{ scale: logoScale }] },
            ]}
          >
            {/* aplicando a logo */}
            <View style={styles.logoIconWrapper}>
              <Image
                source={require("../../img/LogoStudifirWithDesc.png")}
                style={{ width: 300, height: 350 }}
              />
            </View>
            {/* PRECISA MUDAR A LOGO NO FIGMA DE STUDIFY PRA STUDYFIRE */}
          </Animated.View>

          {/* caixas do formulario*/}
          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* parte do email */}
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
                  selectionColor="#00d4ff"
                />
              </View>
            </View>

            {/* Senha */}
            <View style={styles.inputGroup}>
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

            {/* botao confirmar senha*/}
            <View style={styles.inputGroup}>
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

            {/* o botao de cadastrar */}
            <TouchableOpacity
              style={styles.cadastrarButton}
              activeOpacity={0.85}
              onPress={() => navigation.navigate("Login")}
            >
              <LinearGradient
                colors={["#5ab8d4", "#3a9ab8", "#2a7a98"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cadastrarGradient}
              >
                <Text style={styles.cadastrarText}>Cadastrar</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/*é o footer*/}
          <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
            <Text style={styles.footerText}>
              Já tem uma conta?{" "}
              <Text
                style={styles.footerLink}
                onPress={() => navigation.navigate("Login")}
              >
                {" "}
                Entrar{" "}
              </Text>
            </Text>
          </Animated.View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </View>
  );
}
