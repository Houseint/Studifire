import React, { useState, useRef, useEffect } from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, Animated, KeyboardAvoidingView, Platform, StatusBar, Image, ScrollView, TouchableWithoutFeedback, Keyboard } from  'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';


const { width, height } = Dimensions.get('window');

export default function StudifyRegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current; //esse fadeAnim vai controlar a opacidade, tipo,  vai começar bem clarinho e indo ficando mais visivel
  const slideAnim = useRef(new Animated.Value(40)).current;// o slideAnim faz uma animaçao de slide, o conteudo da tela vai vir de baixo e subirrr, vai ficar top
  const logoScale = useRef(new Animated.Value(0.8)).current;// esse vai fazer um efeito na logo, fazendo ele dar um pulinho.

  useEffect(() => {
    Animated.parallel([ //o parallel roda todas as animaçoes ao mesmo tempo
      Animated.timing(fadeAnim, {       //aqui é onde passa as configuraçoes das animaçoes, tais como duraçao, suavidade etc.
        toValue: 1,                     // tem que usar o 'useEffect' para  para o react native entender a animação
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
  }, []);// esse colchete faz rodar as animaçoes uma vez só

  return(
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0f1e" />

      {/*gradiente pro fundo da tela(background) */} 
      <LinearGradient                               //tive de baixar uma dependencia globalmente pra usar gradientes no expo,vai me servir em todas as telas que tiver gradiente
        colors={['#0a0f1e', '#0d1a2e', '#0a1520']}
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
        <Animated.View          //o animated view é uma view que aceita animaçoes, sem segredo 👌
          style={[
            styles.logoContainer,
            { opacity: fadeAnim, transform: [{ scale: logoScale }] }, //dou um caminho pro react native aplicar os efeitos do logoScale
          ]}
        >
          {/* aplicando a logo */}
          <View style={styles.logoIconWrapper}>
            <LinearGradient
              colors={['#00d4ff', '#0080c0', '#004d80']}
              style={styles.logoIconGradient}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
            >
              <Image source={require('../img/Logo (2).png')}
              style={{width: 60, height: 60 }}
              resizeMode= "contain"
              />
            </LinearGradient>
          </View>
          {/* PRECISA MUDAR A LOGO NO FIGMA DE STUDIFY PRA STUDYFIRE */}
          <Text style={styles.logoTitle}>STUDYFIRE</Text>  
          <Text style={styles.logoSubtitle}>PREPARANDO PARA O FUTURO</Text>
        </Animated.View>

        {/* caixas do formulario*/}
        <Animated.View
          style={[
            styles.formContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],//apliquei as animaçoes
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
            <View style={styles.inputWrapper}> {/*//input wrapper junta todos os inputs deixando mais bonitinho*/}
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
          <TouchableOpacity style={styles.cadastrarButton} activeOpacity={0.85} onPress={()=> navigation.navigate("Login")}> 
            <LinearGradient
              colors={['#5ab8d4', '#3a9ab8', '#2a7a98']}
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
            Já tem uma conta?{' '}
            <Text
              style={styles.footerLink}
              onPress={() => navigation.navigate('Login')}
            > Entrar </Text>
          </Text>
        </Animated.View>
        </ScrollView>
        </TouchableWithoutFeedback>
        </View>
  )};



const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#0a0f1e',
    },
    keyboardView: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 60,
      paddingHorizontal: 30,
    },
    glowOrb1: {
      position: 'absolute',
      top: -80,
      left: -60,
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: 'rgba(0, 180, 230, 0.06)',
    },
    glowOrb2: {
      position: 'absolute',
      bottom: 60,
      right: -80,
      width: 260,
      height: 260,
      borderRadius: 130,
      backgroundColor: 'rgba(0, 120, 180, 0.05)',
    },
    // Logo
    logoContainer: {
      alignItems: 'center',
      marginTop: 20,
    },
    logoIconWrapper: {
      marginBottom: 12,
      shadowColor: '#00d4ff',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 20,
      elevation: 10,
    },
    logoIconGradient: {
      width: 90,
      height: 90,
      borderRadius: 45,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoTitle: {
      color: '#00d4ff',
      fontSize: 28,
      fontWeight: '900',
      letterSpacing: 6,
      textShadowColor: 'rgba(0, 212, 255, 0.5)',
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 12,
    },
    logoSubtitle: {
      color: 'rgba(0, 180, 220, 0.7)',
      fontSize: 10,
      letterSpacing: 3,
      marginTop: 4,
      fontWeight: '500',
    },
    formContainer: {
      width: '100%',
    },
    inputGroup: {
      marginBottom: 18,
    },
    inputLabel: {
      color: '#c0d8e8',
      fontSize: 14,
      marginBottom: 6,
      fontWeight: '500',
      letterSpacing: 0.3,
    },
    inputWrapper: {
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      overflow: 'hidden',
    },
    input: {
      height: 50,
      paddingHorizontal: 16,
      color: '#ffffff',
      fontSize: 15,
    },
    cadastrarButton: {
      marginTop: 10,
      borderRadius: 30,
      overflow: 'hidden',
      shadowColor: '#00aacc',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 8,
    },
    cadastrarGradient: {
      paddingVertical: 15,
      alignItems: 'center',
      borderRadius: 30,
    },
    cadastrarText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    footer: {
      alignItems: 'center',
    },
    footerText: {
      color: 'rgba(200, 220, 230, 0.7)',
      fontSize: 13,
    },
    footerLink: {
      color: '#00c8f0',
      fontWeight: '700',
    },
  });