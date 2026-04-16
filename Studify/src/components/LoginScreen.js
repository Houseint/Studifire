import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Animated,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar,
  Image,
  StyleSheet
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { LoginScreenStyles as styles } from './styles/LoginScreenStyles.js';

const { width, height } = Dimensions.get("window");

export default function LoginScreen({ navigation }) {
  console.log("navigation", navigation);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
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

      {/* Background gradient */}
      <LinearGradient
        colors={["#0a0f1e", "#0d1a2e", "#0a1520"]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Glow orbs */}
      <View style={styles.glowOrb1} />
      <View style={styles.glowOrb2} />

      {/* Header — botão Login no canto superior esquerdo */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <Text style={styles.headerText}>Login</Text>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollView}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <View style={styles.logoIconWrapper}>
            {/* MUDAR O ARQUIVO DA LOGO*/}
            <Image
              source={require("../img/LogoStudifirWithDesc.png")}
              style={styles.logoImage}
            />
          </View>
        </Animated.View>

        {/* Formulário */}
        <Animated.View
          style={[
            styles.formContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* E-mail */}
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

          {/* Senha */}
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

          {/* Botão Entrar */}
          <TouchableOpacity
            style={styles.entrarButton}
            activeOpacity={0.85}
            onPress={() => {
              console.log("clicou no botao entrar");
              navigation.navigate("Home");
            }}
          >
            <LinearGradient
              colors={["#5ab8d4", "#3a9ab8", "#2a7a98"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.entrarGradient}
            >
              <Text style={styles.entrarText}>Entrar</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Footer */}
        <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
          <Text style={styles.footerText}>
            É novo por aqui?{" "}
            <Text
              style={styles.footerLink}
              onPress={() => navigation?.navigate("Register")}
            >
              Cadastrar
            </Text>
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}