import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './src/screens/HomeScreen';
import StudifyRegisterScreen from './src/screens/RegisterScreen';
import LoginScreen from './src/screens/LoginScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import HistoricScreen from './src/screens/HistoricScreen';
import DetailScreen from './src/screens/DetailScreen';
import ChatScreen from './src/screens/ChatScreen';
import HelpScreen from './src/screens/HelpScreen';
import { getSessionUser, getUserById, logoutUser } from './src/services/authDb';
import ErrorBoundary from './src/components/ErrorBoundary';

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

    async function bootstrapSession() {
      try {
        const user = await getSessionUser();
        let hasSession = !!user;

        if (user?.id) {
          const dbUser = await getUserById(user.id);
          hasSession = !!dbUser;
          if (!dbUser) {
            await logoutUser();
          }
        }

        if (mounted) {
          setInitialRoute(hasSession ? 'Home' : 'Login');
        }
      } catch {
        if (mounted) {
          setInitialRoute('Login');
        }
      }
    }

    bootstrapSession();

    return () => {
      mounted = false;
    };
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0f1e', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#5ab8d4" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={StudifyRegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Historic" component={HistoricScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Detail" component={DetailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Help" component={HelpScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
