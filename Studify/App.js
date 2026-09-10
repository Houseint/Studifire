import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Image, StyleSheet, View } from 'react-native';
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
    splash().preventAutohideAsync?.()?.catch?.(() => {});
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

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    let mounted = true;
    keepSplash();

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
          }
        }

        if (mounted) {
          setInitialRoute(hasSession ? 'Home' : 'Login');
          hideSplash();
        }
      } catch {
        if (mounted) {
          setInitialRoute('Login');
          hideSplash();
        }
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
  );
}

// Loading com a identidade do app: logo Studifire pulsando + spinner.
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

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const glow = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] });

  return (
    <View style={splashStyles.container}>
      <Animated.Image
        source={require('./img/LogoStudifirWithDesc.png')}
        resizeMode="contain"
        style={[splashStyles.logo, { transform: [{ scale }], opacity: glow }]}
      />
      <ActivityIndicator size="large" color="#8A68FF" style={splashStyles.spinner} />
    </View>
  );
}

const splashStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1e', alignItems: 'center', justifyContent: 'center' },
  logo: { width: 240, height: 240 },
  spinner: { marginTop: 8 },
});
