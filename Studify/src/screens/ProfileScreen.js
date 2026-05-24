import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProfileScreenStyles as styles } from '../styles/ProfileScreenStyles';
import { getSessionUser, logoutUser } from '../services/authDb';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    getSessionUser().then(setUser);
  }, []);

  const handleLogout = () => {
    Alert.alert('Sair', 'Tem certeza que deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await logoutUser();
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  };

  const initials = user?.email
    ? user.email.charAt(0).toUpperCase()
    : '?';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0f1e" />

      <LinearGradient
        colors={['#0a0f1e', '#0d1a2e', '#0a1520']}
        style={styles.gradientFill}
      />

      <View style={styles.glowOrb1} />
      <View style={styles.glowOrb2} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil</Text>
      </View>

      <View style={styles.profileHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitials}>{initials}</Text>
        </View>
        <Text style={styles.userEmail}>{user?.email || 'Carregando...'}</Text>
      </View>

      <View style={styles.cardsContainer}>
        <View style={styles.cardRow}>
          <View style={styles.card}>
            <View style={[styles.cardIconWrapper, { backgroundColor: 'rgba(90,184,212,0.15)' }]}>
              <Text style={styles.cardIcon}>📚</Text>
            </View>
            <Text style={styles.cardValue}>0</Text>
            <Text style={styles.cardLabel}>Matérias</Text>
          </View>
          <View style={styles.card}>
            <View style={[styles.cardIconWrapper, { backgroundColor: 'rgba(255,159,10,0.15)' }]}>
              <Text style={styles.cardIcon}>📅</Text>
            </View>
            <Text style={styles.cardValue}>0</Text>
            <Text style={styles.cardLabel}>Dias</Text>
          </View>
        </View>
      </View>

      <View style={styles.sairContainer}>
        <TouchableOpacity
          style={styles.historicoButton}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Historic')}
        >
          <Text style={{ fontSize: 18 }}>📋</Text>
          <Text style={styles.historicoButtonText}>Histórico</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sairButton}
          activeOpacity={0.7}
          onPress={handleLogout}
        >
          <Text style={{ fontSize: 18 }}>🚪</Text>
          <Text style={styles.sairButtonText}>Sair da conta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
