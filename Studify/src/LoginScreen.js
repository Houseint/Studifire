import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, Animated, ScrollView, TouchableWithoutFeedback, Keyboard, StatusBar, Image} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';



const {width, height} = Dimensions.get('window');


export default function LoginScreen({ navigation }) {
  console.log('navigation', navigation)
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
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
        colors={['#0a0f1e', '#0d1a2e', '#0a1520']}
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
          <Animated.View style={[styles.logoContainer, {
            opacity: fadeAnim,
            transform: [{ scale: logoScale }],
          }]}>
            <View style={styles.logoIconWrapper}>
              {/* Troque por <Image source={require('./assets/logo.png')} style={{ width: 90, height: 90 }} resizeMode="contain" /> */}
              <Image
                source={ require('../img/Logo (2).png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
              {/* Placeholder visual enquanto não tem a imagem real */}
              <LinearGradient
                colors={['#00d4ff', '#0080c0', '#004d80']}
                style={styles.logoIconGradient}
                start={{ x: 0.2, y: 0 }}
                end={{ x: 0.8, y: 1 }}
              >
               
              </LinearGradient>
            </View>
 
            <Text style={styles.logoTitle}>STUDIFY</Text>
            <Text style={styles.logoSubtitle}>PREPARANDO PARA O FUTURO</Text>
          </Animated.View>
 
          {/* Formulário */}
          <Animated.View style={[styles.formContainer, {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }]}>
 
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
            <TouchableOpacity style={styles.entrarButton} activeOpacity={0.85} onPress={()=> {
              console.log('clicou no botao entrar');
              navigation.navigate('Home')}}>
              <LinearGradient
                colors={['#5ab8d4', '#3a9ab8', '#2a7a98']}
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
              É novo por aqui?{' '}
              <Text
                style={styles.footerLink}
                onPress={() => navigation?.navigate('Register')}
              >
                Cadastrar
              </Text>
            </Text>
          </Animated.View>
 
        </ScrollView>
      
    </View>
  );
}
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1e',
  },
 
  // Glow orbs
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
 
  // Header
  header: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  headerText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
 
  // ScrollView
  scrollView: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
 
  // Logo
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoIconWrapper: {
    marginBottom: 12,
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  logoImage: {
    width: 100,
    height: 100
  },
  logoIconGradient: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIconText: {
    fontSize: 40,
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
 
  // Form
  formContainer: {
    width: '100%',
    marginTop: 20,
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
 
  // Botão
  entrarButton: {
    marginTop: 10,
    borderRadius: 30,
    // overflow: 'hidden',
    shadowColor: '#00aacc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  entrarGradient: {
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 30,
  },
  entrarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
 
  // Footer
  footer: {
    alignItems: 'center',
    marginTop: 40,
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

