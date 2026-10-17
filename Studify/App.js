import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './src/screens/HomeScreen';
import StudifyRegisterScreen from './src/screens/RegisterScreen';
import LoginScreen from './src/screens/LoginScreen';
import ProfileScreen from './src/features/profile/ProfileScreen';
import HistoricScreen from './src/screens/HistoricScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import DetailScreen from './src/screens/DetailScreen';
import ChatScreen from './src/screens/ChatScreen';
import HelpScreen from './src/screens/HelpScreen';
import { getSessionUser, getUserById, logoutUser } from './src/features/auth';
import { getUserSettings } from './src/features/subjects';
import { ThemeProvider } from './src/shared/theme/ThemeContext';
import { restoreDailyReminder } from './src/features/reminders';
import ErrorBoundary from './src/components/ErrorBoundary';

// expo-splash-screen com lazy-require: o jest renderiza o App no Node
// (fase0-05) e o módulo nativo não existe lá — mesmo padrão do reminderService.
let Splash = null;
function splash() {
  if (!Splash) Splash = require('expo-splash-screen');
  return Splash;
}

function keepSplash() {
  try {
    splash().preventAutoHideAsync?.()?.catch?.(() => {});
  } catch {
    // fora do Expo Go / no jest: ignora
  }
}

function hideSplash() {
  try {
    splash().hideAsync?.()?.catch?.(() => {});
  } catch {
    // fora do Expo Go / no jest: ignora
  }
}

const Stack = createStackNavigator();

// Tempo mínimo na tela de loading — o bootstrap costuma resolver em <100ms;
// segurar ~500ms evita o "flash" da splash e dá identidade ao app.
const MIN_SPLASH_MS = 500;

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [initialRoute, setInitialRoute] = useState(null);
  const [initialTheme, setInitialTheme] = useState('dark');

  useEffect(() => {
    let mounted = true;
    keepSplash();
    const startedAt = Date.now();

    // Revela a navegação — mas nunca antes de MIN_SPLASH_MS de tela de loading.
    async function reveal(route) {
      const wait = MIN_SPLASH_MS - (Date.now() - startedAt);
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
      if (mounted) {
        setInitialRoute(route);
        hideSplash();
      }
    }

    async function bootstrapSession() {
      try {
        const user = await getSessionUser();
        let hasSession = !!user;

        if (user?.id) {
          const dbUser = await getUserById(user.id);
          hasSession = !!dbUser;
          if (!dbUser) {
            await logoutUser();
          } else {
            // Reagenda o lembrete diário a partir do persistido (fire-and-forget)
            restoreDailyReminder(user.id);
            // Lê o tema persistido antes do 1º render (splash cobre — sem flash)
            try {
              const settings = await getUserSettings(user.id);
              if (mounted && settings?.theme_mode === 'light') setInitialTheme('light');
            } catch {
              // sem tema salvo: segue dark
            }
          }
        }

        await reveal(hasSession ? 'Home' : 'Login');
      } catch {
        await reveal('Login');
      }
    }

    bootstrapSession();

    return () => {
      mounted = false;
    };
  }, []);

  if (!initialRoute) {
    return <SplashLoading />;
  }

  return (
    <ThemeProvider initialMode={initialTheme}>
      <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={StudifyRegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Historic" component={HistoricScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Progress" component={ProgressScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Detail" component={DetailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Help" component={HelpScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}

// Loading com a identidade do app: mark transparente pulsando + wordmark + spinner.
// O pulsar é um loop de escala+brilho (só estética, não trava o bootstrap).
function SplashLoading() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });
  const glow = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });

  return (
    <View style={splashStyles.container}>
      <Animated.Image
        source={require('./assets/splash-icon.png')}
        resizeMode="contain"
        style={[splashStyles.mark, { transform: [{ scale }], opacity: glow }]}
      />
      <Text style={splashStyles.wordmark}>Studify</Text>
      <Text style={splashStyles.tagline}>Seu estudo, organizado.</Text>
      <ActivityIndicator size="small" color="#8A68FF" style={splashStyles.spinner} />
    </View>
  );
}

const splashStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1e', alignItems: 'center', justifyContent: 'center' },
  mark: { width: 150, height: 150 },
  wordmark: { color: '#FFFFFF', fontSize: 34, fontWeight: '800', letterSpacing: 0.5, marginTop: 10 },
  tagline: { color: '#9AA0D8', fontSize: 13, marginTop: 4, letterSpacing: 0.3 },
  spinner: { marginTop: 24 },
});
