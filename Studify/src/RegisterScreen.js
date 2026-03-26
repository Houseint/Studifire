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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

import { RegisterScreenStyles as styles } from './styles/RegisterScreenStyles.js';

const { width, height } = Dimensions.get("window");

export default function StudifyRegisterScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const fadeAnim = useRef(new Animated.Value(0)).current; //esse fadeAnim vai controlar a opacidade, tipo,  vai começar bem clarinho e indo ficando mais visivel
  const slideAnim = useRef(new Animated.Value(40)).current; // o slideAnim faz uma animaçao de slide, o conteudo da tela vai vir de baixo e subirrr, vai ficar top
  const logoScale = useRef(new Animated.Value(0.8)).current; // esse vai fazer um efeito na logo, fazendo ele dar um pulinho.

  useEffect(() => {
    Animated.parallel([
      //o parallel roda todas as animaçoes ao mesmo tempo
      Animated.timing(fadeAnim, {
        //aqui é onde passa as configuraçoes das animaçoes, tais como duraçao, suavidade etc.
        toValue: 1, // tem que usar o 'useEffect' para  para o react native entender a animação
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
    ]).start(); // vai startar as animaçoes quando a tela for aberta, especificadamente quando o usuario navegar para essa tela
  }, []); // esse colchete faz rodar as animaçoes uma vez só

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0f1e" />

      {/*gradiente pro fundo da tela(background) */}
      <LinearGradient //tive de baixar uma dependencia globalmente pra usar gradientes no expo,vai me servir em todas as telas que tiver gradiente
        colors={["#0a0f1e", "#0d1a2e", "#0a1520"]}
        style={StyleSheet.absoluteFillObject}
      />

      {/*orb de iluminaçao  */}
      <View style={styles.glowOrb1} />
      <View style={styles.glowOrb2} />
      {/* //essas orbs é um trampo pra fazer, tipo, cada uma fica em um canto da tela, ai elas brilham, fazendo um efeito de luz natural, um refletido nos componentes da tela, fica bonito */}

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.keyboardView}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* LOGO DO APLICATIVO */}
          <Animated.View //o animated view é uma view que aceita animaçoes, sem segredo 👌
            style={[
              styles.logoContainer,
              { opacity: fadeAnim, transform: [{ scale: logoScale }] }, //dou um caminho pro react native aplicar os efeitos do logoScale
            ]}
          >
            {/* aplicando a logo */}
            <View style={styles.logoIconWrapper}>
              <Image
                source={require("../img/LogoStudifirWithDesc.png")}
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
                transform: [{ translateY: slideAnim }], //apliquei as animaçoes
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
                  autoCapitalize="none" //isso aqui nao deixa a primeira letra maiuscula automaticamente
                  placeholderTextColor="transparent"
                  selectionColor="#00d4ff"
                />
              </View>
            </View>

            {/* Senha */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Senha</Text>
              <View style={styles.inputWrapper}>
                {" "}
                {/*//input wrapper junta todos os inputs deixando mais bonitinho*/}
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